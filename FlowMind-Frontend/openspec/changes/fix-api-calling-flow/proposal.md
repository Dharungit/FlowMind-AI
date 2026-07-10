## Why

Chat/completion API calls bypass the existing auth client (`AuthApiClient`), sending requests without an `Authorization` header. This means the backend has no way to authenticate or authorize chat requests, and token expiry (401) is never handled. The API layer is also scattered across `lib/` and `features/` with no consistent folder structure, and state management (reducer) is inlined in the page component rather than extracted.

## What Changes

- Add `stream()` method to `AuthApiClient` for SSE streaming support, returning the raw `Response` so the caller handles SSE parsing
- Move chat API functions from `lib/chat.ts` into `features/chat/api/chat-client.ts`, importing the shared `apiClient`
- Extract the inline `useReducer` from `app/page.tsx` into `features/chat/hooks/use-chat.ts`
- Fix `sendMessageNonStreaming` URL bug (uses base URL instead of `/v1/chat/completions`)
- Rename `proxy.ts` to `middleware.ts` so Next.js auto-registers auth route protection
- Remove the orphaned `lib/chat.ts` file after migration

## Capabilities

### New Capabilities
- `chat-stream`: Streaming chat completions via `AuthApiClient` with Bearer token injection and 401 refresh

### Modified Capabilities
- (none — no existing spec files to modify)

## Impact

- **`features/auth/api/auth-client.ts`**: New `stream()` method added to `AuthApiClient`
- **`features/chat/api/chat-client.ts`**: New file — chat API functions using `apiClient`
- **`features/chat/hooks/use-chat.ts`**: New file — extracted `useReducer` with actions: `ADD_USER_MESSAGE`, `START_STREAMING`, `APPEND_TOKEN`, `FINISH_STREAMING`, `STOP_STREAMING`, `SET_ERROR`, `CLEAR_ERROR`
- **`app/page.tsx`**: Updated imports — uses `useChat` hook and `chat-client` instead of `lib/chat`
- **`lib/chat.ts`**: Removed (functionality moved to `features/chat/api/chat-client.ts`)
- **`proxy.ts`**: Renamed to `middleware.ts` for Next.js auto-registration
- No new dependencies required
