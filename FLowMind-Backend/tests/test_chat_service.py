import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.chat import ChatService
from app.schemas.chat import ChatRequest, ChatMessage


class AsyncStreamMock:
    def __init__(self, chunks):
        self._chunks = chunks
        self._index = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._index >= len(self._chunks):
            raise StopAsyncIteration
        chunk = self._chunks[self._index]
        self._index += 1
        return chunk


@pytest.mark.asyncio
async def test_chat_non_streaming(settings):
    service = ChatService(settings)

    mock_response = MagicMock()
    mock_response.model_dump.return_value = {
        "id": "chatcmpl-mock-123",
        "object": "chat.completion",
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": "Hello, world!"},
            "finish_reason": "stop",
        }],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
    }

    service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    req = ChatRequest(messages=[ChatMessage(role="user", content="Hi")])
    result = await service.chat(req)

    assert result.id == "chatcmpl-mock-123"
    assert result.choices[0]["message"]["content"] == "Hello, world!"

    service.client.chat.completions.create.assert_called_once()
    call_kwargs = service.client.chat.completions.create.call_args.kwargs
    assert call_kwargs["model"] == "deepseek-chat"
    assert call_kwargs["stream"] is False


@pytest.mark.asyncio
async def test_chat_streaming(settings):
    service = ChatService(settings)

    chunk = MagicMock()
    chunk.model_dump.return_value = {
        "id": "chatcmpl-mock-456",
        "object": "chat.completion.chunk",
        "choices": [{"index": 0, "delta": {"content": "Hello"}, "finish_reason": None}],
    }
    stream = AsyncStreamMock([chunk])

    service.client.chat.completions.create = AsyncMock(return_value=stream)

    req = ChatRequest(messages=[ChatMessage(role="user", content="Hi")], stream=True)
    chunks = [c async for c in service.stream_chat(req)]

    assert len(chunks) == 1
    assert chunks[0]["id"] == "chatcmpl-mock-456"
    assert chunks[0]["choices"][0]["delta"]["content"] == "Hello"
    service.client.chat.completions.create.assert_called_once()
    call_kwargs = service.client.chat.completions.create.call_args.kwargs
    assert call_kwargs["stream"] is True


@pytest.mark.asyncio
async def test_chat_uses_model_from_request(settings):
    service = ChatService(settings)
    mock_resp = MagicMock()
    mock_resp.model_dump.return_value = {
        "id": "mock", "object": "chat.completion", "choices": [], "usage": None,
    }
    service.client.chat.completions.create = AsyncMock(return_value=mock_resp)

    req = ChatRequest(
        messages=[ChatMessage(role="user", content="Hi")],
        model="gpt-4",
    )
    await service.chat(req)
    assert service.client.chat.completions.create.call_args.kwargs["model"] == "gpt-4"
