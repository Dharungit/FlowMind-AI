from unittest.mock import AsyncMock, MagicMock

from starlette.testclient import TestClient

from app.main import create_app
from app.api.chat import get_service
from app.services.chat import ChatService


def test_health_returns_ok(settings):
    app = create_app(settings)
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_chat_completion_returns_422_on_invalid_body(app):
    client = TestClient(app)
    resp = client.post("/v1/chat/completions", json={})
    assert resp.status_code == 422


def test_chat_completion_integration(settings):
    service = ChatService(settings)
    mock_resp = MagicMock()
    mock_resp.model_dump.return_value = {
        "id": "cmpl-mock",
        "object": "chat.completion",
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": "Hello!"},
            "finish_reason": "stop",
        }],
        "usage": None,
    }
    service.client.chat.completions.create = AsyncMock(return_value=mock_resp)

    app = create_app(settings)
    app.dependency_overrides[get_service] = lambda: service

    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}], "stream": False},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["choices"][0]["message"]["content"] == "Hello!"
