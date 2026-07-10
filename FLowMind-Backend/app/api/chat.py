import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import StreamingResponse

from app.database import get_db
from app.models import Conversation, Message
from app.schemas.chat import StreamRequest
from app.schemas.conversations import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationResponse,
    ConversationSearchResponse,
    ConversationUpdate,
    MessageAddRequest,
)
from app.services.chat import ChatService
from app.services.conversation import ConversationService
from app.services.embedding import EmbeddingService
from app.services.memory import MemoryService
from app.services.message import MessageService
from app.services.usage_tracking import UsageTrackingService

logger = logging.getLogger("flowmind")

router = APIRouter(prefix="/v1")


def get_conversation_service(request: Request, db: AsyncSession = Depends(get_db)) -> ConversationService:
    return ConversationService(db)


def get_message_service(request: Request, db: AsyncSession = Depends(get_db)) -> MessageService:
    chat_service = request.app.state.chat_service
    usage_tracking = UsageTrackingService(db)
    return MessageService(db, chat_service, usage_tracking)


def get_embedding_service(request: Request) -> EmbeddingService:
    return request.app.state.embedding_service


def get_memory_service(
    request: Request,
    db: AsyncSession = Depends(get_db),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
) -> MemoryService:
    settings = getattr(request.app.state, "settings", None)
    usage_tracking = UsageTrackingService(db)
    return MemoryService(db, embedding_service, settings, usage_tracking)


@router.post("/conversations", status_code=201)
async def create_conversation(
    body: ConversationCreate,
    request: Request,
    service: ConversationService = Depends(get_conversation_service),
):
    user_id = request.state.user_id
    conv = await service.create(user_id=user_id, title=body.title)
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


@router.get("/conversations")
async def list_conversations(
    request: Request,
    service: ConversationService = Depends(get_conversation_service),
):
    user_id = request.state.user_id
    convs = await service.list_by_user(user_id)
    return [
        ConversationResponse(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in convs
    ]


@router.get("/conversations/search")
async def search_conversations(
    q: str,
    request: Request,
    service: ConversationService = Depends(get_conversation_service),
):
    user_id = request.state.user_id
    results = await service.search(user_id, q)
    return ConversationSearchResponse(results=results)


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    request: Request,
    conv_service: ConversationService = Depends(get_conversation_service),
):
    user_id = request.state.user_id
    conv = await conv_service.get_by_id(str(conversation_id), user_id)
    if conv is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "metadata": m.metadata_,
            "created_at": m.created_at,
        }
        for m in conv.messages
    ]
    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages,
    )


@router.put("/conversations/{conversation_id}")
async def update_conversation(
    conversation_id: UUID,
    body: ConversationUpdate,
    request: Request,
    service: ConversationService = Depends(get_conversation_service),
):
    user_id = request.state.user_id
    conv = await service.update_title(str(conversation_id), user_id, body.title)
    if conv is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: UUID,
    request: Request,
    service: ConversationService = Depends(get_conversation_service),
):
    user_id = request.state.user_id
    deleted = await service.delete(str(conversation_id), user_id)
    if not deleted:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")


@router.post("/conversations/{conversation_id}/generate-title")
async def generate_conversation_title(
    conversation_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    conv_service: ConversationService = Depends(get_conversation_service),
):
    from app.schemas.chat import ChatMessage, ChatRequest

    user_id = request.state.user_id
    conv = await conv_service.get_by_id(str(conversation_id), user_id)
    if conv is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    first_user_msg = None
    first_assistant_msg = None
    for msg in conv.messages:
        if msg.role == "user" and first_user_msg is None:
            first_user_msg = msg.content
        elif msg.role == "assistant" and first_assistant_msg is None:
            first_assistant_msg = msg.content
        if first_user_msg and first_assistant_msg:
            break

    if not first_user_msg:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail="No user messages found in this conversation",
        )

    chat_service: ChatService = request.app.state.chat_service
    user_content = f"User:\n{first_user_msg}"
    if first_assistant_msg:
        user_content += f"\n\nAssistant:\n{first_assistant_msg}"

    llm_request = ChatRequest(
        messages=[
            ChatMessage(
                role="system",
                content=(
                    "Generate a concise chat title.\n\n"
                    "Requirements:\n"
                    "- Identify the main topic, not the answer.\n"
                    "- Act like a title shown in a chat sidebar.\n"
                    "- Use noun phrases whenever possible.\n"
                    "- Maximum 5 words.\n"
                    "- No punctuation.\n"
                    "- No quotes.\n"
                    "- Title case.\n"
                    "- Return only the title.\n\n"
                    "Examples:\n\n"
                    "User: How expensive are tokens in large AI models?\n"
                    "Title: AI Model Token Pricing\n\n"
                    "User: Compare RAG and fine tuning\n"
                    "Title: RAG vs Fine Tuning\n\n"
                    "User: How do I implement memory in an AI chatbot?\n"
                    "Title: AI Chatbot Memory\n\n"
                    "User: Best way to deploy FastAPI on AWS EC2\n"
                    "Title: FastAPI AWS Deployment"
                ),
            ),
            ChatMessage(role="user", content=user_content),
        ],
    )
    response = await chat_service.chat(llm_request)

    if response.usage:
        usage_tracking = UsageTrackingService(db)
        usage = response.usage
        details = usage.get("prompt_tokens_details") or {}
        await usage_tracking.track_usage(
            user_id=user_id,
            conversation_id=str(conversation_id),
            provider="deepseek",
            model=response.model_dump().get("model", chat_service.default_model),
            feature="title_generation",
            input_tokens=usage.get("prompt_tokens", 0) or 0,
            output_tokens=usage.get("completion_tokens", 0) or 0,
            cached_input_tokens=(details.get("cached_tokens", 0) or 0) if isinstance(details, dict) else 0,
        )

    title = response.choices[0]["message"]["content"].strip().strip('"').strip("'")

    words = title.split()
    if len(words) > 5:
        title = " ".join(words[:5])

    if not title:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Title generation returned empty result")

    conv.title = title
    conv.title_generated = True
    conv.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(conv)

    logger.info("Title generated for conversation %s: %s", conversation_id, title)
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        title_generated=conv.title_generated,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


@router.post("/conversations/{conversation_id}/messages")
async def add_message(
    conversation_id: UUID,
    body: MessageAddRequest,
    request: Request,
    service: MessageService = Depends(get_message_service),
):
    user_id = request.state.user_id
    try:
        resp = await service.add_message(str(conversation_id), user_id, body)
        return resp
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")


async def run_memory_extraction(
    user_id: str,
    conversation_id: str,
    user_message: str,
):
    from app.config import Settings as AppSettings
    from app.database import async_session_factory as db_session_factory

    settings = AppSettings()
    if not settings.openai_api_key:
        logger.info("Memory extraction skipped: no OPENAI_API_KEY configured")
        return

    if db_session_factory is None:
        logger.warning("Memory extraction skipped: database not initialized")
        return

    async with db_session_factory() as db:
        try:
            embedding_service = EmbeddingService(settings)
            chat_service = ChatService(settings)
            usage_tracking = UsageTrackingService(db)
            memory_service = MemoryService(db, embedding_service, settings, usage_tracking)

            result = await db.execute(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at.desc())
                .limit(1)
            )
            last_msg = result.scalar_one_or_none()
            if last_msg is None or last_msg.role != "assistant":
                logger.info("Memory extraction skipped: no assistant message found")
                return

            assistant_message = last_msg.content or ""
            if not assistant_message.strip():
                logger.info("Memory extraction skipped: empty assistant response")
                return

            memories = await memory_service.extract_from_exchange(
                user_id=user_id,
                user_message=user_message,
                assistant_message=assistant_message,
                chat_service=chat_service,
            )

            if memories:
                facts = [f"  - {m.memory_type}: {m.memory[:120]}" for m in memories]
                logger.info(
                    "Memory extraction complete: %d memory(ies) created for user %s\n%s",
                    len(memories),
                    user_id,
                    "\n".join(facts),
                )
            else:
                logger.info(
                    "Memory extraction complete: 0 memories created for user %s (no new facts detected)",
                    user_id,
                )
        except Exception:
            logger.exception("Memory extraction failed for user %s conversation %s", user_id, conversation_id)


@router.post("/stream")
async def stream_chat_completion(
    body: StreamRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    service: MessageService = Depends(get_message_service),
    memory_service: MemoryService = Depends(get_memory_service),
    db: AsyncSession = Depends(get_db),
):
    user_id = request.state.user_id
    conversation_id = str(body.conversation_id) if body.conversation_id else None

    if conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        if result.scalar_one_or_none() is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Conversation not found")

    last_user_msg = ""
    for msg in body.messages:
        text = msg["content"] if isinstance(msg, dict) else (msg.content or "")
        if text:
            last_user_msg = text

    memory_context = None
    try:
        relevant = await memory_service.retrieve_relevant(user_id, last_user_msg)
        if relevant:
            parts = []
            for mem, score in relevant:
                parts.append(f"- {mem.memory} (type: {mem.memory_type}, relevance: {score:.2f})")
            memory_context = (
                "Here are things you know about the user from previous conversations:\n" + "\n".join(parts)
            )
    except Exception:
        logger.warning("Memory retrieval failed, proceeding without memory context", exc_info=True)

    stream_meta: dict = {}
    stream_gen = service.stream_add_message(
        conversation_id=conversation_id,
        user_id=user_id,
        messages=body.messages,
        memory_context=memory_context,
        stream_meta=stream_meta,
    )

    settings = request.app.state.settings

    async def _stream_with_extraction():
        async for chunk in stream_gen:
            yield chunk

        actual_conv_id = stream_meta.get("conversation_id") or conversation_id
        if actual_conv_id and settings and settings.openai_api_key:
            background_tasks.add_task(
                run_memory_extraction,
                user_id=user_id,
                conversation_id=actual_conv_id,
                user_message=last_user_msg,
            )

    return StreamingResponse(
        _stream_with_extraction(),
        media_type="text/event-stream",
        background=background_tasks,
    )


@router.delete("/messages/{message_id}", status_code=204)
async def delete_message(
    message_id: UUID,
    request: Request,
    service: MessageService = Depends(get_message_service),
):
    user_id = request.state.user_id
    deleted = await service.delete_message(str(message_id), user_id)
    if not deleted:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Message not found")
