from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from starlette.testclient import TestClient

from app.api.chat import get_conversation_service, get_message_service
from app.database import get_db
from app.main import create_app
from app.services.chat import ChatService
from app.services.conversation import ConversationService
from app.services.embedding import EmbeddingService
from app.services.message import MessageService
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


def _mock_conv_service():
    service = MagicMock(spec=ConversationService)
    now = datetime.now(timezone.utc)
    conv_id = uuid4()
    conv = MagicMock()
    conv.id = conv_id
    conv.title = "My Chat"
    conv.created_at = now
    conv.updated_at = now
    conv.messages = []
    service.create = AsyncMock(return_value=conv)
    service.list_by_user = AsyncMock(return_value=[])
    service.get_by_id = AsyncMock(return_value=conv)
    service.update_title = AsyncMock(return_value=conv)
    service.delete = AsyncMock(return_value=True)
    return service


def _mock_msg_service():
    service = MagicMock(spec=MessageService)
    now = datetime.now(timezone.utc)
    msg_id = uuid4()
    resp = MagicMock()
    resp.id = msg_id
    resp.role = "assistant"
    resp.content = "Mock reply"
    resp.metadata = None
    resp.created_at = now
    service.add_message = AsyncMock(return_value=resp)
    service.delete_message = AsyncMock(return_value=True)
    return service


def _app(settings):
    app = create_app(settings)
    app.state.settings = settings
    app.state.token_service = TokenService(settings)
    app.state.chat_service = _mock_chat_service(settings)
    app.state.embedding_service = EmbeddingService(settings)
    return app


def _auth_headers(token_service: TokenService) -> dict:
    token = token_service.generate_access_token("user-123", "test@example.com")
    return {"Authorization": f"Bearer {token}"}


def test_health_returns_ok(settings):
    app = _app(settings)
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_chat_completion_route_removed(settings):
    app = _app(settings)
    client = TestClient(app)
    token_service = TokenService(settings)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers=_auth_headers(token_service),
    )
    assert resp.status_code == 404


def test_create_conversation(settings):
    app = _app(settings)
    app.dependency_overrides[get_conversation_service] = lambda: _mock_conv_service()
    client = TestClient(app)
    token_service = TokenService(settings)
    resp = client.post(
        "/v1/conversations",
        json={"title": "My Chat"},
        headers=_auth_headers(token_service),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "My Chat"
    assert "id" in data


def test_list_conversations_empty(settings):
    app = _app(settings)
    conv_service = MagicMock(spec=ConversationService)
    conv_service.list_by_user = AsyncMock(return_value=[])
    app.dependency_overrides[get_conversation_service] = lambda: conv_service
    client = TestClient(app)
    token_service = TokenService(settings)
    resp = client.get(
        "/v1/conversations",
        headers=_auth_headers(token_service),
    )
    assert resp.status_code == 200
    assert resp.json() == []


def test_conversations_require_auth(settings):
    app = _app(settings)
    client = TestClient(app)
    resp = client.post("/v1/conversations", json={"title": "X"})
    assert resp.status_code == 401


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


def _mock_db():
    db = MagicMock()
    db.execute = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    return db


def test_generate_title_success(settings):
    app = _app(settings)
    now = datetime.now(timezone.utc)
    conv_id = uuid4()

    conv = MagicMock()
    conv.id = conv_id
    conv.title = "New Conversation"
    conv.title_generated = False
    conv.created_at = now
    conv.updated_at = now

    user_msg = MagicMock()
    user_msg.role = "user"
    user_msg.content = "What is the meaning of life?"
    conv.messages = [user_msg]

    conv_service = MagicMock(spec=ConversationService)
    conv_service.get_by_id = AsyncMock(return_value=conv)

    chat_service = ChatService(settings)
    mock_resp = MagicMock()
    mock_resp.choices = [{"message": {"content": "The Meaning of Life"}}]
    chat_service.chat = AsyncMock(return_value=mock_resp)

    app.state.chat_service = chat_service
    app.dependency_overrides[get_conversation_service] = lambda: conv_service
    app.dependency_overrides[get_db] = lambda: _mock_db()

    client = TestClient(app)
    token_service = TokenService(settings)

    resp = client.post(
        f"/v1/conversations/{conv_id}/generate-title",
        headers=_auth_headers(token_service),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "The Meaning of Life"
    assert data["title_generated"] is True
    assert data["id"] == str(conv_id)


def test_generate_title_no_messages(settings):
    app = _app(settings)
    conv_id = uuid4()
    now = datetime.now(timezone.utc)

    conv = MagicMock()
    conv.id = conv_id
    conv.title = "New Conversation"
    conv.title_generated = False
    conv.created_at = now
    conv.updated_at = now
    conv.messages = []

    conv_service = MagicMock(spec=ConversationService)
    conv_service.get_by_id = AsyncMock(return_value=conv)
    app.dependency_overrides[get_conversation_service] = lambda: conv_service
    app.dependency_overrides[get_db] = lambda: _mock_db()

    client = TestClient(app)
    token_service = TokenService(settings)

    resp = client.post(
        f"/v1/conversations/{conv_id}/generate-title",
        headers=_auth_headers(token_service),
    )
    assert resp.status_code == 400


def test_generate_title_not_found(settings):
    app = _app(settings)
    conv_id = uuid4()

    conv_service = MagicMock(spec=ConversationService)
    conv_service.get_by_id = AsyncMock(return_value=None)
    app.dependency_overrides[get_conversation_service] = lambda: conv_service
    app.dependency_overrides[get_db] = lambda: _mock_db()

    client = TestClient(app)
    token_service = TokenService(settings)

    resp = client.post(
        f"/v1/conversations/{conv_id}/generate-title",
        headers=_auth_headers(token_service),
    )
    assert resp.status_code == 404


def test_generate_title_requires_auth(settings):
    app = _app(settings)
    client = TestClient(app)

    resp = client.post(f"/v1/conversations/{uuid4()}/generate-title")
    assert resp.status_code == 401
