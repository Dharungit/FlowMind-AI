## Why

FlowMind has no visibility into token usage, cost, or system utilization. Without tracking every AI operation (chat, memory extraction, embeddings, title generation), we cannot build analytics dashboards for users or platform admins. This change establishes the raw usage event layer that all future analytics will derive from.

## What Changes

- New `usage_events` database table with indexes optimized for analytics aggregation queries
- New `UsageTrackingService` (FastAPI dependency) that records usage events for every AI operation
- New `app/pricing.py` module with configurable model pricing and a `calculate_cost()` helper
- New `AnalyticsService` for running dashboard aggregation queries against `usage_events`
- New API endpoints: `GET /v1/analytics/user` and `GET /v1/analytics/admin`
- Integration of usage tracking into `ChatService.chat()`, `ChatService.stream_chat()`, `MemoryService.extract_from_exchange()`, `EmbeddingService.embed()` / `embed_batch()`, and title generation flow
- New Alembic migration for the `usage_events` table and indexes
- No changes to existing chat, memory, or embedding behavior
- No aggregation tables, cron jobs, or caching layers

## Capabilities

### New Capabilities

- `usage-event-tracking`: Recording usage events (tokens, cost, model, feature) for every AI operation — the single source of truth for analytics
- `user-analytics`: Dashboard aggregation queries scoped to a single user (total usage, daily breakdown)
- `admin-analytics`: Platform-wide dashboard aggregation queries (total usage, per-user, per-feature, cache breakdown, peak hours, per-user cost)

### Modified Capabilities

- (none)

## Impact

- **Database**: New `usage_events` table with 5 indexes, new Alembic migration
- **New files**: `app/services/usage_tracking.py`, `app/services/analytics.py`, `app/pricing.py`, `app/api/analytics.py`
- **Modified files**: `app/services/chat.py`, `app/services/embedding.py`, `app/services/memory.py`, `app/api/chat.py`, `app/config.py` (add admin user IDs setting), `app/main.py` (register new router)
- **Dependencies**: No new external dependencies
- **API**: Two new endpoints (`/v1/analytics/user`, `/v1/analytics/admin`)
