## Why

Memories accumulate without bound. A user can pile up thousands of extracted facts over time, degrading retrieval quality (more candidates → noise) and increasing storage cost. Adding a per-user memory cap prevents unbounded growth, keeps retrieval focused on the most relevant facts, and gives the frontend visibility into usage.

## What Changes

- New `MEMORY_MAX_PER_USER` config field (default 100) in `app/config.py` + `.env.example`
- `MemoryService.save_memory()` checks the current count against the limit before inserting — if at or above limit, the save is a no-op (returns `None`)
- `MemoryService.extract_from_exchange()` skips saving new memories when the user is at the limit — existing extraction flow continues, new memories just aren't persisted
- New `GET /v1/users/me/memory-usage` endpoint returning `{"count": N, "max": M, "percentage": N/M}` — computed on-the-fly, no extra DB column needed
- `GET /v1/memories` response body includes `{..., "usage": {"count": N, "max": M, "percentage": N/M}}` alongside the memories array
- `MemoryService.get_user_memories()` returns a tuple `(memories, total_count)` to expose total memory count alongside paginated results
- No changes to deletion — existing scoped `DELETE /v1/memories/{id}` paths remain unchanged
- No error returned when limit is reached — extraction silently skips, existing memories remain accessible
- Background extraction in `run_memory_extraction()` checks limit before calling `extract_from_exchange()` and skips logging at INFO level

## Capabilities

### New Capabilities
- `memory-limit-check`: Enforce a configurable per-user memory cap. Prevents new memory creation when the limit is reached. No user-facing errors — extraction skips silently. Existing memories remain fully accessible.
- `memory-usage`: New `GET /v1/users/me/memory-usage` endpoint plus `usage` object in `GET /v1/memories` response body — `{"count": N, "max": M, "percentage": N/M}`. No new DB columns — computed on-the-fly from `COUNT(*)` query.

### Modified Capabilities
- `memory-extraction`: Background extraction skips saving new memories when the user is at or above the limit. Existing extraction prompt runs as before — only the save step is skipped.
- `memory-management`: No behaviour changes. Deletion is already scoped and unrestricted.

## Impact

- **Config**: New `MEMORY_MAX_PER_USER` env var (default 100) added to `app/config.py`, `.env.example`, and `docker-compose.yml`
- **Services**: `MemoryService.save_memory()` modified to check limit and return `Memory | None`. `extract_from_exchange()` modified to filter items after dedup check against remaining capacity.
- **API**: New `GET /v1/users/me/memory-usage` endpoint. `GET /v1/memories` response body includes a `usage` object with `count`, `max`, `percentage`.
- **Background tasks**: `run_memory_extraction()` checks limit upfront and skips extraction entirely if at/above limit.
- **No breaking changes**: All existing endpoints and responses remain unchanged.
