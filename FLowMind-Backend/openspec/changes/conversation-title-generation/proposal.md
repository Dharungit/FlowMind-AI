## Why

Conversations in FLowMind always show "New Conversation" as the title until the user manually renames them. This is a poor UX — users have to open conversations to identify them, and the sidebar becomes unhelpful after more than a few conversations. Auto-generating a title from the first user message solves this without any user effort.

## What Changes

- Add `title_generated` boolean column to the `conversations` table to ensure title generation runs exactly once per conversation
- Create a background function (`run_title_generation`) that calls the LLM with a concise prompt to generate a short title from the user's first message
- Trigger the background function from the streaming endpoint (`POST /v1/stream`) after the first streaming response completes
- The non-streaming endpoint is unaffected — title generation only runs for the streaming flow

## Capabilities

### New Capabilities
- `conversation-title-generation`: Auto-generate a concise title for a conversation using the LLM, triggered after the user sends the first message via the streaming API. The title is generated from the first user message content and the conversation's `title_generated` flag prevents re-generation on subsequent messages.

### Modified Capabilities

None.

## Impact

- **Models**: Add `title_generated: bool` column to `Conversation` model
- **Database**: New Alembic migration to add the column
- **API** (`app/api/chat.py`): New `run_title_generation()` background function; trigger added in `_stream_with_extraction()`
- **No new dependencies**: Uses existing `ChatService` (OpenAI/DeepSeek) and `BackgroundTasks`
- **No new API endpoints**: Internal change only
