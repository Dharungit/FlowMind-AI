from datetime import date

from sqlalchemy import Date, cast, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import UsageEvent


class AnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_user_total_usage(self, user_id: str) -> dict:
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(UsageEvent.total_tokens), 0),
                func.coalesce(func.sum(UsageEvent.input_tokens), 0),
                func.coalesce(func.sum(UsageEvent.output_tokens), 0),
            ).where(UsageEvent.user_id == user_id)
        )
        row = result.one()
        return {
            "total_tokens": int(row[0]),
            "input_tokens": int(row[1]),
            "output_tokens": int(row[2]),
        }

    async def get_user_daily_usage(self, user_id: str) -> list[dict]:
        result = await self.db.execute(
            select(
                cast(UsageEvent.created_at, Date).label("date"),
                func.coalesce(func.sum(UsageEvent.total_tokens), 0).label("total_tokens"),
            )
            .where(UsageEvent.user_id == user_id)
            .group_by(cast(UsageEvent.created_at, Date))
            .order_by(cast(UsageEvent.created_at, Date))
        )
        return [
            {"date": row.date.isoformat() if isinstance(row.date, date) else str(row.date), "total_tokens": int(row.total_tokens)}
            for row in result
        ]

    async def get_platform_usage(self) -> dict:
        result = await self.db.execute(
            select(func.coalesce(func.sum(UsageEvent.total_tokens), 0))
        )
        total = result.scalar() or 0
        return {"total_tokens": int(total)}

    async def get_usage_per_user(self) -> list[dict]:
        result = await self.db.execute(
            select(
                UsageEvent.user_id,
                func.coalesce(func.sum(UsageEvent.total_tokens), 0).label("total_tokens"),
            )
            .group_by(UsageEvent.user_id)
            .order_by(UsageEvent.user_id)
        )
        return [
            {"user_id": str(row.user_id), "total_tokens": int(row.total_tokens)}
            for row in result
        ]

    async def get_cost_per_user(self) -> list[dict]:
        result = await self.db.execute(
            select(
                UsageEvent.user_id,
                func.coalesce(func.sum(UsageEvent.estimated_cost), 0).label("estimated_cost"),
            )
            .group_by(UsageEvent.user_id)
            .order_by(UsageEvent.user_id)
        )
        return [
            {"user_id": str(row.user_id), "estimated_cost": float(row.estimated_cost)}
            for row in result
        ]

    async def get_feature_breakdown(self) -> list[dict]:
        result = await self.db.execute(
            select(
                UsageEvent.feature,
                func.coalesce(func.sum(UsageEvent.total_tokens), 0).label("total_tokens"),
            )
            .group_by(UsageEvent.feature)
            .order_by(UsageEvent.feature)
        )
        return [
            {"feature": row.feature, "total_tokens": int(row.total_tokens)}
            for row in result
        ]

    async def get_cache_breakdown(self) -> dict:
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(UsageEvent.cached_input_tokens), 0),
                func.coalesce(func.sum(UsageEvent.input_tokens), 0),
            )
        )
        row = result.one()
        cached = int(row[0])
        total_input = int(row[1])
        return {
            "cached_tokens": cached,
            "non_cached_tokens": total_input - cached,
        }

    async def get_peak_usage_hours(self) -> list[dict]:
        result = await self.db.execute(
            select(
                extract("hour", UsageEvent.created_at).label("hour"),
                func.coalesce(func.sum(UsageEvent.total_tokens), 0).label("total_tokens"),
            )
            .group_by(extract("hour", UsageEvent.created_at))
            .order_by(extract("hour", UsageEvent.created_at))
        )
        return [
            {"hour": int(row.hour), "total_tokens": int(row.total_tokens)}
            for row in result
        ]
