from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.services.user import UserService


@pytest.fixture
def mock_db():
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def user_service(mock_db):
    return UserService(mock_db)


@pytest.mark.asyncio
async def test_find_or_create_new_user(user_service, mock_db):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=mock_result)

    user = await user_service.find_or_create_by_google_profile(
        google_sub="google-123",
        email="new@example.com",
        display_name="New User",
        avatar_url="https://example.com/avatar.png",
    )

    mock_db.add.assert_called_once()
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_find_or_create_updates_existing(user_service, mock_db):
    existing_user = User(
        google_sub="google-123",
        email="old@example.com",
        display_name="Old Name",
        avatar_url=None,
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing_user
    mock_db.execute = AsyncMock(return_value=mock_result)

    user = await user_service.find_or_create_by_google_profile(
        google_sub="google-123",
        email="new@example.com",
        display_name="New Name",
        avatar_url="https://example.com/new-avatar.png",
    )

    assert user.email == "new@example.com"
    assert user.display_name == "New Name"
    assert user.avatar_url == "https://example.com/new-avatar.png"
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_by_id_returns_user(user_service, mock_db):
    expected_user = User(google_sub="google-123", email="test@example.com", display_name="Test")
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = expected_user
    mock_db.execute = AsyncMock(return_value=mock_result)

    user = await user_service.get_by_id("user-123")
    assert user is expected_user


@pytest.mark.asyncio
async def test_get_by_id_returns_none(user_service, mock_db):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=mock_result)

    user = await user_service.get_by_id("nonexistent")
    assert user is None
