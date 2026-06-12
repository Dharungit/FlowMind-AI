from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.conversations import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationResponse,
    ConversationUpdate,
    MessageAddRequest,
)
from app.services.conversation import ConversationService
from app.services.message import MessageService

router = APIRouter(prefix="/v1")


def get_conversation_service(request: Request, db: AsyncSession = Depends(get_db)) -> ConversationService:
    return ConversationService(db)


def get_message_service(request: Request, db: AsyncSession = Depends(get_db)) -> MessageService:
    chat_service = request.app.state.chat_service
    return MessageService(db, chat_service)


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
