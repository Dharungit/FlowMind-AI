import json
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Message
from app.schemas.chat import ChatMessage, ChatRequest
from app.schemas.conversations import MessageAddRequest, MessageResponse
from app.services.chat import ChatService
from app.services.usage_tracking import UsageTrackingService


def _extract_usage(usage: dict | None) -> dict:
    # log the useage for debugging purposes
    if usage:
        print(f"Usage data: {usage}")
    if not usage:
        return {"input_tokens": 0, "output_tokens": 0, "cached_input_tokens": 0}
    cached = 0
    details = usage.get("prompt_tokens_details") or {}
    if isinstance(details, dict):
        cached = details.get("cached_tokens", 0) or 0
    return {
        "input_tokens": usage.get("prompt_tokens", 0) or 0,
        "output_tokens": usage.get("completion_tokens", 0) or 0,
        "cached_input_tokens": cached,
    }


class MessageService:
    def __init__(self, db: AsyncSession, chat_service: ChatService, usage_tracking_service: UsageTrackingService | None = None):
        self.db = db
        self.chat_service = chat_service
        self.usage_tracking = usage_tracking_service

    async def add_message(
        self,
        conversation_id: str,
        user_id: str,
        request: MessageAddRequest,
    ) -> MessageResponse:
        result = await self.db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        conversation = result.scalar_one_or_none()
        if conversation is None:
            raise ValueError("Conversation not found")

        history_result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        history = list(history_result.scalars().all())

        all_messages = []
        for msg in history:
            all_messages.append(ChatMessage(role=msg.role, content=msg.content))
        for msg in request.messages:
            all_messages.append(ChatMessage(role=msg.role, content=msg.content))

        user_msg = Message(
            conversation_id=conversation_id,
            role=request.messages[-1].role,
            content=request.messages[-1].content,
        )
        self.db.add(user_msg)
        await self.db.flush()

        chat_req = ChatRequest(messages=all_messages)
        chat_resp = await self.chat_service.chat(chat_req)

        assistant_content = None
        if chat_resp.choices:
            choice = chat_resp.choices[0]
            if isinstance(choice, dict):
                msg = choice.get("message", {})
                if isinstance(msg, dict):
                    assistant_content = msg.get("content")

        assistant_msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_content,
            metadata_={"raw_response": chat_resp.model_dump() if hasattr(chat_resp, "model_dump") else chat_resp},
        )
        self.db.add(assistant_msg)

        conversation.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(assistant_msg)

        if self.usage_tracking and chat_resp.usage:
            tu = _extract_usage(chat_resp.usage)
            await self.usage_tracking.track_usage(
                user_id=user_id,
                conversation_id=conversation_id,
                message_id=str(assistant_msg.id),
                provider="deepseek",
                model=chat_resp.model_dump().get("model", self.chat_service.default_model),
                feature="chat",
                **tu,
            )

        return MessageResponse(
            id=assistant_msg.id or uuid.uuid4(),
            role=assistant_msg.role,
            content=assistant_msg.content,
            metadata=assistant_msg.metadata_,
            created_at=assistant_msg.created_at or datetime.now(timezone.utc),
        )

    async def stream_add_message(
        self,
        conversation_id: str | None,
        user_id: str,
        messages: list[ChatMessage],
        memory_context: str | None = None,
        stream_meta: dict | None = None,
    ) -> AsyncGenerator[bytes, None]:
        if conversation_id:
            result = await self.db.execute(
                select(Conversation).where(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user_id,
                )
            )
            conversation = result.scalar_one_or_none()
            if conversation is None:
                raise ValueError("Conversation not found")
        else:
            conversation = Conversation(user_id=user_id)
            self.db.add(conversation)
            await self.db.flush()
            conversation_id = str(conversation.id)
            if stream_meta is not None:
                stream_meta["conversation_id"] = conversation_id

        history_result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        history = list(history_result.scalars().all())

        all_messages = []
        if memory_context:
            all_messages.append(ChatMessage(role="system", content=memory_context))
        for msg in history:
            all_messages.append(ChatMessage(role=msg.role, content=msg.content))
        for msg in messages:
            if isinstance(msg, dict):
                all_messages.append(ChatMessage(role=msg["role"], content=msg.get("content")))
            else:
                all_messages.append(ChatMessage(role=msg.role, content=msg.content))

        last = messages[-1]
        last_role = last["role"] if isinstance(last, dict) else last.role
        last_content = last.get("content") if isinstance(last, dict) else last.content
        user_msg = Message(
            conversation_id=conversation_id,
            role=last_role,
            content=last_content,
        )
        self.db.add(user_msg)
        await self.db.flush()

        assistant_msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=None,
        )
        self.db.add(assistant_msg)
        await self.db.flush()

        chat_req = ChatRequest(messages=all_messages)

        yield _sse_event({"type": "meta", "conversation_id": conversation_id})

        content_parts = []
        usage = None
        error = None
        try:
            async for chunk in self.chat_service.stream_chat(chat_req):
                delta = (
                    chunk.get("choices", [{}])[0]
                    .get("delta", {})
                )
                delta_content = delta.get("content")
                if delta_content:
                    content_parts.append(delta_content)
                if chunk.get("usage"):
                    usage = chunk["usage"]
                yield _sse_event(chunk)

            full_content = "".join(content_parts)
        except Exception as e:
            full_content = "".join(content_parts)
            error = {"message": str(e), "type": type(e).__name__}
        finally:
            assistant_msg.content = full_content or None
            meta = {}
            if usage:
                meta["usage"] = usage
            if error:
                meta["error"] = error
            assistant_msg.metadata_ = meta if meta else None
            conversation.updated_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(assistant_msg)

            if self.usage_tracking and usage:
                tu = _extract_usage(usage)
                await self.usage_tracking.track_usage(
                    user_id=user_id,
                    conversation_id=conversation_id,
                    message_id=str(assistant_msg.id),
                    provider="deepseek",
                    model=self.chat_service.default_model,
                    feature="chat",
                    **tu,
                )

        if error:
            yield _sse_event({
                "error": error["message"],
                "type": "error",
                "conversation_id": conversation_id,
                "message": _message_response(assistant_msg),
            })
        else:
            yield _sse_event({
                "done": True,
                "conversation_id": conversation_id,
                "message": _message_response(assistant_msg),
            })

    async def delete_message(self, message_id: str, user_id: str) -> bool:
        result = await self.db.execute(
            select(Message).join(Message.conversation).where(
                Message.id == message_id,
                Conversation.user_id == user_id,
            )
        )
        msg = result.scalar_one_or_none()
        if msg is None:
            return False
        await self.db.delete(msg)
        await self.db.commit()
        return True


def _sse_event(data: dict) -> bytes:
    return b"data: " + json.dumps(data).encode() + b"\n\n"


def _message_response(msg: Message) -> dict:
    return {
        "id": str(msg.id),
        "role": msg.role,
        "content": msg.content,
        "metadata": msg.metadata_,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }
