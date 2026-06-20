from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.embedding import EmbeddingService


@pytest.fixture
def settings():
    from app.config import Settings
    return Settings(
        _env_file=None,
        provider_api_key="test-key-456",
        openai_api_key="sk-test-123",
    )


@pytest.fixture
def settings_no_key():
    from app.config import Settings
    return Settings(
        _env_file=None,
        provider_api_key="test-key-456",
        openai_api_key="",
    )


@pytest.mark.asyncio
async def test_embed_single_text(settings):
    service = EmbeddingService(settings)
    mock_embedding = [0.1] * 1536
    mock_data = MagicMock()
    mock_data.data = [MagicMock(embedding=mock_embedding)]
    service.client.embeddings.create = AsyncMock(return_value=mock_data)

    result = await service.embed("Hello world")

    assert len(result) == 1536
    assert result == mock_embedding
    service.client.embeddings.create.assert_awaited_once_with(
        model="text-embedding-3-small",
        input="Hello world",
    )


@pytest.mark.asyncio
async def test_embed_batch(settings):
    service = EmbeddingService(settings)
    mock_data = MagicMock()
    mock_data.data = [
        MagicMock(index=0, embedding=[0.1] * 1536),
        MagicMock(index=1, embedding=[0.2] * 1536),
    ]
    service.client.embeddings.create = AsyncMock(return_value=mock_data)

    result = await service.embed_batch(["Hello", "World"])

    assert len(result) == 2
    assert result[0] == [0.1] * 1536
    assert result[1] == [0.2] * 1536


@pytest.mark.asyncio
async def test_embed_no_api_key_returns_empty(settings_no_key):
    service = EmbeddingService(settings_no_key)
    assert service.client is None

    result = await service.embed("Hello")
    assert result == []


@pytest.mark.asyncio
async def test_embed_batch_no_api_key_returns_empty(settings_no_key):
    service = EmbeddingService(settings_no_key)
    assert service.client is None

    result = await service.embed_batch(["Hello", "World"])
    assert result == []


@pytest.mark.asyncio
async def test_embed_batch_empty_input(settings):
    service = EmbeddingService(settings)

    result = await service.embed_batch([])
    assert result == []
