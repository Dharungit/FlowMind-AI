import pytest
from unittest.mock import AsyncMock, MagicMock

from app.config import Settings


@pytest.fixture
def settings():
    return Settings(
        _env_file=None,
        provider_api_key="test-key-456",
        provider_base_url="https://api.deepseek.com/v1",
        jwt_secret="test-secret-key-for-testing-purposes-only",
        google_client_id="test-client-id",
        openai_api_key="sk-test-123",
        memory_similarity_threshold=0.85,
        memory_max_results=5,
        memory_max_per_user=100,
    )
