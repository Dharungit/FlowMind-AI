from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from app.config import Settings
from app.schemas.chat import ChatRequest, ChatResponse


class ChatService:
    def __init__(self, settings: Settings) -> None:
        self.client = AsyncOpenAI(
            base_url=settings.provider_base_url,
            api_key=settings.provider_api_key,
        )
        self.default_model = settings.provider_default_model

    async def chat(self, request: ChatRequest) -> ChatResponse:
        kwargs = self._build_kwargs(request)
        kwargs["stream"] = False
        raw = await self.client.chat.completions.create(**kwargs)
        data = raw.model_dump()
        return ChatResponse(**data)

    async def stream_chat(self, request: ChatRequest) -> AsyncGenerator[bytes, None]:
        kwargs = self._build_kwargs(request)
        kwargs["stream"] = True
        stream = await self.client.chat.completions.create(**kwargs)
        async for chunk in stream:
            yield b"data: " + chunk.model_dump_json().encode() + b"\n\n"
        yield b"data: [DONE]\n\n"

    def _build_kwargs(self, request: ChatRequest) -> dict:
        kwargs = request.model_dump(exclude_none=True)
        kwargs["messages"] = [m.model_dump(exclude_none=True) for m in request.messages]
        if request.tools is not None:
            kwargs["tools"] = [t.model_dump(exclude_none=True) for t in request.tools]
        kwargs["model"] = request.model or self.default_model
        kwargs.pop("stream", None)
        return kwargs
