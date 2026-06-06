from unittest.mock import AsyncMock, MagicMock

from starlette.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.api.chat import get_service
from app.services.chat import ChatService


def _mocked_app(settings):
    service = ChatService(settings)
    mock_resp = MagicMock()
    mock_resp.model_dump.return_value = {
        "id": "cmpl-test",
        "object": "chat.completion",
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": "Mock reply"},
            "finish_reason": "stop",
        }],
        "usage": None,
    }
    service.client.chat.completions.create = AsyncMock(return_value=mock_resp)
    app = create_app(settings)
    app.dependency_overrides[get_service] = lambda: service
    return app


def test_auth_disabled_when_no_token(settings):
    app = _mocked_app(settings)
    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert resp.status_code != 401


def test_auth_enabled_rejects_missing_token(settings):
    settings.auth_token = "secret-123"
    app = _mocked_app(settings)
    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert resp.status_code == 401
    data = resp.json()
    assert data["error"]["type"] == "authentication_error"


def test_auth_enabled_accepts_valid_token(settings):
    settings.auth_token = "secret-123"
    app = _mocked_app(settings)
    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers={"Authorization": "Bearer secret-123"},
    )
    assert resp.status_code != 401


def test_auth_skipped_for_public_endpoints(settings):
    settings.auth_token = "secret-123"
    app = create_app(settings)
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code != 401
