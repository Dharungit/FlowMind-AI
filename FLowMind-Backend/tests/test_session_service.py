from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Session
from app.services.session import SessionService


@pytest.fixture
def mock_db():
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def session_service(mock_db):
    return SessionService(mock_db)


@pytest.mark.asyncio
async def test_create_session(session_service, mock_db):
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    await session_service.create(
        user_id="user-123",
        refresh_token_hash="abc123hash",
        expires_at=expires_at,
        ip_address="127.0.0.1",
        device_info="Test Browser",
    )

    mock_db.add.assert_called_once()
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_find_by_refresh_token_hash_found(session_service, mock_db):
    expected_session = Session(
        user_id="user-123",
        refresh_token_hash="knownhash",
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = expected_session
    mock_db.execute = AsyncMock(return_value=mock_result)

    session = await session_service.find_by_refresh_token_hash("knownhash")
    assert session is expected_session


@pytest.mark.asyncio
async def test_find_by_refresh_token_hash_not_found(session_service, mock_db):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=mock_result)

    session = await session_service.find_by_refresh_token_hash("unknownhash")
    assert session is None


@pytest.mark.asyncio
async def test_invalidate_session(session_service, mock_db):
    await session_service.invalidate("session-123")
    mock_db.execute.assert_awaited_once()
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_invalidate_all_for_user(session_service, mock_db):
    await session_service.invalidate_all_for_user("user-123")
    mock_db.execute.assert_awaited_once()
    mock_db.commit.assert_awaited_once()
