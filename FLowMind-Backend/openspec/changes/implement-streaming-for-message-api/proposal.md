## Why

The message API currently returns the full assistant response only after the LLM finishes generating. Users see a loading spinner with no visibility into response progress. Streaming delivers tokens incrementally via SSE, reducing perceived latency and enabling a real-time chat UX — the expected standard for AI chat interfaces.

## What Changes

- New `POST /v1/stream` endpoint that accepts optional `conversation_id` + messages, creates/retrieves the conversation, saves user messages, and streams the assistant response token-by-token via SSE
- First SSE event emits `conversation_id` at the root so the client always knows which conversation owns the stream (critical for auto-created conversations)
- New `MessageService.stream_add_message()` method that buffers tokens, pipes OpenAI chunks to the client in real-time, and persists the assistant message on completion (or partial on error/disconnect)
- Update `ChatService.stream_chat()` to support usage metadata extraction from the final chunk
- Client cancellation handling — server detects disconnect and aborts the OpenAI call, saving partial content
- Implicit conversation creation — if no `conversation_id` provided, server generates one and creates the conversation automatically

## Capabilities

### New Capabilities
- `message-streaming`: SSE-based streaming of assistant responses via dedicated endpoint. Covers request validation, conversation auto-creation, user message persistence, token buffering, real-time SSE delivery of raw OpenAI chunks, final done event with full MessageResponse, error/disconnect handling with partial save, and client cancellation support.

### Modified Capabilities
- *(none — no existing specs)*

## Impact

- **New route**: `POST /v1/stream` in `app/api/chat.py`
- **New/modified services**: `MessageService.stream_add_message()` (new), minor updates to `ChatService.stream_chat()` for metadata extraction
- **New SSE event types** consumed by frontend
- **No new dependencies** — uses FastAPI `StreamingResponse` (built-in) and existing `openai` async streaming
- **No breaking changes** — existing `POST /v1/conversations/{id}/messages` remains unchanged
- **Frontend ADR already in place** (`0002-use-native-fetch-for-streaming.md`) — uses native `fetch` + `ReadableStream` + `AbortController`
