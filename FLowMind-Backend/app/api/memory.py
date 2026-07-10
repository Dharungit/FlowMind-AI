import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.memory import MemoryResponse
from app.services.embedding import EmbeddingService
from app.services.memory import MemoryService

logger = logging.getLogger("flowmind")

router = APIRouter(prefix="/v1")


def get_embedding_service(request: Request) -> EmbeddingService:
    return request.app.state.embedding_service


def get_memory_service(
    request: Request,
    db: AsyncSession = Depends(get_db),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
) -> MemoryService:
    settings = getattr(request.app.state, "settings", None)
    return MemoryService(db, embedding_service, settings)


@router.get("/memories")
async def list_memories(
    request: Request,
    memory_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
    service: MemoryService = Depends(get_memory_service),
):
    user_id = request.state.user_id
    memories = await service.get_user_memories(
        user_id=user_id,
        memory_type=memory_type,
        limit=limit,
        offset=offset,
    )
    count = await service.get_memory_count(user_id)
    max_mem = service.max_per_user
    return {
        "memories": [
            MemoryResponse(
                id=m.id,
                memory=m.memory,
                memory_type=m.memory_type,
                importance=m.importance,
                access_count=m.access_count,
                last_accessed_at=m.last_accessed_at,
                created_at=m.created_at,
                updated_at=m.updated_at,
            )
            for m in memories
        ],
        "usage": {
            "count": count,
            "max": max_mem,
            "percentage": round(count / max_mem, 4) if max_mem > 0 else 0.0,
        },
    }


@router.get("/users/me/memory-usage")
async def memory_usage(
    request: Request,
    service: MemoryService = Depends(get_memory_service),
):
    user_id = request.state.user_id
    count = await service.get_memory_count(user_id)
    max_mem = service.max_per_user
    return {
        "count": count,
        "max": max_mem,
        "percentage": round(count / max_mem, 4) if max_mem > 0 else 0.0,
    }


@router.delete("/memories/{memory_id}")
async def delete_memory(
    memory_id: str,
    request: Request,
    service: MemoryService = Depends(get_memory_service),
):
    user_id = request.state.user_id
    deleted = await service.delete_memory(memory_id, user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    return {"deleted": True}
