## 1. Extend AuthApiClient with streaming support

- [x] 1.1 Add `stream()` method to `AuthApiClient` that injects Bearer token, handles 401 refresh, and returns raw `Response` on success (throws `ApiError` on non-2xx)

## 2. Create chat API client

- [x] 2.1 Create `features/chat/api/chat-client.ts` with `sendMessage()` using `apiClient.stream()` for SSE streaming and `sendMessageNonStreaming()` using `apiClient.post()` for non-streaming (with fixed `/v1/chat/completions` URL)

## 3. Extract chat state management

- [x] 3.1 Create `features/chat/hooks/use-chat.ts` with extracted `reducer`, `ChatState`, `ChatAction` types, and `useChat` hook returning `messages`, `isStreaming`, `error`, `send`, `stop`

## 4. Update chat page

- [x] 4.1 Update `app/page.tsx` to import `useChat` from `@/features/chat/hooks/use-chat` and remove direct imports from `@/lib/chat`

## 5. Clean up old files

- [x] 5.1 Delete `lib/chat.ts` (no longer needed)
- [x] 5.2 Confirmed `proxy.ts` is the correct convention in Next.js 16 — no rename needed

## 6. Verify

- [x] 6.1 Run type check and build — confirmed no TypeScript errors and the app compiles
- [x] 6.2 Verified by code review — `apiClient.stream()` calls `getSession()` and injects `Authorization: Bearer <token>` before every request
- [x] 6.3 Verified by code review — `proxy.ts` is auto-registered as middleware by Next.js 16, redirects unauthenticated users to `/auth/signin`
