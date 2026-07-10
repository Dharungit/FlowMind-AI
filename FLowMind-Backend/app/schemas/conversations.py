from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: str = "New Conversation"


class ConversationUpdate(BaseModel):
    title: str


class MessageItem(BaseModel):
    role: str
    content: str | None = None
    tool_call_id: str | None = None
    name: str | None = None


class MessageAddRequest(BaseModel):
    messages: list[MessageItem]


class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str | None = None
    metadata: dict | None = None
    created_at: datetime


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    title_generated: bool = False
    created_at: datetime
    updated_at: datetime


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse]


class ConversationSearchResult(BaseModel):
    conversation_id: UUID
    title: str
    matched_text: str
    created_at: datetime
    updated_at: datetime


class ConversationSearchResponse(BaseModel):
    results: list[ConversationSearchResult]
