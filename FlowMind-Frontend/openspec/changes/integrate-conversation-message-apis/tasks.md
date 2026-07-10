## 1. API Client Layer

- [x] 1.1 Create `src/features/conversations/api/conversation-client.ts` with `ConversationApiClient` class wrapping `AuthApiClient`
- [x] 1.2 Implement methods: `list()`, `get(id)`, `create(title?)`, `update(id, title)`, `delete(id)`, `deleteMessage(messageId)`, `sendMessage(conversationId, messages)`
- [x] 1.3 Create `src/features/conversations/api/index.ts` exporting the client instance

## 2. Send Message Hook

- [x] 2.1 Create `src/features/conversations/hooks/useSendMessage.ts` with `useSendMessage()` React Query mutation
- [x] 2.2 Implement orchestration logic: if no active conversation → call `create` then `sendMessage`; if active → call `sendMessage` directly
- [x] 2.3 Wire optimistic update: show user message immediately in React Query cache
- [x] 2.4 Wire `onSuccess`: invalidate `useConversation(id)` query to refresh messages, invalidate `useConversationList()` to update sidebar

## 3. Update Existing Hooks

- [x] 3.1 Update `useConversations.ts` — replace all `conversations.mock` imports with `conversation-client` imports
- [x] 3.2 Ensure `useConversationList()` fetches from API and maintains loading/empty/error states via React Query
- [x] 3.3 Ensure `useConversation(id)` fetches single conversation with messages from API
- [x] 3.4 Ensure `useCreateConversation()`, `useUpdateConversation()`, `useDeleteConversation()` call real API methods
- [x] 3.5 Update `chat-page.tsx` — load messages from `useConversation(id)` instead of ChatContext

## 4. ChatContext Simplification

- [x] 4.1 Remove streaming-related action types from ChatContext reducer (`START_STREAMING`, `APPEND_TOKEN`, `STOP_STREAMING`, `FINISH_STREAMING`)
- [x] 4.2 Remove `isStreaming` flag and `messages` array from ChatContext state
- [x] 4.3 Remove `startStreaming`, `appendToken`, `stopStreaming`, `finishStreaming` action creators
- [x] 4.4 Keep only `error` state and `SET_ERROR`/`CLEAR_ERROR` in ChatContext (or remove entirely if no longer needed)
- [x] 4.5 Update `use-chat.ts` — remove streaming orchestration; delegate message sending to `useSendMessage`

## 5. UI Component Updates

- [x] 5.1 Update `chat-input.tsx` — remove stop button (send/stop toggle), remove streaming-disabled logic, reduce to always-enabled send button
- [x] 5.2 Update `message-thread.tsx` — read messages from React Query (`useConversation(id)`) instead of ChatContext
- [x] 5.3 Update `assistant-message.tsx` — remove token-by-token streaming rendering, render full content at once
- [x] 5.4 Add loading skeleton to `message-thread.tsx` for when conversation messages are being fetched

## 6. Cleanup

- [x] 6.1 Delete `src/features/chat/api/chat-client.ts`
- [x] 6.2 Remove any imports of deleted files across the codebase
- [x] 6.3 Verify all React Query keys are consistent (invalidation chain works end-to-end)
- [x] 6.4 Run `openspec validate integrate-conversation-message-apis --type change --strict`
