import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import UsageEvent
from app.pricing import calculate_cost


class UsageTrackingService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def track_usage(
        self,
        user_id: str,
        conversation_id: str | None = None,
        message_id: str | None = None,
        provider: str = "deepseek",
        model: str = "deepseek-chat",
        feature: str = "chat",
        input_tokens: int = 0,
        output_tokens: int = 0,
        cached_input_tokens: int = 0,
        metadata: dict | None = None,
    ) -> UsageEvent:
        total_tokens = input_tokens + output_tokens
        estimated_cost = calculate_cost(model, input_tokens, output_tokens, cached_input_tokens)

        event = UsageEvent(
            user_id=user_id,
            conversation_id=conversation_id,
            message_id=message_id,
            provider=provider,
            model=model,
            feature=feature,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            cached_input_tokens=cached_input_tokens,
            estimated_cost=estimated_cost,
            metadata_=metadata,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event
