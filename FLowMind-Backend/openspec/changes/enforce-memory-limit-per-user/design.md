## Context

The long-term memory system stores extracted user facts in the `memories` table. Currently there is no upper bound — memories accumulate indefinitely with each conversation. This design adds a configurable per-user memory cap to prevent unbounded growth, degrade retrieval quality, and increase storage overhead. The frontend also needs visibility into usage via a dedicated endpoint and response headers.

This is a small incremental change to the existing MemoryService, chat API, and memory management API. No new services, dependencies, or infrastructure are introduced.

## Goals / Non-Goals

**Goals:**
- Enforce a configurable per-user limit on stored memories (`MEMORY_MAX_PER_USER`, default 100)
- Silently skip new memory creation when the limit is reached (no error to user, no extraction LLM call)
- Allow deletion and retrieval to work normally regardless of limit
- Expose usage stats via `GET /v1/users/me/memory-usage` endpoint
- Include usage stats as headers on `GET /v1/memories` responses
- Follow existing project patterns (no repository layer, services use AsyncSession directly)

**Non-Goals:**
- No per-user override via `extra_data` (only global env var)
- No automatic memory pruning, summarization, or eviction (future work)
- No changes to the memory retrieval or ranking logic
- No changes to frontend beyond the API contract
- No changes to the extraction LLM prompt itself

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Limit enforcement location | `MemoryService.save_memory()` and `extract_from_exchange()` | Single point of truth for all memory creation paths (direct save and extraction). |
| Limit check before extraction LLM call | Check in `run_memory_extraction()` before calling `extract_from_exchange()` | Avoids unnecessary LLM cost when the user is already at the limit. |
| Return type change | `save_memory()` returns `Memory \| None` instead of `Memory` | Callers need to know if the save succeeded. `None` signals skipped due to limit. |
| Usage computation | `COUNT(*)` query in a `MemoryService.get_memory_count(user_id)` helper | On-the-fly, no stale cached value, no extra column to maintain. |
| Stats on list endpoint | `usage` object in response body (`{"memories": [...], "usage": {"count": N, "max": M, "percentage": N/M}}`) | Frontend consumes it alongside the array without parsing headers. Consistent with the dedicated usage endpoint shape. |
| Separate usage endpoint | `GET /v1/users/me/memory-usage` | Gives the frontend a lightweight way to check usage without fetching the full list. |
| Config field | `memory_max_per_user: int = 100` in `app/config.py` | Follows existing pattern of `pydantic_settings.BaseSettings` with env file. |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `COUNT(*)` on `memories` adds query overhead on every list request | `memories.user_id` is already indexed. `COUNT(*)` with a filter on a PK/FK column is fast even at scale (PostgreSQL). |
| Limit is global — all users share the same cap | Env var can be changed without redeploy. Per-user override can be added later via `extra_data` without breaking changes. |
| Stale usage data if count is cached | We compute on-the-fly every request. No caching. The cost is negligible (indexed COUNT). |
| Silent skip may confuse users | The frontend can display the usage percentage (from headers or the usage endpoint) to inform users. No silent data loss — the extraction just stops creating new facts. |

## Migration Plan

1. **Add env var** — Set `MEMORY_MAX_PER_USER=100` in `.env` or deployment environment (default is 100, so existing deployments will get the limit automatically).
2. **Deploy** — Rolling restart of API servers. The limit check becomes active immediately. No DB migration needed.
3. **Rollback** — Remove or increase `MEMORY_MAX_PER_USER`. No code rollback needed — the existing code gracefully handles the change.

## Open Questions

None. All design decisions are resolved.
