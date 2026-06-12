from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Session


class SessionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: str,
        refresh_token_hash: str,
        expires_at: datetime,
        ip_address: str | None = None,
        device_info: str | None = None,
    ) -> Session:
        session = Session(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
            ip_address=ip_address,
            device_info=device_info,
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def find_by_refresh_token_hash(self, token_hash: str) -> Session | None:
        result = await self.db.execute(
            select(Session).where(
                Session.refresh_token_hash == token_hash,
                Session.is_invalidated == False,
                Session.expires_at > datetime.now(timezone.utc),
            )
        )
        return result.scalar_one_or_none()

    async def invalidate(self, session_id: str) -> None:
        await self.db.execute(
            update(Session).where(Session.id == session_id).values(is_invalidated=True)
        )
        await self.db.commit()

    async def invalidate_all_for_user(self, user_id: str) -> None:
        await self.db.execute(
            update(Session)
            .where(Session.user_id == user_id, Session.is_invalidated == False)
            .values(is_invalidated=True)
        )
        await self.db.commit()
