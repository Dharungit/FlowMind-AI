from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.models import Memory
from app.schemas.memory import MemoryExtractionItem
from app.services.memory import MemoryService


@pytest.fixture
def settings():
    return Settings(
        _env_file=None,
        provider_api_key="test-key-456",
        openai_api_key="sk-test-123",
        memory_similarity_threshold=0.85,
        memory_max_results=5,
        memory_max_per_user=100,
    )


@pytest.fixture
def mock_db():
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def mock_embedding_service():
    svc = MagicMock()
    svc.embed = AsyncMock(return_value=[0.1] * 1536)
    svc.embed_batch = AsyncMock(return_value=[[0.1] * 1536])
    return svc


@pytest.fixture
def memory_service(mock_db, mock_embedding_service, settings):
    return MemoryService(mock_db, mock_embedding_service, settings)


# ── CRUD Tests ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_save_memory(memory_service, mock_db, mock_embedding_service):
    count_result = MagicMock()
    count_result.scalar.return_value = 5
    mock_db.execute = AsyncMock(return_value=count_result)
    mock_db.flush = AsyncMock()
    mock_db.commit = AsyncMock()

    now = datetime.now(timezone.utc)
    mem_id = uuid4()

    async def _refresh(obj):
        obj.id = mem_id
        obj.created_at = now
        obj.updated_at = now

    mock_db.refresh = AsyncMock(side_effect=_refresh)

    result = await memory_service.save_memory(
        user_id="user-123",
        memory="User is building FlowMind AI",
        memory_type="project",
        importance=0.8,
    )

    assert result is not None
    assert result.memory == "User is building FlowMind AI"
    assert result.memory_type == "project"
    mock_db.add.assert_called_once()
    mock_db.commit.assert_awaited_once()
    mock_embedding_service.embed.assert_awaited_once()


@pytest.mark.asyncio
async def test_save_memory_at_limit_returns_none(memory_service, mock_db):
    count_result = MagicMock()
    count_result.scalar.return_value = 100
    mock_db.execute = AsyncMock(return_value=count_result)

    result = await memory_service.save_memory(
        user_id="user-123",
        memory="Exceeded memory",
        memory_type="fact",
        importance=0.5,
    )

    assert result is None
    mock_db.add.assert_not_called()
    mock_db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_get_memory_count(memory_service, mock_db):
    count_result = MagicMock()
    count_result.scalar.return_value = 42
    mock_db.execute = AsyncMock(return_value=count_result)

    count = await memory_service.get_memory_count("user-123")
    assert count == 42


@pytest.mark.asyncio
async def test_get_memory_count_empty(memory_service, mock_db):
    count_result = MagicMock()
    count_result.scalar.return_value = 0
    mock_db.execute = AsyncMock(return_value=count_result)

    count = await memory_service.get_memory_count("user-123")
    assert count == 0


@pytest.mark.asyncio
async def test_get_user_memories(memory_service, mock_db):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [
        Memory(id=uuid4(), user_id="user-123", memory="Fact 1", memory_type="fact", importance=0.5,
               access_count=0, created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)),
        Memory(id=uuid4(), user_id="user-123", memory="Fact 2", memory_type="fact", importance=0.7,
               access_count=0, created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)),
    ]
    mock_db.execute = AsyncMock(return_value=mock_result)

    result = await memory_service.get_user_memories("user-123")

    assert len(result) == 2
    assert result[0].memory == "Fact 1"
    assert result[1].memory == "Fact 2"


@pytest.mark.asyncio
async def test_get_user_memories_filtered_by_type(memory_service, mock_db):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [
        Memory(id=uuid4(), user_id="user-123", memory="My project", memory_type="project", importance=0.8,
               access_count=0, created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)),
    ]
    mock_db.execute = AsyncMock(return_value=mock_result)

    result = await memory_service.get_user_memories("user-123", memory_type="project")

    assert len(result) == 1
    assert result[0].memory_type == "project"


@pytest.mark.asyncio
async def test_delete_memory_own(memory_service, mock_db):
    mem = MagicMock(spec=Memory)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mem
    mock_db.execute = AsyncMock(return_value=mock_result)
    mock_db.commit = AsyncMock()

    result = await memory_service.delete_memory("mem-123", "user-123")

    assert result is True
    mock_db.delete.assert_called_once_with(mem)
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_memory_not_found(memory_service, mock_db):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=mock_result)

    result = await memory_service.delete_memory("nonexistent", "user-123")

    assert result is False
    mock_db.delete.assert_not_called()


@pytest.mark.asyncio
async def test_bump_access_count(memory_service, mock_db):
    mock_db.execute = AsyncMock()
    mock_db.commit = AsyncMock()

    ids = ["mem-1", "mem-2"]
    await memory_service.bump_access_count(ids)

    mock_db.execute.assert_awaited_once()
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_bump_access_count_empty(memory_service, mock_db):
    await memory_service.bump_access_count([])
    mock_db.execute.assert_not_called()


# ── Retrieval Tests ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_search_by_similarity(memory_service, mock_db):
    mem_id = uuid4()
    mock_db.execute = AsyncMock()

    mock_db.execute.side_effect = [
        # First call: similarity search
        AsyncMock(
            fetchall=lambda: [(mem_id, 0.92)]
        )().__await__() if False else None,
    ]

    # Need a more realistic mock approach
    mock_result = MagicMock()
    mock_result.fetchall.return_value = [(mem_id, 0.92)]
    mock_result2 = MagicMock()
    mock_mem = Memory(
        id=mem_id, user_id="user-123", memory="Test", memory_type="fact", importance=0.5,
        access_count=0, created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )
    mock_result2.scalars.return_value.all.return_value = [mock_mem]

    mock_db.execute = AsyncMock(side_effect=[mock_result, mock_result2])

    result = await memory_service.search_by_similarity("user-123", [0.1] * 1536, limit=5)

    assert len(result) == 1
    assert result[0][0].memory == "Test"
    assert abs(result[0][1] - 0.92) < 0.001


@pytest.mark.asyncio
async def test_search_by_similarity_no_embedding(memory_service):
    result = await memory_service.search_by_similarity("user-123", [], limit=5)
    assert result == []


@pytest.mark.asyncio
async def test_retrieve_relevant(memory_service, mock_db, mock_embedding_service):
    mem_id = uuid4()
    mem = Memory(
        id=mem_id, user_id="user-123", memory="User likes Python", memory_type="preference",
        importance=0.6, access_count=0,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )

    mock_res1 = MagicMock()
    mock_res1.fetchall.return_value = [(mem_id, 0.85)]
    mock_res2 = MagicMock()
    mock_res2.scalars.return_value.all.return_value = [mem]
    mock_res3 = MagicMock()
    mock_db.execute = AsyncMock(side_effect=[mock_res1, mock_res2, mock_res3])
    mock_db.commit = AsyncMock()
    mock_embedding_service.embed = AsyncMock(return_value=[0.1] * 1536)

    result = await memory_service.retrieve_relevant("user-123", "I like Python")

    assert len(result) == 1
    assert result[0][0].memory == "User likes Python"
    assert result[0][1] > 0


@pytest.mark.asyncio
async def test_retrieve_relevant_embedding_failure(memory_service, mock_embedding_service):
    mock_embedding_service.embed = AsyncMock(side_effect=Exception("API down"))

    result = await memory_service.retrieve_relevant("user-123", "Hello")
    assert result == []


# ── Extraction Tests ────────────────────────────────────────────────


def test_build_extraction_prompt(memory_service):
    messages = memory_service._build_extraction_prompt(
        user_message="I'm building FlowMind AI",
        assistant_message="That's a great project!",
    )
    assert len(messages) == 2
    assert messages[0].role == "system"
    assert "memory" in messages[0].content.lower()
    assert messages[1].role == "user"
    assert "FlowMind AI" in messages[1].content


@pytest.mark.asyncio
async def test_extract_memories_via_llm(memory_service):
    mock_chat_service = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [
        {"message": {
            "content": '{"memories": [{"memory": "User builds FlowMind AI", "memory_type": "project", "importance": 0.8}]}'
        }}
    ]
    mock_chat_service.chat = AsyncMock(return_value=mock_response)

    items = await memory_service._extract_memories_via_llm(
        "I'm building FlowMind AI",
        "Great project!",
        mock_chat_service,
    )

    assert len(items) == 1
    assert items[0].memory == "User builds FlowMind AI"
    assert items[0].memory_type == "project"


@pytest.mark.asyncio
async def test_extract_memories_via_llm_empty_response(memory_service):
    mock_chat_service = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [{"message": {"content": '{"memories": []}'}}]
    mock_chat_service.chat = AsyncMock(return_value=mock_response)

    items = await memory_service._extract_memories_via_llm(
        "Hello", "Hi!", mock_chat_service,
    )
    assert items == []


@pytest.mark.asyncio
async def test_extract_memories_via_llm_invalid_json(memory_service, caplog):
    mock_chat_service = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [{"message": {"content": "not json"}}]
    mock_chat_service.chat = AsyncMock(return_value=mock_response)

    items = await memory_service._extract_memories_via_llm(
        "Hello", "Hi!", mock_chat_service,
    )
    assert items == []


@pytest.mark.asyncio
async def test_check_duplicate_found(memory_service, mock_db, mock_embedding_service):
    mock_result = MagicMock()
    mock_result.scalar.return_value = 1
    mock_db.execute = AsyncMock(return_value=mock_result)
    mock_embedding_service.embed = AsyncMock(return_value=[0.1] * 1536)

    is_dup = await memory_service._check_duplicate("user-123", "User builds FlowMind AI")
    assert is_dup is True


@pytest.mark.asyncio
async def test_check_duplicate_not_found(memory_service, mock_db, mock_embedding_service):
    mock_result = MagicMock()
    mock_result.scalar.return_value = 0
    mock_db.execute = AsyncMock(return_value=mock_result)
    mock_embedding_service.embed = AsyncMock(return_value=[0.1] * 1536)

    is_dup = await memory_service._check_duplicate("user-123", "Unique fact")
    assert is_dup is False


@pytest.mark.asyncio
async def test_check_duplicate_no_embedding(memory_service, mock_embedding_service):
    mock_embedding_service.embed = AsyncMock(return_value=[])

    is_dup = await memory_service._check_duplicate("user-123", "Some text")
    assert is_dup is False


@pytest.mark.asyncio
async def test_extract_from_exchange(memory_service, mock_db, mock_embedding_service):
    mock_chat_service = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [
        {"message": {
            "content": '{"memories": [{"memory": "User builds FlowMind AI", "memory_type": "project", "importance": 0.8}]}'
        }}
    ]
    mock_chat_service.chat = AsyncMock(return_value=mock_response)

    count_result = MagicMock()
    count_result.scalar.return_value = 50
    dup_result = MagicMock()
    dup_result.scalar.return_value = 0
    count_result2 = MagicMock()
    count_result2.scalar.return_value = 50
    update_result = MagicMock()
    mock_db.execute = AsyncMock(side_effect=[count_result, dup_result, count_result2, update_result])
    mock_db.flush = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_embedding_service.embed = AsyncMock(return_value=[0.1] * 1536)

    result = await memory_service.extract_from_exchange(
        "user-123",
        "I'm building FlowMind AI",
        "Great!",
        mock_chat_service,
    )

    assert len(result) >= 1


@pytest.mark.asyncio
async def test_extract_from_exchange_at_limit_skips(memory_service, mock_db):
    count_result = MagicMock()
    count_result.scalar.return_value = 100
    mock_db.execute = AsyncMock(return_value=count_result)

    mock_chat_service = MagicMock()
    result = await memory_service.extract_from_exchange(
        "user-123", "Hello", "Hi!", mock_chat_service,
    )
    assert result == []
    mock_chat_service.chat.assert_not_called()


@pytest.mark.asyncio
async def test_extract_from_exchange_no_facts(memory_service, mock_db):
    count_result = MagicMock()
    count_result.scalar.return_value = 50
    mock_db.execute = AsyncMock(return_value=count_result)

    mock_chat_service = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [{"message": {"content": '{"memories": []}'}}]
    mock_chat_service.chat = AsyncMock(return_value=mock_response)

    result = await memory_service.extract_from_exchange(
        "user-123", "Hello", "Hi!", mock_chat_service,
    )
    assert result == []
