import logging

from openai import AsyncOpenAI

from app.config import Settings

logger = logging.getLogger("flowmind")


class EmbeddingService:
    def __init__(self, settings: Settings) -> None:
        self.client: AsyncOpenAI | None = None
        self.model = "text-embedding-3-small"
        if settings.openai_api_key:
            self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        else:
            logger.warning("OPENAI_API_KEY not configured. Embedding service will return empty vectors.")

    async def embed(self, text: str) -> list[float]:
        if self.client is None:
            logger.warning("Embedding skipped: no OpenAI API key configured")
            return []

        resp = await self.client.embeddings.create(
            model=self.model,
            input=text,
        )
        return resp.data[0].embedding

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if self.client is None or not texts:
            logger.warning("Embedding batch skipped: no OpenAI API key configured or empty input")
            return []

        resp = await self.client.embeddings.create(
            model=self.model,
            input=texts,
        )
        sorted_data = sorted(resp.data, key=lambda x: x.index)
        return [d.embedding for d in sorted_data]
