import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Message
from app.schemas.chat import ChatMessage, ChatRequest
from app.schemas.conversations import MessageAddRequest, MessageItem, MessageResponse
from app.services.chat import ChatService


class MessageService:
    def __init__(self, db: AsyncSession, chat_service: ChatService):
        self.db = db
        self.chat_service = chat_service

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

        return MessageResponse(
            id=assistant_msg.id,
            role=assistant_msg.role,
            content=assistant_msg.content,
            metadata=assistant_msg.metadata_,
            created_at=assistant_msg.created_at,
        )

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
