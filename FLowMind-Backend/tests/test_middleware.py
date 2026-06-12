import time
from unittest.mock import AsyncMock, MagicMock

import jwt
from starlette.testclient import TestClient

from app.api.chat import get_service
from app.main import create_app
from app.services.chat import ChatService
from app.services.token import TokenService


def _mock_chat_service(settings):
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
    return service


def _app(settings):
    app = create_app(settings)
    app.state.settings = settings
    app.state.token_service = TokenService(settings)
    app.state.chat_service = ChatService(settings)
    return app


def test_jwt_missing_token_rejected(settings):
    app = _app(settings)
    app.dependency_overrides[get_service] = lambda: _mock_chat_service(settings)
    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert resp.status_code == 401
    data = resp.json()
    assert data["error"]["type"] == "authentication_error"


def test_jwt_valid_token_accepted(settings):
    app = _app(settings)
    app.dependency_overrides[get_service] = lambda: _mock_chat_service(settings)
    client = TestClient(app)
    token_service = TokenService(settings)
    token = token_service.generate_access_token("user-123", "test@example.com")
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}], "stream": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200


def test_jwt_expired_token_rejected(settings):
    app = _app(settings)
    app.dependency_overrides[get_service] = lambda: _mock_chat_service(settings)
    client = TestClient(app)
    expired_token = jwt.encode(
        {"sub": "user-123", "email": "test@example.com", "exp": int(time.time()) - 60},
        settings.jwt_secret,
        algorithm="HS256",
    )
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert resp.status_code == 401
    data = resp.json()
    assert "expired" in data["error"]["message"]


def test_jwt_tampered_token_rejected(settings):
    app = _app(settings)
    app.dependency_overrides[get_service] = lambda: _mock_chat_service(settings)
    client = TestClient(app)
    token_service = TokenService(settings)
    token = token_service.generate_access_token("user-123", "test@example.com")
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers={"Authorization": f"Bearer {token}xyz"},
    )
    assert resp.status_code == 401


def test_public_endpoints_accessible_without_token(settings):
    app = _app(settings)
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
