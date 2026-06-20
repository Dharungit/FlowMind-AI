from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MemoryResponse(BaseModel):
    id: UUID
    memory: str
    memory_type: str
    importance: float
    access_count: int
    last_accessed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class MemoryExtractionItem(BaseModel):
    memory: str
    memory_type: str = "fact"
    importance: float = 0.5


class MemoryUpdate(BaseModel):
    importance: float | None = None
