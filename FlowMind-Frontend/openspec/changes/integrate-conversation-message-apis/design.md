## Context

The current frontend uses mock data for conversation CRUD operations (`conversations.mock.ts`) and a separate `/v1/chat/completions` streaming endpoint for sending messages (`chat-client.ts`). The streaming endpoint is being retired. We need to replace both with a unified REST API layer: conversation CRUD via `/v1/conversations` endpoints and message sending via `POST /v1/conversations/{id}/messages` (non-streaming).

The existing `AuthApiClient` (`src/features/auth/api/auth-client.ts`) provides a reusable HTTP client with automatic Bearer token injection and 401 auto-refresh. The existing `@tanstack/react-query` setup in `providers.tsx` handles server state management.

**In-force ADRs that constrain this design:**
- ADR 0001 — shadcn/ui + Tailwind CSS for UI components (unaffected)
- ADR 0002 — native fetch + ReadableStream + AbortController for streaming (**supersession needed** — see Open Questions)

## Goals / Non-Goals

**Goals:**
- Replace mock conversation service with real API calls via `AuthApiClient`
- Replace `/v1/chat/completions` with `POST /v1/conversations/{id}/messages` (non-streaming)
- Orchestrate create-conversation-then-send-message atomically for new chats
- Use React Query as source of truth for messages (remove message array from ChatContext)
- Remove streaming-related state (isStreaming, streaming actions) from ChatContext
- Remove `chat-client.ts` entirely

**Non-Goals:**
- No visual redesign of chat components (existing styling preserved)
- No streaming support for now (will be added in a future change)
- No changes to authentication flow
- No changes to the sidebar UI beyond what's needed for data integration

## Architecture

```
  +------------------------------------------------------------------+
  |                        Frontend Container                         |
  |                                                                   |
  |  +--------------------+  +--------------------+                   |
  |  |   Chat Page        |  |   Sidebar           |                  |
  |  |   (/c/[id])        |  |   (conversation     |                  |
  |  |                    |  |    list)             |                  |
  |  +--------+-----------+  +--------+-----------+                   |
  |           |                        |                              |
  |  +--------v------------------------v-----------+                   |
  |  |         useConversations hook               |                  |
  |  |  (useConversationList, useConversation,     |                  |
  |  |   useCreateConversation, useUpdateConv,     |                  |
  |  |   useDeleteConversation, useSendMessage)    |                  |
  |  +--------------------+------------------------+                   |
  |                       |                                            |
  |  +--------------------v------------------------+                   |
  |  |       ConversationApiClient                  |                  |
  |  |   (GET/POST/PUT/DELETE /v1/conversations)    |                 |
  |  |   (GET /v1/conversations/{id})               |                 |
  |  |   (POST /v1/conversations/{id}/messages)     |                 |
  |  |   (DELETE /v1/messages/{message_id})          |                 |
  |  +--------------------+------------------------+                   |
  |                       |                                            |
  |  +--------------------v------------------------+                   |
  |  |         AuthApiClient (shared)               |                  |
  |  |   (auto Bearer token + 401 auto-refresh)     |                 |
  |  +--------------------+------------------------+                   |
  |                       |                                            |
  +-----------------------+--------------------------------------------+
                          |
                          | HTTP
                          v
              +---------------------------+
              |   Backend REST API         |
              |  (localhost:8000)          |
              |  /v1/conversations/*       |
              |  /v1/conversations/{id}/   |
              |    messages                |
              |  /v1/messages/{message_id}  |
              +---------------------------+
```

**Flow: Send first message (new chat)**

```
  User             useSendMessage        ConvApiClient       Backend
   |                      |                    |                |
   |  type message        |                    |                |
   |--------------------->|                    |                |
   |                      |  no active conv    |                |
   |                      |  POST /v1/convs    |                |
   |                      |------------------->|--------------->|
   |                      |                    |  201 { id }    |
   |                      |<-------------------|---------------|
   |                      |                    |                |
   |                      |  POST /v1/convs/   |                |
   |                      |    {id}/messages   |                |
   |                      |------------------->|--------------->|
   |                      |                    |  200 { reply } |
   |                      |<-------------------|---------------|
   |                      |                    |                |
   |  optimistically show |                    |                |
   |  user msg + assistant |                    |                |
   |<---------------------|                    |                |
```

**Flow: Send message (existing conversation)**

```
  User             useSendMessage        ConvApiClient       Backend
   |                      |                    |                |
   |  type message        |                    |                |
   |--------------------->|                    |                |
   |                      |  active conv {id}  |                |
   |                      |  POST /v1/convs/   |                |
   |                      |    {id}/messages   |                |
   |                      |------------------->|--------------->|
   |                      |                    |  200 { reply } |
   |                      |<-------------------|---------------|
   |                      |                    |                |
   |  optimistically show |                    |                |
   |  user msg + assistant |                    |                |
   |<---------------------|                    |                |
```

## UI/UX Design System

### Design Direction
This is a data-layer change — no visual identity changes. The existing shadcn/ui design system (ADR 0001) remains in full effect.

### User-Facing Changes
- **Stop button removed** from chat input area — non-streaming means no mid-response cancellation
- **"Thinking" indicator removed** — assistant response arrives as a single message, not tokens
- **Input always enabled** — no streaming to block input against
- **Messages load via React Query** — loading skeletons (already used in ConversationList) shown while fetching conversation history

### UX Guidelines (from ui-ux-pro-max)
- Empty states continue to use the existing pattern (icon + instructive text)
- Loading states use existing skeleton components from shadcn/ui
- Error states remain consistent with the existing retry pattern

## Decisions

1. **ConversationApiClient wraps AuthApiClient directly** (not a separate fetch-based client)
   - Why: AuthApiClient already handles auth headers, token refresh, and error formatting. Wrapping it avoids duplicating auth logic.
   - Alternative considered: Creating a standalone fetch client with its own auth handling — rejected as redundant.

2. **useSendMessage is a single mutation hook** (not two separate create + send mutations)
   - Why: The create-then-send sequence for new conversations must be atomic. A single mutation handles the orchestration internally, presenting a unified API to the UI.
   - Alternative considered: Two sequential mutations with `useMutation` + `onSuccess` chaining — rejected because it complicates error handling and optimistic updates.

3. **React Query is source of truth for messages** (ChatContext simplified)
   - Why: Messages are server-persisted data. React Query provides caching, invalidation, loading/error states, and automatic refetch. ChatContext should only hold transient UI state.
   - What remains in ChatContext: Nothing message-related. ChatContext can be removed entirely or kept as a minimal shell for future transient state.

4. **ConversationApiClient returns typed response objects** matching the existing `ConversationResponse`, `ConversationDetailResponse`, `MessageResponse` types
   - Why: Types already exist and correspond to the backend contract. Reusing them avoids type drift.

5. **Non-streaming for now, streaming later**
   - Why: The backend endpoint returns a complete response. Streaming support will be added as a future change with a new ADR superseding ADR 0002.

## Risks / Trade-offs

- **[Risk] Atomic create+send fails after conversation created but before message sent** -> User sees a blank conversation in the sidebar with no messages. Mitigation: Show the conversation in the sidebar with a "retry send" state, and the new chat input remains available.
- **[Risk] ChatContext removal breaks existing components** -> Migration must be careful: `useChatState()` consumers need to read messages from React Query instead. Mitigation: Search all `useChatState()` usages and update them.
- **[Risk] Optimistic updates cause UI flicker if API is fast** -> Keep optimistic updates simple: show user message immediately, replace with server response on success. No placeholder for assistant message until the real response arrives.

## Migration Plan

1. Create `src/features/conversations/api/conversation-client.ts` with `ConversationApiClient`
2. Create `src/features/conversations/api/types.ts` (or re-export existing `types.ts`)
3. Create `src/features/conversations/hooks/useSendMessage.ts` with `useSendMessage()` mutation
4. Update `useConversations.ts` — swap mock imports for real API client
5. Update `ChatContext` — remove streaming actions, remove messages array
6. Update `use-chat.ts` — simplify or remove (orchestration moves to `useSendMessage`)
7. Update `chat-page.tsx` — read messages from React Query
8. Update `chat-input.tsx` — remove stop button, remove streaming-disabled logic
9. Update `message-thread.tsx` — use React Query data
10. Delete `src/features/chat/api/chat-client.ts`
11. Update specs: `conversation-management`, `backend-integration`, `chat-state-store`, `chat-interface`

**Rollback:** Keep the mock service file (`conversations.mock.ts`) but do not import it. To roll back, revert imports in the hook and restore deleted files from git.

## Open Questions

1. **ADR 0002 supersession**: ADR 0002 (native fetch for streaming) is rendered obsolete by the removal of streaming. The `adr` step should create a new ADR that supersedes ADR 0002 and documents the switch to non-streaming conversation messages endpoint.
2. **ChatContext survival**: Should ChatContext be completely deleted or kept as a zero-state shell for future transient UI needs? The current decision is to simplify it — final decision during implementation.
3. **Message optimistic update UX**: Should we show an optimistic assistant placeholder (e.g., "..." with a loading animation) while the message is being sent, or wait for the real response? Current preference: wait for the real response to avoid complexity.
