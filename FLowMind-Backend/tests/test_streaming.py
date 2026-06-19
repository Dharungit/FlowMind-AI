import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from starlette.testclient import TestClient

from app.api.chat import get_message_service
from app.database import get_db
from app.main import create_app
from app.models import Conversation, Message
from app.schemas.chat import ChatRequest
from app.services.chat import ChatService
from app.services.message import MessageService
from app.services.token import TokenService


def _mock_chat_service_stream(settings):
    service = ChatService(settings)

    async def fake_stream(_request: ChatRequest):
        yield {"id": "cmpl-1", "object": "chat.completion.chunk", "choices": [{"index": 0, "delta": {"content": "Hello"}, "finish_reason": None}], "usage": None}
        yield {"id": "cmpl-2", "object": "chat.completion.chunk", "choices": [{"index": 0, "delta": {"content": " world"}, "finish_reason": None}], "usage": None}
        yield {"id": "cmpl-3", "object": "chat.completion.chunk", "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}], "usage": {"prompt_tokens": 10, "completion_tokens": 2, "total_tokens": 12}}

    service.stream_chat = fake_stream
    return service


def _mock_db_for_stream():
    db = MagicMock()
    conv = MagicMock(spec=Conversation)
    conv.id = uuid4()
    conv.user_id = "user-123"
    conv.updated_at = datetime.now(timezone.utc)
    conv.title = "New Conversation"
    conv.created_at = datetime.now(timezone.utc)

    msg = MagicMock(spec=Message)
    msg.id = uuid4()
    msg.role = "assistant"
    msg.content = "Hello world"
    msg.metadata_ = {"usage": {"prompt_tokens": 10, "completion_tokens": 2, "total_tokens": 12}}
    msg.created_at = datetime.now(timezone.utc)
    msg.conversation_id = conv.id

    result = MagicMock()
    result.scalar_one_or_none.return_value = conv

    history_result = MagicMock()
    history_result.scalars.return_value.all.return_value = []

    db.execute = AsyncMock(side_effect=[result, result, history_result])
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    return db


def _mock_msg_service_stream():
    service = MagicMock(spec=MessageService)
    service.stream_add_message = AsyncMock()
    return service


def _app(settings):
    app = create_app(settings)
    app.state.settings = settings
    app.state.token_service = TokenService(settings)
    return app


def _auth_headers(token_service: TokenService) -> dict:
    token = token_service.generate_access_token("user-123", "test@example.com")
    return {"Authorization": f"Bearer {token}"}


def test_stream_returns_sse_format(settings):
    app = _app(settings)
    chat_service = _mock_chat_service_stream(settings)
    db = _mock_db_for_stream()
    msg_service = MessageService(db, chat_service)
    app.dependency_overrides[get_message_service] = lambda: msg_service
    app.dependency_overrides[get_db] = lambda: db

    client = TestClient(app)
    token_service = TokenService(settings)

    with client.stream(
        "POST",
        "/v1/stream",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers=_auth_headers(token_service),
    ) as resp:
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/event-stream")

        raw = b"".join(resp.iter_bytes())
        events = [
            json.loads(part.removeprefix("data: ").strip())
            for part in raw.decode().split("\n\n")
            if part.strip()
        ]
        assert len(events) > 2

        assert events[0]["type"] == "meta"
        assert "conversation_id" in events[0]

        last = events[-1]
        assert last.get("done") is True
        assert "conversation_id" in last
        assert last["message"]["role"] == "assistant"
        assert last["message"]["content"] == "Hello world"


def test_stream_with_existing_conversation(settings):
    app = _app(settings)
    chat_service = _mock_chat_service_stream(settings)
    db = _mock_db_for_stream()

    msg_service = MessageService(db, chat_service)
    app.dependency_overrides[get_message_service] = lambda: msg_service
    app.dependency_overrides[get_db] = lambda: db

    client = TestClient(app)
    token_service = TokenService(settings)
    conv_id = uuid4()

    with client.stream(
        "POST",
        "/v1/stream",
        json={"conversation_id": str(conv_id), "messages": [{"role": "user", "content": "Tell me more"}]},
        headers=_auth_headers(token_service),
    ) as resp:
        assert resp.status_code == 200
        raw = b"".join(resp.iter_bytes())
        events = [
            json.loads(part.removeprefix("data: ").strip())
            for part in raw.decode().split("\n\n")
            if part.strip()
        ]
        assert events[0]["conversation_id"] == str(conv_id)


def test_stream_requires_auth(settings):
    app = _app(settings)
    client = TestClient(app)

    resp = client.post("/v1/stream", json={"messages": [{"role": "user", "content": "Hi"}]})
    assert resp.status_code == 401


def test_stream_unknown_conversation_returns_404(settings):
    app = _app(settings)
    db = MagicMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=result)
    chat_service = _mock_chat_service_stream(settings)
    msg_service = MessageService(db, chat_service)
    app.dependency_overrides[get_message_service] = lambda: msg_service
    app.dependency_overrides[get_db] = lambda: db

    client = TestClient(app)
    token_service = TokenService(settings)

    resp = client.post(
        "/v1/stream",
        json={"conversation_id": str(uuid4()), "messages": [{"role": "user", "content": "Hi"}]},
        headers=_auth_headers(token_service),
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_stream_add_message_service(settings):
    chat_service = _mock_chat_service_stream(settings)
    db = _mock_db_for_stream()

    service = MessageService(db, chat_service)

    stream = service.stream_add_message(
        conversation_id=None,
        user_id="user-123",
        messages=[{"role": "user", "content": "Hi"}],
    )

    raw = b"".join([chunk async for chunk in stream])
    events = [
        json.loads(part.removeprefix("data: ").strip())
        for part in raw.decode().split("\n\n")
        if part.strip()
    ]

    assert len(events) >= 3
    assert events[0]["type"] == "meta"
    assert "conversation_id" in events[0]

    for event in events[1:-1]:
        assert "choices" in event

    last = events[-1]
    assert last["done"] is True
    assert last["message"]["content"] == "Hello world"
    assert last["message"]["role"] == "assistant"
    assert "conversation_id" in last


@pytest.mark.asyncio
async def test_stream_handles_existing_non_streaming_endpoint(settings):
    app = _app(settings)
    chat_service = _mock_chat_service_stream(settings)

    mock_resp = MagicMock()
    mock_resp.model_dump.return_value = {
        "id": "cmpl-test",
        "object": "chat.completion",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": "Mock reply"}, "finish_reason": "stop"}],
        "usage": None,
    }
    chat_service.client.chat.completions.create = AsyncMock(return_value=mock_resp)

    db = _mock_db_for_stream()
    msg_service = MessageService(db, chat_service)
    app.dependency_overrides[get_message_service] = lambda: msg_service
    app.dependency_overrides[get_db] = lambda: db

    from app.api.chat import get_conversation_service
    from app.services.conversation import ConversationService

    conv_service = MagicMock(spec=ConversationService)
    conv = MagicMock()
    conv.id = uuid4()
    conv.title = "Test"
    conv.created_at = datetime.now(timezone.utc)
    conv.updated_at = datetime.now(timezone.utc)
    conv.messages = []
    conv_service.get_by_id = AsyncMock(return_value=conv)
    app.dependency_overrides[get_conversation_service] = lambda: conv_service

    client = TestClient(app)
    token_service = TokenService(settings)
    conv_id = uuid4()

    resp = client.post(
        f"/v1/conversations/{conv_id}/messages",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers=_auth_headers(token_service),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "assistant"
    assert data["content"] == "Mock reply"


def test_stream_disconnect_mid_stream_saves_partial(settings):
    app = _app(settings)
    chat_service = _mock_chat_service_stream(settings)
    db = _mock_db_for_stream()
    msg_service = MessageService(db, chat_service)
    app.dependency_overrides[get_message_service] = lambda: msg_service
    app.dependency_overrides[get_db] = lambda: db

    client = TestClient(app)
    token_service = TokenService(settings)

    with client.stream(
        "POST",
        "/v1/stream",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers=_auth_headers(token_service),
    ) as resp:
        assert resp.status_code == 200
        next(resp.iter_bytes())

    assert db.commit.called, "Expected db.commit to be called on disconnect cleanup"


def test_stream_openai_error_mid_stream(settings):
    app = _app(settings)

    chat_service = ChatService(settings)
    async def error_stream(_request):
        yield {"id": "cmpl-1", "object": "chat.completion.chunk", "choices": [{"index": 0, "delta": {"content": "Hello"}, "finish_reason": None}], "usage": None}
        raise RuntimeError("OpenAI API connection failed")
    chat_service.stream_chat = error_stream

    db = _mock_db_for_stream()
    msg_service = MessageService(db, chat_service)
    app.dependency_overrides[get_message_service] = lambda: msg_service
    app.dependency_overrides[get_db] = lambda: db

    client = TestClient(app)
    token_service = TokenService(settings)

    with client.stream(
        "POST",
        "/v1/stream",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers=_auth_headers(token_service),
    ) as resp:
        assert resp.status_code == 200
        raw = b"".join(resp.iter_bytes())
        events = [
            json.loads(part.removeprefix("data: ").strip())
            for part in raw.decode().split("\n\n")
            if part.strip()
        ]

    assert len(events) >= 2
    assert events[0]["type"] == "meta"

    last = events[-1]
    assert last.get("type") == "error"
    assert "error" in last
    assert "conversation_id" in last
    assert last["message"]["role"] == "assistant"
    assert last["message"]["content"] == "Hello"
    assert db.commit.called
