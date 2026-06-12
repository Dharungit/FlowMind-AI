## Why

Chat is currently stateless — messages sent via `/v1/chat/completions` are never persisted and disappear on refresh. Users need persistent conversation history to review past chats, continue interrupted conversations, and have a consistent experience across sessions.

## What Changes

- Add `Conversation` and `Message` database models with foreign-key relationships to `User`
- Create REST API endpoints for CRUD on conversations and messages
- Replace public `/v1/chat/completions` with a new `POST /v1/conversations/{id}/messages` endpoint that persists messages automatically
- Move chat completion logic to an internal service method (no longer a public route)
- Add Alembic migration for new tables

## Capabilities

### New Capabilities
- `conversation-crud`: Create, list, get, update title, and delete conversations scoped to the authenticated user
- `message-crud`: Add messages to a conversation and delete individual messages
- `auto-persist-chat`: When a user sends a new message, the backend fetches the full conversation history from the database, appends the new message, calls the LLM, persists both the user message and the assistant response, and returns the result

### Modified Capabilities

(none)

## Impact

- **Database**: New `conversations` and `messages` tables; Alembic migration required
- **Models**: `app/models.py` — add `Conversation` and `Message` SQLAlchemy models
- **Schemas**: `app/schemas/chat.py` — add request/response schemas for conversation and message APIs
- **API**: `app/api/chat.py` — new router with conversation+message endpoints; remove public `/v1/chat/completions`
- **Services**: `app/services/chat.py` — refactor chat completion to be callable internally; new service for conversation/message persistence
- **Authentication**: All new endpoints require authentication (existing auth middleware)
- **Configuration**: No new dependencies or env vars required
