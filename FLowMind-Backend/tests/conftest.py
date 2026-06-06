import pytest

from app.config import Settings


@pytest.fixture
def settings():
    return Settings(
        _env_file=None,
        provider_api_key="test-key-456",
        provider_base_url="https://api.deepseek.com/v1",
    )
