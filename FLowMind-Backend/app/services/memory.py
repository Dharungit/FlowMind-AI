import json
import logging
from datetime import datetime, timezone

from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.models import Memory
from app.pricing import MODEL_PRICING
from app.schemas.chat import ChatMessage, ChatRequest
from app.schemas.memory import MemoryExtractionItem
from app.services.chat import ChatService
from app.services.embedding import EmbeddingService
from app.services.usage_tracking import UsageTrackingService

logger = logging.getLogger("flowmind")


def _estimate_embedding_tokens(text: str) -> int:
    return max(1, len(text) // 4)


class MemoryService:
    def __init__(
        self,
        db: AsyncSession,
        embedding_service: EmbeddingService,
        settings: Settings | None = None,
        usage_tracking_service: UsageTrackingService | None = None,
    ):
        self.db = db
        self.embedding_service = embedding_service
        self.usage_tracking = usage_tracking_service
        self.similarity_threshold = settings.memory_similarity_threshold if settings else 0.85
        self.max_results = settings.memory_max_results if settings else 5
        self.max_per_user = settings.memory_max_per_user if settings else 100

    # ── CRUD ──────────────────────────────────────────────────────────

    async def get_memory_count(self, user_id: str) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Memory).where(Memory.user_id == user_id)
        )
        return result.scalar() or 0

    async def save_memory(
        self,
        user_id: str,
        memory: str,
        memory_type: str = "fact",
        importance: float = 0.5,
    ) -> Memory | None:
        count = await self.get_memory_count(user_id)
        if count >= self.max_per_user:
            logger.info("Memory save skipped: user %s at limit %d/%d", user_id, count, self.max_per_user)
            return None

        embedding = await self.embedding_service.embed(memory)

        if self.usage_tracking:
            est_tokens = _estimate_embedding_tokens(memory)
            await self.usage_tracking.track_usage(
                user_id=user_id,
                provider="openai",
                model=self.embedding_service.model,
                feature="embedding",
                input_tokens=est_tokens,
                output_tokens=0,
            )

        mem = Memory(
            user_id=user_id,
            memory=memory,
            memory_type=memory_type,
            importance=importance,
        )
        self.db.add(mem)
        await self.db.flush()

        if embedding:
            vector_literal = "[" + ",".join(str(v) for v in embedding) + "]"
            await self.db.execute(
                text("UPDATE memories SET embedding = CAST(:embedding AS vector) WHERE id = :id"),
                {"embedding": vector_literal, "id": mem.id},
            )

        await self.db.commit()
        await self.db.refresh(mem)
        return mem

    async def get_user_memories(
        self,
        user_id: str,
        memory_type: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Memory]:
        stmt = select(Memory).where(Memory.user_id == user_id)
        if memory_type:
            stmt = stmt.where(Memory.memory_type == memory_type)
        stmt = stmt.order_by(Memory.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def delete_memory(self, memory_id: str, user_id: str) -> bool:
        result = await self.db.execute(
            select(Memory).where(Memory.id == memory_id, Memory.user_id == user_id)
        )
        mem = result.scalar_one_or_none()
        if mem is None:
            return False
        await self.db.delete(mem)
        await self.db.commit()
        return True

    async def bump_access_count(self, memory_ids: list[str]) -> None:
        if not memory_ids:
            return
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(Memory)
            .where(Memory.id.in_(memory_ids))
            .values(
                access_count=Memory.access_count + 1,
                last_accessed_at=now,
            )
        )
        await self.db.commit()

    # ── Retrieval ─────────────────────────────────────────────────────

    async def search_by_similarity(
        self,
        user_id: str,
        embedding: list[float],
        limit: int = 5,
    ) -> list[tuple[Memory, float]]:
        if not embedding:
            return []

        vector_literal = "[" + ",".join(str(v) for v in embedding) + "]"
        sql = text("""
            SELECT id, 1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
            FROM memories
            WHERE user_id = :user_id AND embedding IS NOT NULL
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
        """)
        result = await self.db.execute(sql, {
            "embedding": vector_literal,
            "user_id": user_id,
            "limit": limit,
        })
        rows = result.fetchall()

        if not rows:
            return []

        ids = [row[0] for row in rows]
        similarity_map = {str(row[0]): float(row[1]) for row in rows}

        mems_result = await self.db.execute(
            select(Memory).where(Memory.id.in_(ids))
        )
        mems = list(mems_result.scalars().all())

        scored = []
        for m in mems:
            sim = similarity_map.get(str(m.id), 0.0)
            scored.append((m, sim))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored

    async def retrieve_relevant(
        self,
        user_id: str,
        user_message: str,
        limit: int | None = None,
    ) -> list[tuple[Memory, float]]:
        max_results = limit or self.max_results
        try:
            embedding = await self.embedding_service.embed(user_message)
        except Exception:
            logger.warning("Embedding failed during memory retrieval, skipping", exc_info=True)
            return []

        if not embedding:
            return []

        scored = await self.search_by_similarity(user_id, embedding, limit=max_results)

        ranked = []
        for mem, sim in scored:
            combined = sim * 0.7 + (mem.importance / 10.0) * 0.3
            ranked.append((mem, combined))
        ranked.sort(key=lambda x: x[1], reverse=True)
        ranked = ranked[:max_results]

        ids = [str(mem.id) for mem, _ in ranked]
        await self.bump_access_count(ids)

        return ranked

    # ── Extraction ────────────────────────────────────────────────────

    async def _check_duplicate(self, user_id: str, memory_text: str) -> bool:
        embedding = await self.embedding_service.embed(memory_text)

        if self.usage_tracking:
            est_tokens = _estimate_embedding_tokens(memory_text)
            await self.usage_tracking.track_usage(
                user_id=user_id,
                provider="openai",
                model=self.embedding_service.model,
                feature="embedding",
                input_tokens=est_tokens,
                output_tokens=0,
            )

        if not embedding:
            return False

        vector_literal = "[" + ",".join(str(v) for v in embedding) + "]"
        sql = text("""
            SELECT COUNT(*) FROM memories
            WHERE user_id = :user_id
              AND embedding IS NOT NULL
              AND 1 - (embedding <=> CAST(:embedding AS vector)) >= :threshold
        """)
        result = await self.db.execute(sql, {
            "embedding": vector_literal,
            "user_id": user_id,
            "threshold": self.similarity_threshold,
        })
        count = result.scalar()
        return count > 0

    def _build_extraction_prompt(self, user_message: str, assistant_message: str) -> list[ChatMessage]:
        system = ChatMessage(
            role="system",
            content=(
                "You are a memory extraction system. Analyze the following user-assistant exchange "
                "and extract durable facts about the user that would be useful to remember across conversations. "
                "Focus on: projects they're building, skills they have, preferences, goals, and personal facts. "
                "Ignore greetings, pleasantries, and temporary context. "
                "Return a JSON object with a 'memories' array where each item has:\n"
                '  - "memory": the fact text (concise, third-person, present tense)\n'
                '  - "memory_type": one of "fact", "preference", "project", "skill", "goal", "custom"\n'
                '  - "importance": float from 0.0 (trivial) to 1.0 (critical)\n'
                'Return {"memories": []} if no durable facts are found.'
            ),
        )
        user_chat = ChatMessage(
            role="user",
            content=f"User message: {user_message}\n\nAssistant response: {assistant_message}",
        )
        return [system, user_chat]

    async def _extract_memories_via_llm(
        self,
        user_message: str,
        assistant_message: str,
        chat_service: ChatService,
        user_id: str | None = None,
        conversation_id: str | None = None,
    ) -> list[MemoryExtractionItem]:
        messages = self._build_extraction_prompt(user_message, assistant_message)
        request = ChatRequest(messages=messages)
        response = await chat_service.chat(request)

        if self.usage_tracking and response.usage and user_id:
            usage = response.usage
            details = usage.get("prompt_tokens_details") or {}
            tu = {
                "input_tokens": usage.get("prompt_tokens", 0) or 0,
                "output_tokens": usage.get("completion_tokens", 0) or 0,
                "cached_input_tokens": (details.get("cached_tokens", 0) or 0) if isinstance(details, dict) else 0,
            }
            await self.usage_tracking.track_usage(
                user_id=user_id,
                conversation_id=conversation_id,
                provider="deepseek",
                model=response.model_dump().get("model", chat_service.default_model),
                feature="memory_extraction",
                **tu,
            )

        content = ""
        if response.choices:
            choice = response.choices[0]
            if isinstance(choice, dict):
                msg = choice.get("message", {})
                if isinstance(msg, dict):
                    content = msg.get("content", "")

        if not content:
            return []

        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            logger.warning("Memory extraction LLM returned invalid JSON", exc_info=True)
            return []

        items = data.get("memories", [])
        return [MemoryExtractionItem(**item) for item in items]

    async def extract_from_exchange(
        self,
        user_id: str,
        user_message: str,
        assistant_message: str,
        chat_service: ChatService,
    ) -> list[Memory]:
        count = await self.get_memory_count(user_id)
        remaining = self.max_per_user - count
        if remaining <= 0:
            logger.info("Extraction skipped: user %s at limit %d/%d", user_id, count, self.max_per_user)
            return []

        items = await self._extract_memories_via_llm(user_message, assistant_message, chat_service, user_id=user_id)
        created = []
        for item in items:
            if len(created) >= remaining:
                break
            is_dup = await self._check_duplicate(user_id, item.memory)
            if is_dup:
                continue
            mem = await self.save_memory(
                user_id=user_id,
                memory=item.memory,
                memory_type=item.memory_type,
                importance=item.importance,
            )
            if mem is not None:
                created.append(mem)
        return created
