import time
import time
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import jwt
from starlette.testclient import TestClient

from app.api.chat import get_conversation_service
from app.main import create_app
from app.services.chat import ChatService
from app.services.conversation import ConversationService
from app.services.token import TokenService


def _mock_conv_service():
    service = MagicMock(spec=ConversationService)
    now = datetime.now(timezone.utc)
    conv_id = uuid4()
    conv = MagicMock()
    conv.id = conv_id
    conv.title = "Test"
    conv.created_at = now
    conv.updated_at = now
    conv.messages = []
    service.create = AsyncMock(return_value=conv)
    service.list_by_user = AsyncMock(return_value=[])
    service.get_by_id = AsyncMock(return_value=conv)
    service.update_title = AsyncMock(return_value=conv)
    service.delete = AsyncMock(return_value=True)
    return service


def _app(settings):
    app = create_app(settings)
    app.state.settings = settings
    app.state.token_service = TokenService(settings)
    app.state.chat_service = ChatService(settings)
    app.dependency_overrides[get_conversation_service] = lambda: _mock_conv_service()
    return app


def _auth_headers(token_service: TokenService) -> dict:
    token = token_service.generate_access_token("user-123", "test@example.com")
    return {"Authorization": f"Bearer {token}"}


def test_jwt_missing_token_rejected(settings):
    app = _app(settings)
    client = TestClient(app)
    resp = client.post(
        "/v1/conversations",
        json={"title": "Test"},
    )
    assert resp.status_code == 401
    data = resp.json()
    assert data["error"]["type"] == "authentication_error"


def test_jwt_valid_token_accepted(settings):
    app = _app(settings)
    client = TestClient(app)
    token_service = TokenService(settings)
    resp = client.post(
        "/v1/conversations",
        json={"title": "Test"},
        headers=_auth_headers(token_service),
    )
    assert resp.status_code == 201


def test_jwt_expired_token_rejected(settings):
    app = _app(settings)
    client = TestClient(app)
    expired_token = jwt.encode(
        {"sub": "user-123", "email": "test@example.com", "exp": int(time.time()) - 60},
        settings.jwt_secret,
        algorithm="HS256",
    )
    resp = client.post(
        "/v1/conversations",
        json={"title": "Test"},
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert resp.status_code == 401
    data = resp.json()
    assert "expired" in data["error"]["message"]


def test_jwt_tampered_token_rejected(settings):
    app = _app(settings)
    client = TestClient(app)
    token_service = TokenService(settings)
    token = token_service.generate_access_token("user-123", "test@example.com")
    resp = client.post(
        "/v1/conversations",
        json={"title": "Test"},
        headers={"Authorization": f"Bearer {token}xyz"},
    )
    assert resp.status_code == 401


def test_public_endpoints_accessible_without_token(settings):
    app = _app(settings)
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
