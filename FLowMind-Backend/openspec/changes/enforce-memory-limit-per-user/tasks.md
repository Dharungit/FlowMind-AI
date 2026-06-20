## 1. Config and Model

- [x] 1.1 Add `memory_max_per_user: int = 100` field to `app/config.py` and `.env.example` + `docker-compose.yml`
- [x] 1.2 Add `get_memory_count(user_id)` helper to `MemoryService` — runs `COUNT(*)` on memories for the user

## 2. Limit Enforcement in MemoryService

- [x] 2.1 Modify `save_memory()` to check `get_memory_count()` against `memory_max_per_user` before insert — return `None` if at or above limit
- [x] 2.2 Modify `extract_from_exchange()` to filter extracted items against remaining capacity after dedup check
- [x] 2.3 Modify `run_memory_extraction()` in `app/api/chat.py` to check limit before calling the extraction LLM — skip with INFO log if at limit

## 3. Memory Stats Endpoint and Headers

- [x] 3.1 Create `GET /v1/users/me/memory-usage` endpoint in `app/api/memory.py` — returns `{"count": N, "max": M, "percentage": N/M}`
- [x] 3.2 Modify `GET /v1/memories` in `app/api/memory.py` to include `usage` object in response body — `{"memories": [...], "usage": {"count": N, "max": M, "percentage": N/M}}`

## 4. Tests

- [x] 4.1 Update `tests/test_memory_service.py` with tests for `get_memory_count()`, limit enforcement in `save_memory()`, and filtered extraction
- [x] 4.2 Update `tests/test_api.py` and `tests/test_streaming.py` with tests for memory-usage endpoint, response headers, and limit-skip in streaming

## 5. Verification

- [x] 5.1 Run full test suite — all existing and new tests pass (77/77)
- [x] 5.2 Run `openspec validate enforce-memory-limit-per-user --type change --strict` before archive
