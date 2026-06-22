## Why

After the first assistant response completes via SSE streaming, the backend asynchronously generates a conversation title. The current approach eagerly invalidates the conversation list query on stream completion, but the title isn't ready yet. This means the sidebar shows an untitled/generic title until the next manual navigation or refetch. We need an optimized mechanism to detect when the title has been generated and update the UI accordingly, with retry logic and user notification on failure.

## What Changes

- Add `title_generated: boolean` field to `ConversationResponse` type
- Add `generateTitle(id)` API method calling `POST /v1/conversations/:id/generate-title`
- Create `useGenerateTitle` mutation hook with 3 retry attempts (exponential backoff: 2s, 4s, 8s)
- Wire `useGenerateTitle` into `useStreamMessage` on SSE `"done"` event, replacing eager list invalidation
- On mutation success: update single-conversation query cache + invalidate conversation list
- On mutation failure after 3 retries: show Sonner error toast + fallback list invalidation

## Capabilities

### New Capabilities
- `title-generation`: Background conversation title generation triggered after first assistant response. The frontend calls the generate-title endpoint, retries up to 3 times with exponential backoff, updates the cache on success, and shows an error toast on final failure.

### Modified Capabilities
- None

## Impact

- `src/features/conversations/types.ts` — new `title_generated` field on `ConversationResponse`
- `src/features/conversations/api/conversation-client.ts` — new `generateTitle` method
- `src/features/conversations/hooks/useConversations.ts` — new `useGenerateTitle` mutation hook
- `src/features/conversations/hooks/useStreamMessage.ts` — wiring change in `"done"` handler
- No new dependencies — `sonner` is already present
