## Why

The frontend currently uses a non-streaming two-step flow: create a conversation via `POST /v1/conversations`, then send a message via `POST /v1/conversations/{id}/messages`. This forces users to wait for the entire response before seeing any output. The backend already supports a `POST /v1/stream` endpoint that streams tokens via SSE, auto-creates conversations, and handles the full message lifecycle in a single request. Migrating to this endpoint will provide a real-time typing experience as tokens arrive.

## What Changes

- **New streaming hook** (`useStreamMessage`) replaces `useSendMessage` for sending messages — uses `apiClient.stream()` (native fetch + ReadableStream + AbortController) to consume SSE events
- **ConversationContext** gains a `streamingAssistantMessage` field to hold incremental token content and the stream's AbortController
- **ConversationClient** adds a `streamMessage(body, signal?)` method that calls `POST /v1/stream`
- **Route consolidation**: merge `app/(chat)/page.tsx` and `app/(chat)/c/[conversationId]/page.tsx` into a single optional catch-all route `app/(chat)/[[...conversationId]]/page.tsx` so navigation during streaming does not unmount ChatPage
- **UI adapts** `ChatPage` and `assistant-message.tsx` to render incremental streaming tokens with a typing cursor
- `useSendMessage`, `conversationClient.create()`, and the old `POST /v1/conversations/{id}/messages` path are **removed** — the stream endpoint subsumes both
- `GET /v1/conversations/{id}` for loading conversation history is **unchanged**

## Capabilities

### New Capabilities
- `stream-api`: Consume `POST /v1/stream` SSE endpoint, parse OpenAI-compatible delta chunks, accumulate tokens, and render them incrementally in the UI
- `auto-conversation-creation`: Allow the backend to create conversations on first message by omitting `conversation_id` from the stream payload; navigate to the new URL on the `meta` SSE event

### Modified Capabilities
- *(None — no existing spec files are affected)*

## Impact

- **`src/features/conversations/api/conversation-client.ts`** — add `streamMessage()`, remove `create()` and `sendMessage()` if no longer referenced elsewhere
- **`src/features/conversations/hooks/useSendMessage.ts`** — replace with `useStreamMessage.ts` based on SSE reader loop
- **`src/store/conversation/ConversationContext.tsx`** — add streaming state fields and actions
- **`src/components/chat/chat-page.tsx`** — wire up stream hook, render `streamingAssistantMessage`
- **`src/components/chat/assistant-message.tsx`** — support partial/streaming content mode
- **`src/app/(chat)/page.tsx`** and **`src/app/(chat)/c/[conversationId]/page.tsx`** — consolidate into single catch-all route
- **`src/features/conversations/types.ts`** — add streaming event types (delta chunk, meta, done, error)
- **No new dependencies** — native `fetch` / `ReadableStream` / `AbortController` per ADR-0002
