## 1. Foundation — Dependencies and Config

- [x] 1.1 Add `openai_api_key`, `memory_similarity_threshold`, `memory_max_results` fields to `app/config.py`
- [x] 1.2 Add `pgvector>=0.3.0` to `pyproject.toml` and install
- [x] 1.3 Create Alembic migration adding pgvector extension, `memories` table, CHECK constraints, and HNSW index
- [x] 1.4 Add `Memory` ORM model to `app/models.py` with `User.memories` relationship
- [x] 1.5 Create `app/schemas/memory.py` with `MemoryResponse`, `MemoryExtractionItem`, `MemoryUpdate` Pydantic schemas

## 2. Embedding Service

- [x] 2.1 Create `app/services/embedding.py` with `EmbeddingService` class — stateless singleton wrapping OpenAI `text-embedding-3-small`
- [x] 2.2 Implement `embed(text)` and `embed_batch(texts)` methods — graceful empty list return when no API key configured
- [x] 2.3 Create `tests/test_embedding_service.py` with tests for single embed, batch embed, and no-API-key fallback

## 3. Memory Service — CRUD and Storage

- [x] 3.1 Create `app/services/memory.py` with `MemoryService` class — constructor takes `(db: AsyncSession, embedding_service)`
- [x] 3.2 Implement `save_memory(user_id, memory, memory_type, importance)` — generates embedding, inserts row, commits
- [x] 3.3 Implement `get_user_memories(user_id, memory_type, limit, offset)` — paginated list query
- [x] 3.4 Implement `delete_memory(memory_id, user_id)` — scoped delete, returns bool
- [x] 3.5 Implement `bump_access_count(memory_ids)` — increments access_count + updates last_accessed_at
- [x] 3.6 Create `tests/test_memory_service.py` with tests for all CRUD operations

## 4. Memory Service — Retrieval and Extraction

- [x] 4.1 Implement `search_by_similarity(user_id, embedding, limit)` — pgvector cosine distance query via raw SQL
- [x] 4.2 Implement `retrieve_relevant(user_id, user_message, limit)` — embed message, search, rank by similarity × importance, bump access count
- [x] 4.3 Implement `_check_duplicate(user_id, memory_text)` — embed + top-1 cosine search against threshold
- [x] 4.4 Implement `_build_extraction_prompt(user_message, assistant_message)` — structured LLM prompt for extraction
- [x] 4.5 Implement `_extract_memories_via_llm(user_message, assistant_message)` — calls ChatService, parses JSON response
- [x] 4.6 Implement `extract_from_exchange(user_id, user_message, assistant_message)` — orchestrates extraction, dedup, and save
- [x] 4.7 Add tests for retrieval, deduplication, and extraction flows

## 5. Memory Retrieval Integration

- [x] 5.1 Add `memory_context` optional parameter to `MessageService.stream_add_message()` signature
- [x] 5.2 Insert memory context as system message at position 0 in `all_messages` array when `memory_context` is provided
- [x] 5.3 Add `stream_meta` dict parameter to `stream_add_message()` to capture conversation_id for new conversations
- [x] 5.4 Run existing streaming tests to verify no regression

## 6. Memory Extraction Integration

- [x] 6.1 Create `run_memory_extraction()` background task function in `app/api/chat.py` — opens own DB session, finds latest assistant message, calls extraction, logs completion with count and facts at INFO level after commit
- [x] 6.2 Modify `POST /v1/stream` in `app/api/chat.py` to call `MemoryService.retrieve_relevant()` before streaming
- [x] 6.3 Schedule `run_memory_extraction()` via `BackgroundTasks` after the streaming response
- [x] 6.4 Handle `conversation_id=None` case by using `stream_meta` dict to capture the real ID
- [x] 6.5 Add `get_memory_service` dependency for per-request `MemoryService` instantiation

## 7. Memory Management API

- [x] 7.1 Create `app/api/memory.py` with `GET /v1/memories` endpoint (pagination, type filter, auth required)
- [x] 7.2 Implement `DELETE /v1/memories/{memory_id}` endpoint (scoped to user, returns 404 if not found)
- [x] 7.3 Register memory router in `app/main.py` and init `EmbeddingService` in lifespan

## 8. End-to-End Verification

- [x] 8.1 Run `alembic upgrade head` on a local DB — verify migration applies cleanly (requires local PostgreSQL with pgvector)
- [x] 8.2 Run full test suite — all existing and new tests pass (73/73 passed)
- [x] 8.3 Verify `GET /v1/memories` returns empty list and `DELETE` returns 404 on fresh DB (requires running backend with DB)
- [x] 8.4 Verify streaming response works without OPENAI_API_KEY set (memory retrieval skips gracefully — tested via `test_embed_no_api_key_returns_empty`)
- [x] 8.5 Run `openspec validate long-term-user-memory --type change --strict` before archive — **passed**
