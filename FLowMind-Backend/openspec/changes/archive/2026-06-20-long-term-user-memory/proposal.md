## Why

FlowMind AI currently treats every conversation as an isolated session — the LLM has no memory of who the user is, what they've shared, or what they care about across different chats. This makes the experience feel impersonal and repetitive (users re-state the same context every conversation). Adding long-term memory allows FlowMind to remember durable user facts (projects, skills, preferences, goals) across sessions, injecting relevant context into every conversation automatically.

## What Changes

- New `memories` database table with pgvector VECTOR(1536) column + HNSW index for cosine similarity search
- New `EmbeddingService` — stateless singleton using OpenAI `text-embedding-3-small` (1536d)
- New `MemoryService` — per-request service handling retrieval, storage, deduplication, and LLM-based extraction
- Memory retrieval hook in `POST /v1/stream` — before the LLM call, relevant memories are injected as a system message
- Memory extraction trigger in `POST /v1/stream` — after the streaming response, `BackgroundTasks` extracts new memories from the assistant's reply using the existing LLM provider
- New `GET /v1/memories` and `DELETE /v1/memories/{id}` endpoints for basic memory management
- New Alembic migration creating the `memories` table with pgvector extension and HNSW index
- New configuration fields: `OPENAI_API_KEY`, `MEMORY_SIMILARITY_THRESHOLD` (0.85), `MEMORY_MAX_RESULTS` (5)
- New dependency: `pgvector>=0.3.0`

## Capabilities

### New Capabilities

- `memory-retrieval`: Inject relevant past user memories into the chat completion prompt before generating a response. Retrieves and ranks up to 5 memories per request using embedding similarity × importance scoring.
- `memory-extraction`: After each assistant response, asynchronously extract durable user facts from the conversation exchange via structured LLM extraction. Deduplicates against existing memories using cosine similarity threshold.
- `memory-management`: REST API endpoints (`GET /v1/memories`, `DELETE /v1/memories/{id}`) for users to view and delete their stored memories. No frontend changes required for core automatic operation.

### Modified Capabilities

- (none — no existing capabilities have behaviour changes at the spec level)

## Impact

- **Database**: Requires pgvector PostgreSQL extension. New `memories` table with HNSW index (requires PostgreSQL 12+ with pgvector extension installed).
- **Configuration**: `OPENAI_API_KEY` must be set in `.env` for embedding generation. Extraction uses the existing provider API key.
- **Dependencies**: `pgvector>=0.3.0` Python package added to `pyproject.toml`.
- **API**: Two new endpoints under `/v1/memories`. Internal modification to `POST /v1/stream` (memory retrieval + extraction hooks).
- **Services**: `MessageService.stream_add_message` gains an optional `memory_context` string parameter. `app/main.py` lifespan initializes a new `EmbeddingService` singleton.
- **No breaking changes**: All existing endpoints, models, and services remain unchanged. Memory system is additive and optional.
- **Background tasks**: Memory extraction runs via FastAPI BackgroundTasks after the streaming response completes. No separate worker process or task queue required.
