import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Message
from app.schemas.conversations import ConversationSearchResult


class ConversationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: str, title: str = "New Conversation") -> Conversation:
        conv = Conversation(user_id=user_id, title=title)
        self.db.add(conv)
        await self.db.commit()
        await self.db.refresh(conv)
        return conv

    async def list_by_user(self, user_id: str) -> list[Conversation]:
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, conversation_id: str, user_id: str) -> Conversation | None:
        result = await self.db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def update_title(self, conversation_id: str, user_id: str, title: str) -> Conversation | None:
        conv = await self.get_by_id(conversation_id, user_id)
        if conv is None:
            return None
        conv.title = title
        conv.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(conv)
        return conv

    async def delete(self, conversation_id: str, user_id: str) -> bool:
        conv = await self.get_by_id(conversation_id, user_id)
        if conv is None:
            return False
        await self.db.delete(conv)
        await self.db.commit()
        return True

    async def search(self, user_id: str, query: str) -> list[ConversationSearchResult]:
        q = query.strip()
        if not q:
            return []

        pattern = f"%{q}%"

        subq = (
            select(Conversation.id, Conversation.title, Conversation.updated_at, Conversation.created_at)
            .join(Message, Message.conversation_id == Conversation.id, isouter=True)
            .where(
                Conversation.user_id == user_id,
                or_(
                    Conversation.title.ilike(pattern),
                    and_(
                        Message.role.in_(["user", "assistant"]),
                        Message.content.isnot(None),
                        Message.content.ilike(pattern),
                    ),
                ),
            )
            .distinct()
            .order_by(Conversation.updated_at.desc())
            .limit(5)
            .subquery()
        )

        matched_text_subq = (
            select(Message.content)
            .where(
                Message.conversation_id == subq.c.id,
                Message.role.in_(["user", "assistant"]),
                Message.content.isnot(None),
                Message.content.ilike(pattern),
            )
            .limit(1)
            .correlate(subq)
            .scalar_subquery()
        )

        result = await self.db.execute(
            select(subq.c.id, subq.c.title, subq.c.updated_at, subq.c.created_at, matched_text_subq)
            .select_from(subq)
            .order_by(subq.c.updated_at.desc())
        )

        return [
            ConversationSearchResult(
                conversation_id=row.id,
                title=row.title,
                matched_text=_build_snippet(row[4] or row.title, q) if row[4] or row.title else row.title,
                created_at=row.created_at,
                updated_at=row.updated_at,
            )
            for row in result.all()
        ]


def _build_snippet(content: str, query: str, max_len: int = 200) -> str:
    if not content:
        return ""

    lower_content = content.lower()
    lower_query = query.lower()
    idx = lower_content.find(lower_query)

    if len(content) <= max_len:
        return _highlight(content, query)

    if idx == -1:
        snippet = content[: max_len - 3] + "..."
        return _highlight(snippet, query)

    match_end = idx + len(query)
    half = (max_len - len(query)) // 2

    start = max(0, idx - half)
    end = min(len(content), match_end + half)

    if start == 0:
        end = min(len(content), max_len)
    elif end == len(content):
        start = max(0, len(content) - max_len)

    snippet = content[start:end]

    if start > 0:
        snippet = "..." + snippet
    if end < len(content):
        snippet += "..."

    return _highlight(snippet, query)


def _highlight(text: str, query: str) -> str:
    return re.sub(re.escape(query), "<strong>\\g<0></strong>", text, flags=re.IGNORECASE)
