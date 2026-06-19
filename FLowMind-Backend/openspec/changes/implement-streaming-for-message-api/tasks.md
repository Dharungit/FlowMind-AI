## 1. Service Layer — Streaming Support

- [x] 1.1 Add `StreamRequest` schema with optional `conversation_id: UUID` and `messages: list[MessageItem]`
- [x] 1.2 Add `stream_add_message()` method to `MessageService` that validates/creates conversation, saves user messages, creates placeholder assistant message, delegates to ChatService streaming, buffers tokens, persists on completion/error/disconnect, and yields SSE events (including first event with `conversation_id`, raw OpenAI chunks, and final done/error event with `conversation_id` + `MessageResponse`)
- [x] 1.3 Update `ChatService.stream_chat()` to extract usage metadata from the final OpenAI chunk and return it alongside the stream

## 2. API Layer — Streaming Endpoint

- [x] 2.1 Add `POST /v1/stream` route in `app/api/chat.py` that accepts `StreamRequest`, injects `MessageService` via Depends, and returns `StreamingResponse` with `media_type="text/event-stream"`
- [x] 2.2 Handle client disconnect gracefully — ensure the async generator cleans up and saves partial content on cancellation

## 3. Error Handling & Edge Cases

- [x] 3.1 Handle OpenAI API errors mid-stream: save partial content, emit error SSE event, close stream
- [x] 3.2 Handle invalid or non-existent conversation (scoped to user): return 404
- [x] 3.3 Handle unauthenticated requests: return 401 (covered by existing auth middleware)
- [x] 3.4 Ensure existing `POST /v1/conversations/{id}/messages` endpoint remains unchanged

## 4. Testing

- [x] 4.1 Write test for successful full stream with new conversation creation
- [x] 4.2 Write test for streaming into an existing conversation
- [x] 4.3 Write test for client disconnect mid-stream (partial save)
- [x] 4.4 Write test for OpenAI error mid-stream (partial save + error event)
- [x] 4.5 Write test for unauthenticated request returning 401
- [x] 4.6 Write test for unauthorized conversation access returning 404
- [x] 4.7 Write test proving existing non-streaming endpoint still works

## 5. Verification

- [x] 5.1 Run `openspec validate` on the change before archiving
