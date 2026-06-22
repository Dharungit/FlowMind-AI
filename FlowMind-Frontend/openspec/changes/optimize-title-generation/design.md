## Context

After the SSE stream completes for a conversation's first user message, the backend asynchronously generates a title. Currently, `useStreamMessage` eagerly invalidates the `["conversations"]` query on the `"done"` event, but the title field is still a placeholder. The conversation list refetches immediately with the stale title.

The backend exposes:
- `POST /v1/conversations/:id/generate-title` — triggers/awaits title generation, returns `ConversationResponse` with the final title and `title_generated: true`
- `GET /v1/conversations` — list endpoint now includes `title_generated: boolean` per conversation
- `title_generated` is **only** available on the list endpoint, not on the single-conversation endpoint

## Goals / Non-Goals

**Goals:**
- Replace eager list invalidation on stream completion with a targeted `generate-title` API call
- Implement 3-attempt retry with exponential backoff (2s, 4s, 8s) for resilience
- On success: invalidate the list + single conversation so the sidebar and chat page show the title
- On final failure: show a Sonner error toast + fallback invalidation
- Prevent chat page empty-state glitch: seed conversation cache with accumulated streaming messages before dispatching `STREAM_DONE`
- Only trigger title generation for new conversations, not subsequent messages
- Add native `title` attribute to truncated conversation titles for full-text visibility on hover
- Keep changes minimal and localized to the existing hooks/API layer

**Non-Goals:**
- No polling or `refetchInterval` added to `useConversationList`
- No changes to the conversation sidebar UI components
- No changes to the SSE streaming protocol or backend

## Architecture

```
        SSE "done" event (new conversation)
                    │
                    ▼
   ┌────────────────────────────────────┐
   │  Seed cache with accumulated       │
   │  messages via setQueryData         │
   │  (prevents empty-state flash)      │
   └────────────────────────────────────┘
                    │
                    ▼
          dispatch(STREAM_DONE)
                    │
                    ▼
     ┌──────────────────────────┐
     │  generateTitle.mutate()  │── only if isNewConversationRef
     │  (3 retries: 2s/4s/8s)  │
     └──────────────────────────┘
           │              │
       success          fail (all retries exhausted)
           │              │
           ├─ invalidate  ├─ toast.error
           │  LIST +      └─ invalidate LIST
           │  SINGLE
           │  (replaces
           │   seeded data
           │   with real
           │   server data)
           │
           ▼
     Sidebar + chat page
     show real title + messages
```

**Layer diagram:**

```
┌──────────────────────────────────────────────────────────┐
│                    ConversationItem                        │
│  (reads title from list cache; title attr for full text)  │
├──────────────────────────────────────────────────────────┤
│                    ConversationList                        │
│  (useConversationList() — no query changes needed)        │
├──────────────────────────────────────────────────────────┤
│                   useStreamMessage                         │
│  (tracks accumulatedContent + userMessage via refs;       │
│   seeds cache on "done" before STREAM_DONE;               │
│   calls generateTitle.mutate only for new conversations)  │
├──────────────────────────────────────────────────────────┤
│                   useGenerateTitle  ★ NEW                  │
│  (mutation with retry:3, invalidate LIST + SINGLE)        │
├──────────────────────────────────────────────────────────┤
│               conversationClient.generateTitle()  ★ NEW   │
│  (POST /v1/conversations/:id/generate-title)              │
├──────────────────────────────────────────────────────────┤
│                    Types                                   │
│  (ConversationResponse.title_generated added)             │
└──────────────────────────────────────────────────────────┘
```

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Title gen trigger | Only for new conversations (`!activeConversationId`) | Prevents unnecessary API calls on subsequent messages in the same conversation. Tracked via `isNewConversationRef`. |
| Retries on mutation | `retry: 3` with `retryDelay: exponential` | Network blips or race conditions during async title generation may cause transient failures. 3 retries (2s/4s/8s) gives ~14s total before user-facing error. React Query v5 mutations support `retry` natively. |
| Cache update strategy (title) | `invalidateQueries` on LIST + SINGLE | Invalidate both keys so the seeded placeholder data is replaced by real server data immediately. No `setQueryData` in the mutation — it caused empty-state flashes by replacing the full `ConversationDetailResponse` (with messages) with a `ConversationResponse` (no messages). |
| Empty-state prevention | Seed cache with accumulated messages before `STREAM_DONE` | `setQueryData` is called **before** dispatching `STREAM_DONE` in `useStreamMessage`. This ensures `conversation?.messages` is populated by the time `streamingMessage` is cleared, so `hasMessages` never drops to false. |
| Message accumulation during streaming | `accumulatedContentRef` + `userMessageRef` | Refs are used instead of state to avoid re-renders on every chunk. Content is appended per SSE chunk event. |
| Title overflow | Native `title` attribute on truncated span | Zero overhead, no new dependencies. Standard pattern for truncated text — browser shows full text on hover. |
| Toast on failure | `toast.error("Failed to generate conversation title")` | Consistent with existing pattern in `useDeleteMemoryMutation`. Sonner `<Toaster richColors />` is already in the root layout. |
| Error fallback | Fallback `invalidateQueries` on error | Even if title generation fails, the list refetches so the user sees whatever title exists (placeholder or partial). |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|---|
| `generate-title` endpoint is slow (>8s per attempt) | 3 retries could take up to ~14s. If latency is high, consider reducing retries or increasing backoff cap. |
| Mutation retries continue after user navigates away | React Query cancels mutation retries on component unmount. The `generateTitle.mutate` call is inside `startStream` which is tied to the chat page lifecycle. |
| Seeded cache data becomes stale | `generateTitle` `onSuccess` invalidates `["conversations", id]` so the real server data replaces the seed. If `generateTitle` fails, the fallback invalidation also triggers a refetch. |
| Aborted stream leaves stale accumulated content | Refs are reset to `""` at the top of every `startStream` call, so a new stream always starts fresh. |

## Migration Plan

1. Add `title_generated` to the `ConversationResponse` type
2. Add `generateTitle` method to `conversation-client.ts`
3. Create `useGenerateTitle` mutation hook in `useConversations.ts` (retry: 3, invalidate LIST+SINGLE, toast on error)
4. Wire it into `useStreamMessage`: add refs for content tracking, seed cache on `"done"`, only call `generateTitle` for new conversations
5. Add `title` attribute to truncated conversation title in `ConversationItem.tsx`
6. Update mock data with `title_generated` field
7. TypeScript compilation check
8. Manual test: send first message → verify no empty-state glitch → verify sidebar updates with generated title

## Open Questions

None.
