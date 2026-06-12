from unittest.mock import AsyncMock, MagicMock, patch

from starlette.testclient import TestClient

from app.api.chat import get_service
from app.database import get_db
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


def test_health_returns_ok(settings):
    app = _app(settings)
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_chat_completion_returns_422_on_invalid_body(settings):
    app = _app(settings)
    app.dependency_overrides[get_service] = lambda: _mock_chat_service(settings)
    client = TestClient(app)
    token_service = TokenService(settings)
    token = token_service.generate_access_token("user-123", "test@example.com")
    resp = client.post(
        "/v1/chat/completions",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422


def test_chat_completion_integration(settings):
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


@patch("app.api.auth.id_token.verify_oauth2_token")
def test_google_auth_valid_token(mock_verify, settings):
    mock_verify.return_value = {
        "sub": "google-sub-123",
        "email": "user@example.com",
        "name": "Test User",
        "picture": "https://example.com/avatar.png",
    }

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db = MagicMock()
    mock_db.execute = AsyncMock(return_value=mock_result)
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    app = _app(settings)
    app.dependency_overrides[get_db] = lambda: mock_db
    client = TestClient(app)

    resp = client.post("/v1/auth/google", json={"id_token": "valid-token"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "user@example.com"


@patch("app.api.auth.id_token.verify_oauth2_token")
def test_google_auth_invalid_token(mock_verify, settings):
    mock_verify.side_effect = ValueError("Invalid token")

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db = MagicMock()
    mock_db.execute = AsyncMock(return_value=mock_result)

    app = _app(settings)
    app.dependency_overrides[get_db] = lambda: mock_db
    client = TestClient(app)

    resp = client.post("/v1/auth/google", json={"id_token": "invalid-token"})
    assert resp.status_code == 401
    data = resp.json()
    assert data["detail"]["type"] == "authentication_error"
