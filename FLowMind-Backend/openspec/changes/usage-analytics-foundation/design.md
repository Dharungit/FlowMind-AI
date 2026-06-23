## Context

FlowMind has five database tables (users, sessions, conversations, messages, memories), three AI services (ChatService via DeepSeek, EmbeddingService via OpenAI text-embedding-3-small, MemoryService combining both), and zero usage tracking. Every AI operation — chat completions, memory extraction LLM calls, title generation, embedding generation — produces no record of token consumption, cost, or feature attribution. This design adds a lightweight, append-only usage event layer that all future analytics will derive from.

**In-force ADRs constraining this design:**
- ADR-0001: PostgreSQL + async SQLAlchemy + Alembic imperative migrations
- ADR-0002–0005: Auth/session decisions (not directly relevant)

Current service wiring (for reference on integration points):

```mermaid
flowchart LR
  subgraph flowmind[FLowMind API Container]
    direction TB
    chat_routes[Chat Routes]
    memory_routes[Memory Routes]
    msg_svc[MessageService]
    chat_svc[ChatService]
    embed_svc[EmbeddingService]
    mem_svc[MemoryService]
    conv_svc[ConversationService]
  end

  subgraph external[External Systems]
    deepseek[DeepSeek API]
    openai[OpenAI API]
  end

  subgraph storage[(PostgreSQL)]
    db[(conversations\nmessages\nmemories\nusers\nsessions)]
  end

  chat_routes --> msg_svc
  chat_routes --> mem_svc
  chat_routes --> conv_svc
  memory_routes --> mem_svc
  msg_svc --> chat_svc
  mem_svc --> embed_svc
  mem_svc --> chat_svc
  chat_svc -->|HTTP| deepseek
  embed_svc -->|HTTP| openai
  msg_svc --> db
  mem_svc --> db
  conv_svc --> db
```

## Goals / Non-Goals

**Goals:**
- Record a `usage_events` row for every AI operation (chat, streaming chat, memory extraction, title generation, embedding)
- Centralize cost calculation in a configurable `app/pricing.py` module
- Provide dashboard-ready aggregation queries via `AnalyticsService`
- Expose `GET /v1/analytics/user` and `GET /v1/analytics/admin` endpoints
- Follow existing FastAPI dependency injection, SQLAlchemy 2.0 model, and Alembic imperative migration patterns

**Non-Goals:**
- No changes to existing chat, memory, or embedding behavior
- No aggregated analytics tables (no materialized views, summary tables, or rollups)
- No cron jobs, caching layers, or external analytics services
- No changes to the existing data model (users, conversations, messages, memories)
- No admin role system — admin access is via env-var allowlist of user IDs

## Decisions

### D1: Usage Tracking as a Composable Service Dependency

`UsageTrackingService` is a FastAPI-wired class holding an `AsyncSession`, injected via `Depends()` into route handlers and downstream services that already own a db session.

**Why:** Follows the existing pattern used by `MemoryService` and `ConversationService`. Route handlers and services like `MessageService` already have a db session — they pass it through the tracking service rather than the tracking service managing its own session lifecycle separately.

**Alternative considered:** Standalone module-level functions — rejected because the project standardizes on class-based services with `Depends()` injection.

### D2: Track Usage at the Caller, Not Inside AI Services

`ChatService` and `EmbeddingService` remain stateless — they do not know about usage tracking. The callers (`MessageService`, `MemoryService`, route handlers) extract token usage from the response and call `UsageTrackingService.track_usage()`.

**Why:** `ChatService` currently has no db session and adding one would couple it to persistence. Usage tracking is a cross-cutting concern that belongs at the orchestration layer, not inside the AI client wrapper.

**Integration map:**

| AI Operation | Caller | Token Source |
|---|---|---|
| Chat (non-streaming) | `MessageService.add_message()` | `ChatResponse.usage` (OpenAI-compat) |
| Chat (streaming) | `MessageService.stream_add_message()` | Last stream chunk `usage` field |
| Memory extraction LLM | `MemoryService._extract_memories_via_llm()` | `ChatResponse.usage` |
| Title generation | Route handler `generate_conversation_title()` | `ChatResponse.usage` |
| Embeddings | `MemoryService.save_memory()` / `_check_duplicate()` | `OpenAI EmbeddingsResponse.usage` |

### D3: Separate Pricing Module

`app/pricing.py` is a standalone module (not Pydantic Settings) containing the `MODEL_PRICING` dictionary and `calculate_cost()` helper.

**Why:** Keeps pricing concerns isolated from environment configuration. The dict can be extended without touching `.env` or `config.py`. Settings still hold the admin user IDs list (`admin_user_ids: list[str] = []`) since that's a deployment config.

### D4: Admin Identification via Config Allowlist

A new `Settings` field `admin_user_ids: list[str] = []` loaded from `ADMIN_USER_IDS` env var (comma-separated UUIDs). The admin endpoints check `request.state.user_id in settings.admin_user_ids`.

**Why:** No new database column or auth flow. Admin access is a deployment-time decision. In Phase 1, the analytics feature isn't sensitive enough to warrant a full RBAC system.

### D5: AnalyticsService for Aggregation, Not Route Handlers

`AnalyticsService` is a FastAPI dependency holding a db session, with methods like `get_user_total_usage(user_id)` and `get_platform_usage()`. Route handlers call the service and serialize the result.

**Why:** Keeps aggregation SQL out of route handlers, following the same service/repository pattern already used by `ConversationService`, `MemoryService`, etc.

### D6: Streaming Chat Usage Tracking in `stream_add_message`

The `usage` from the last stream chunk is already captured in `MessageService.stream_add_message()` at line 169 (`usage = chunk["usage"]`). After streaming completes and the assistant message is saved, a call to `UsageTrackingService.track_usage()` is inserted at that point.

**Why:** Token info is only available in the final streaming chunk. The existing code already extracts it — we just need to pipe it to the tracking service.

### D7: Memory Extraction Embedding Tracking at MemoryService

`MemoryService.save_memory()` and `_check_duplicate()` each call `embedding_service.embed()`. Since `MemoryService` already holds `self.db`, usage tracking for these embedding calls is added inside `MemoryService`.

**Why:** Embedding calls are nested inside memory operations — tracking at the MemoryService level captures all embeddings without exposing the db session to `EmbeddingService`.

### D8: Schema and Index Design

The `usage_events` table follows the same UUID PK + FK pattern as existing tables. Five indexes support the known query patterns:

| Index | Purpose |
|---|---|
| `user_id` | User-scoped lookups |
| `created_at` | Time-range scans |
| `feature` | Feature breakdown queries |
| `(user_id, created_at)` | User daily/weekly aggregation |
| `(feature, created_at)` | Feature time-series |

**Why:** Composite indexes let analytics queries use index-only scans without hitting the table for filtering. The index list matches the query patterns in the analytics spec.

## Risks / Trade-offs

- **[Write Amplification]** Every AI operation creates a `usage_events` row. At high chat volume this table grows fast. Mitigation: `usage_events` is append-only with no UPDATEs, so PostgreSQL handles it efficiently. Table size is manageable — even 1M rows/day at ~200 bytes/row is ~200MB/day. Future archive/purge policy is a Phase 2 concern.
- **[No Aggregation Layer]** Dashboard queries scan `usage_events` directly. At scale, aggregation queries on large tables will be slow. Mitigation: the indexes cover all query patterns. If performance degrades, Phase 2 can add materialized views or a rollup table — the schema supports it without migration.
- **[Extraction Embeddings Count]** `MemoryService.save_memory()` calls `embedding_service.embed()` once, and `_check_duplicate()` also calls it once. Each memory save generates two embedding usage events (the embed for creation + the embed for dedup check). This is correct behavior — both are actual AI operations.

## Migration Plan

1. Create Alembic migration for `usage_events` table + 5 indexes (imperative style, matching existing pattern)
2. Create `app/pricing.py` with `MODEL_PRICING` and `calculate_cost()`
3. Create `app/services/usage_tracking.py` with `UsageTrackingService`
4. Create `app/services/analytics.py` with `AnalyticsService`
5. Create `app/api/analytics.py` with two endpoints
6. Integrate tracking into `MessageService`, `MemoryService`, and `generate_conversation_title` route
7. Add `admin_user_ids` to `app/config.py` Settings
8. Register analytics router in `app/main.py`

**Rollback:** Revert the router registration. The `usage_events` table can remain — writes are fire-and-forget and don't affect existing behavior.

## Open Questions

- Is DeepSeek's streaming API guaranteed to send usage in the final chunk? If not, streaming chat usage may need a separate non-streaming call or estimation based on response length. (Assumption: yes, it follows OpenAI streaming protocol where the final chunk includes `usage`.)

```mermaid
flowchart LR
  subgraph flowmind[FLowMind API Container]
    direction TB
    routes[Chat Routes\nMemory Routes]
    msg_svc[MessageService]
    mem_svc[MemoryService]
    chat_svc[ChatService]
    embed_svc[EmbeddingService]

    subgraph new[New — Phase 1]
      usage_svc[UsageTrackingService]
      analytics_svc[AnalyticsService]
    end
  end

  subgraph external[External Systems]
    deepseek[DeepSeek API]
    openai[OpenAI API]
  end

  subgraph db[(PostgreSQL)]
    existing[conversations\nmessages\nmemories\nusers\nsessions]
    usage_events[(usage_events — NEW)]
  end

  routes --> msg_svc
  routes --> mem_svc
  msg_svc --> chat_svc
  mem_svc --> embed_svc
  mem_svc --> chat_svc
  chat_svc -->|HTTP| deepseek
  embed_svc -->|HTTP| openai

  msg_svc -.->|track| usage_svc
  mem_svc -.->|track| usage_svc
  routes -.->|track| usage_svc
  usage_svc -->|INSERT| usage_events
  analytics_svc -->|SELECT| usage_events
  routes -.->|query| analytics_svc

  msg_svc --> existing
  mem_svc --> existing
```
