## Why

Users currently cannot search past conversations by content — they must remember the title and scroll through a flat list. As the conversation count grows, finding relevant information becomes impractical. A search API solves this, enabling clients to implement search UI without backend changes.

## What Changes

- **New endpoint** `GET /v1/conversations/search?q=<query>` — full-text search across conversation titles, user messages, and assistant messages
- Each result returns `conversation_id`, `title`, `matched_text` (contextual snippet), `created_at`, `updated_at`
- Results limited to top 5, ordered by `updated_at` descending
- Search uses PostgreSQL `ILIKE` (case-insensitive pattern matching) on existing columns — no schema migrations or new dependencies
- `matched_text` shows a ~200-char window around the first match occurrence, with `...` indicators when truncated

## Capabilities

### New Capabilities
- `conversation-search`: Search user conversations by title and message content, returning ranked results with matching snippets

### Modified Capabilities
- *(none — purely additive)*

## Impact

- **Files to modify:**
  - `app/schemas/conversations.py` — add `ConversationSearchResult` and `ConversationSearchResponse` schemas
  - `app/services/conversation.py` — add `search()` method using ILIKE + correlated subquery
  - `app/api/chat.py` — add `GET /v1/conversations/search` route
  - `tests/test_api.py` — add test coverage
- **No schema migrations, no new dependencies, no config changes**
