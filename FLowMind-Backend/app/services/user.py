from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_or_create_by_google_profile(
        self,
        google_sub: str,
        email: str,
        display_name: str,
        avatar_url: str | None = None,
    ) -> User:
        result = await self.db.execute(select(User).where(User.google_sub == google_sub))
        user = result.scalar_one_or_none()

        if user:
            user.email = email
            user.display_name = display_name
            user.avatar_url = avatar_url or user.avatar_url
            user.updated_at = datetime.now(timezone.utc)
        else:
            user = User(
                google_sub=google_sub,
                email=email,
                display_name=display_name,
                avatar_url=avatar_url,
            )
            self.db.add(user)

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_by_id(self, user_id: str) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
