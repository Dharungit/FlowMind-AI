## 1. Database Schema

- [x] 1.1 Create Alembic migration for `usage_events` table with columns: `id` (UUID PK), `user_id` (UUID FK, NOT NULL), `conversation_id` (UUID, nullable), `message_id` (UUID, nullable), `provider` (VARCHAR 50), `model` (VARCHAR 100), `feature` (VARCHAR 50), `input_tokens` (INTEGER, default 0), `output_tokens` (INTEGER, default 0), `total_tokens` (INTEGER, default 0), `cached_input_tokens` (INTEGER, default 0), `estimated_cost` (NUMERIC 12,6, default 0), `metadata` (JSONB, nullable), `created_at` (TIMESTAMPTZ)
- [x] 1.2 Add indexes: `user_id`, `created_at`, `feature`, composite `(user_id, created_at)`, composite `(feature, created_at)`
- [x] 1.3 Add `UsageEvent` ORM model to `app/models.py` following existing patterns

## 2. Pricing Module

- [x] 2.1 Create `app/pricing.py` with `MODEL_PRICING` dictionary containing `deepseek-chat` and `text-embedding-3-small` pricing
- [x] 2.2 Implement `calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float` helper

## 3. Usage Tracking Service

- [x] 3.1 Create `app/services/usage_tracking.py` with `UsageTrackingService` class accepting `AsyncSession` in `__init__`
- [x] 3.2 Implement `track_usage(user_id, conversation_id, message_id, provider, model, feature, input_tokens, output_tokens, cached_input_tokens=0, metadata=None)` that calculates total tokens and estimated cost, then inserts a `UsageEvent`
- [x] 3.3 Add `get_usage_tracking_service` dependency factory in `app/api/chat.py` (or a shared deps module)

## 4. Analytics Service

- [x] 4.1 Create `app/services/analytics.py` with `AnalyticsService` class accepting `AsyncSession` in `__init__`
- [x] 4.2 Implement `get_user_total_usage(user_id)` returning `total_tokens`, `input_tokens`, `output_tokens`
- [x] 4.3 Implement `get_user_daily_usage(user_id)` returning array of `{date, total_tokens}` grouped by day
- [x] 4.4 Implement `get_platform_usage()` returning sum of all `total_tokens`
- [x] 4.5 Implement `get_usage_per_user()` returning array of `{user_id, total_tokens}` grouped by user
- [x] 4.6 Implement `get_cost_per_user()` returning array of `{user_id, estimated_cost}` grouped by user
- [x] 4.7 Implement `get_feature_breakdown()` returning array of `{feature, total_tokens}` grouped by feature
- [x] 4.8 Implement `get_cache_breakdown()` returning `{cached_tokens, non_cached_tokens}`
- [x] 4.9 Implement `get_peak_usage_hours()` returning array of `{hour, total_tokens}` grouped by `EXTRACT(HOUR FROM created_at)`

## 5. API Endpoints

- [x] 5.1 Create `app/api/analytics.py` with authenticated `GET /v1/analytics/user` endpoint returning `{total_usage, daily_usage}`
- [x] 5.2 Add `GET /v1/analytics/admin` endpoint with admin allowlist check returning `{platform_usage, usage_per_user, cost_per_user, feature_breakdown, cache_breakdown, peak_usage_hours}`
- [x] 5.3 Add `admin_user_ids: list[str] = []` to `Settings` in `app/config.py`
- [x] 5.4 Register analytics router in `app/main.py`

## 6. Integration — Chat

- [x] 6.1 In `MessageService.add_message()`: after `chat_resp` is received, extract token usage from response and call `usage_tracking_service.track_usage()` with feature `chat`
- [x] 6.2 In `MessageService.stream_add_message()`: after streaming completes and `usage` is captured, call `usage_tracking_service.track_usage()` with feature `chat`

## 7. Integration — Memory Extraction

- [x] 7.1 In `MemoryService._extract_memories_via_llm()`: after `chat_service.chat()` returns, extract token usage and call `usage_tracking_service.track_usage()` with feature `memory_extraction`
- [x] 7.2 In `MemoryService.save_memory()`: after `embedding_service.embed()` returns, extract token usage and call `usage_tracking_service.track_usage()` with feature `embedding`
- [x] 7.3 In `MemoryService._check_duplicate()`: after `embedding_service.embed()` returns, extract token usage and call `usage_tracking_service.track_usage()` with feature `embedding`

## 8. Integration — Title Generation

- [x] 8.1 In `generate_conversation_title()` route handler: after `chat_service.chat()` returns, extract token usage and call `usage_tracking_service.track_usage()` with feature `title_generation`

## 9. Verification

- [x] 9.1 Run `openspec validate usage-analytics-foundation --type change --strict`
- [x] 9.2 Run existing test suite to confirm no regressions
