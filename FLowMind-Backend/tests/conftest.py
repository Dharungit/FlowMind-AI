import pytest
from unittest.mock import AsyncMock, MagicMock

from app.api.chat import get_service
from app.config import Settings
from app.main import create_app
from app.services.chat import ChatService


@pytest.fixture
def settings():
    return Settings(
        _env_file=None,
        provider_api_key="test-key-456",
        provider_base_url="https://api.deepseek.com/v1",
    )


@pytest.fixture
def mock_service(settings):
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


@pytest.fixture
def app(settings, mock_service):
    app = create_app(settings)
    app.dependency_overrides[get_service] = lambda: mock_service
    return app
