## 1. Types and SSE Parser

- [x] 1.1 Add SSE event types to `src/features/conversations/types.ts`: `StreamMetaEvent`, `StreamChunkEvent`, `StreamDoneEvent`, `StreamErrorEvent`, `SSEEvent` union type
- [x] 1.2 Create `parseSSEResponse(response: Response): AsyncGenerator<SSEEvent>` in `conversation-client.ts` that reads ReadableStream line-by-line and parses `data: ` lines as JSON
- [x] 1.3 Handle edge cases in parser: empty lines, multiple data lines per event, invalid JSON, connection close without done event

## 2. API Client Changes

- [x] 2.1 Add `streamMessage(body: StreamRequest, signal?: AbortSignal): Promise<Response>` method to `ConversationApiClient` using `apiClient.stream()`
- [x] 2.2 Add `StreamRequest` type to `types.ts`: `{ conversation_id?: string; messages: MessageItem[] }`

## 3. ConversationContext Streaming State

- [x] 3.1 Add to `ConversationState`: `streamingMessage: { id?: string; content: string; conversationId?: string } | null`, `streamAbortController: AbortController | null`, `isStreaming: boolean`
- [x] 3.2 Add actions: `STREAM_START`, `STREAM_CHUNK`, `STREAM_META`, `STREAM_DONE`, `STREAM_ERROR`, `STREAM_ABORT`
- [x] 3.3 Implement reducer cases for all new actions — CLEAR_ACTIVE must also reset streaming state

## 4. Create useStreamMessage Hook

- [x] 4.1 Create `useStreamMessage.ts` hook that: creates AbortController, calls `conversationClient.streamMessage()`, iterates SSE events via parser
- [x] 4.2 On `meta` event: dispatch `STREAM_META` with conversationId, call `router.replace()`
- [x] 4.3 On each `chunk` event: dispatch `STREAM_CHUNK` with delta content
- [x] 4.4 On `done` event: dispatch `STREAM_DONE` with final message, invalidate conversation queries
- [x] 4.5 On `error` event or fetch error: dispatch `STREAM_ERROR`, invalidate queries
- [x] 4.6 Export `stopStream()` function that calls `abort()` on the stored AbortController

## 5. Route Consolidation

- [x] 5.1 Create `app/(chat)/[[...conversationId]]/page.tsx` that reads optional `conversationId` from params — dispatches `SET_ACTIVE` if present, `CLEAR_ACTIVE` if absent — renders `<ChatPage />`
- [x] 5.2 Delete `app/(chat)/page.tsx` and `app/(chat)/c/[conversationId]/page.tsx`
- [x] 5.3 Verify all URL patterns work: `/` loads with no active conv, `/c/{id}` loads with active conv, refresh and direct navigation still work

## 6. UI Integration

- [x] 6.1 Update `ChatPage`: replace `useSendMessage` import and call with `useStreamMessage` — call `startStream(content, activeConversationId?)` on send
- [x] 6.2 Render `assistant-message` in streaming mode when `convState.streamingMessage` is non-null: pass `content={streamingMessage.content}` and `isStreaming={true}`
- [x] 6.3 Update `assistant-message.tsx` to accept `isStreaming` prop — append a blinking cursor element after content when true
- [x] 6.4 Add "Stop" button that calls `stopStream()` while stream is active (replaces or supplements typing indicator)
- [x] 6.5 Ensure error banner displays from stream errors (reuse existing error display in ChatPage)

## 7. Remove Dead Code

- [x] 7.1 Delete `src/features/conversations/hooks/useSendMessage.ts`
- [x] 7.2 Remove `create()` and `sendMessage()` methods from `ConversationApiClient` (no other callers)
- [x] 7.3 Remove `ConversationCreate`, `MessageAddRequest` types from `types.ts` if no longer used

## 8. Verification

- [x] 8.1 Run `openspec validate migrate-to-stream-api --type change --strict` to verify artifact completeness
- [x] 8.2 Run `npm run build` (or equivalent) to confirm no TypeScript errors
- [ ] 8.3 Manual test: new chat stream renders tokens incrementally, URL updates on meta, sidebar refreshes on done
- [ ] 8.4 Manual test: existing conversation chat continues to work, history loads via GET /v1/conversations/{id}
- [ ] 8.5 Manual test: stop mid-stream, verify partial content remains, no orphaned requests
- [ ] 8.6 Manual test: network disconnection mid-stream shows error, partial content preserved
