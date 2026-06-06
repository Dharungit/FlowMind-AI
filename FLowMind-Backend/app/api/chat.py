from fastapi import APIRouter, Depends, Request
from starlette.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.chat import ChatService

router = APIRouter(prefix="/v1")


async def get_service(request: Request) -> ChatService:
    return request.app.state.chat_service


@router.post("/chat/completions")
async def chat_completion(
    request: ChatRequest,
    service: ChatService = Depends(get_service),
):
    if request.stream:
        return StreamingResponse(
            service.stream_chat(request),
            media_type="text/event-stream",
        )
    result = await service.chat(request)
    return result
