## Why

The conversation sidebar and chat UI currently operate on mock data (300-800ms simulated delay) with no backend persistence. The old `/v1/chat/completions` streaming endpoint is being retired. We need to replace both with real API integration: conversations persisted via REST CRUD endpoints and messages sent via a non-streaming conversation messages endpoint.

## What Changes

- **Remove** `src/features/chat/api/chat-client.ts` and its streaming / non-streaming helpers (BREAKING)
- **Remove** streaming-related state from ChatContext (`START_STREAMING`, `APPEND_TOKEN`, `STOP_STREAMING` actions) (BREAKING)
- **Create** `src/features/conversations/api/conversation-client.ts` — a real API client using the shared `AuthApiClient`
- **Create** `src/features/conversations/hooks/useSendMessage.ts` — a React Query mutation that orchestrates create-then-send for new conversations
- **Update** `src/features/conversations/hooks/useConversations.ts` — swap mock service for real API client
- **Update** ChatContext — simplify to hold only transient UI state (no message array; React Query is source of truth)
- **Update** `message-thread.tsx`, `chat-input.tsx`, `chat-page.tsx` — read messages from React Query, remove streaming UI (stop button, loading placeholder tokens, disabled input while streaming)
- **Update** `chat-interface` spec — remove streaming scenarios
- **Update** `chat-state-store` spec — remove streaming actions
- **Update** `backend-integration` spec — replace `/v1/chat/completions` with conversation messages endpoint
- **Update** `conversation-management` spec — replace mock with real API

## Capabilities

### New Capabilities
- `conversation-api-client`: Real HTTP client wrapping `AuthApiClient` for `GET/POST/PUT/DELETE /v1/conversations` and `POST /v1/conversations/{id}/messages`
- `message-sending`: Send a message to a conversation (non-streaming), with automatic conversation creation on first message

### Modified Capabilities
- `conversation-management`: Replace mock service with real REST API calls; conversation created on first message via `useSendMessage`; hooks use React Query for caching and invalidation
- `backend-integration`: Remove `/v1/chat/completions` endpoint; replace with `POST /v1/conversations/{id}/messages` (non-streaming); remove streaming SSE parsing
- `chat-state-store`: Remove `isStreaming`, streaming actions (`START_STREAMING`, `APPEND_TOKEN`, `STOP_STREAMING`, `FINISH_STREAMING`); ChatContext no longer owns message array (React Query does)
- `chat-interface`: Remove streaming scenarios (input disabled while streaming, streaming response display, stop generation, loading/thinking indicator before first token); update for non-streaming flow where assistant response arrives as a single message

## Impact

- **Files deleted:** `src/features/chat/api/chat-client.ts`
- **Files created:** `src/features/conversations/api/conversation-client.ts`, `src/features/conversations/api/types.ts`
- **Files modified:** `src/features/conversations/hooks/useConversations.ts`, `src/store/chat/` (reducer + context), `src/components/chat/chat-input.tsx`, `src/components/chat/message-thread.tsx`, `src/components/chat/chat-page.tsx`, `src/features/chat/hooks/use-chat.ts`
- **API surface removed:** All references to `/v1/chat/completions`
- **API surface added:** `GET /v1/conversations`, `POST /v1/conversations`, `GET /v1/conversations/{id}`, `PUT /v1/conversations/{id}`, `DELETE /v1/conversations/{id}`, `POST /v1/conversations/{id}/messages`, `DELETE /v1/messages/{message_id}`
- **No new dependencies** — uses existing `AuthApiClient`, `@tanstack/react-query`
