## 1. Data Layer

- [x] 1.1 Add `SearchResult` (with `conversation_id`, `title`, `matched_text`, `created_at`, `updated_at`) and `SearchResponse` interfaces to `src/features/conversations/types.ts`
- [x] 1.2 Add `search(query: string): Promise<SearchResponse>` method to `ConversationApiClient` in `src/features/conversations/api/conversation-client.ts`

## 2. Hooks

- [x] 2.1 Create `src/hooks/useDebounce.ts` — generic `useDebounce<T>(value, delay)` hook using `useState` + `useEffect` with `setTimeout`/`clearTimeout`
- [x] 2.2 Create `src/features/conversations/hooks/useSearchConversations.ts` — TanStack Query hook using `conversationClient.search()`, with `enabled` when query length >= 2

## 3. Search Modal

- [x] 3.1 Create `src/features/conversations/components/SearchModal.tsx` with `@base-ui/react/dialog` shell (backdrop, popup, fixed height `h-[480px]`)
- [x] 3.2 Add auto-focused search input with `Search` icon, "Search chats" placeholder, and `X` clear button (visible only when input has value)
- [x] 3.3 Implement initial blank state: search icon + "Search your conversations" text in results area
- [x] 3.4 Implement skeleton loading state (4 animated pulse rows) during search
- [x] 3.5 Implement results list: each item shows title (semibold) + matched text, with total count above
- [x] 3.6 Implement no-results state: message icon + "No results found" + hint text
- [x] 3.7 Implement error state: red error text inline + sonner toast on API failure
- [x] 3.8 Add hover date display on each result item using "Today"/"Yesterday"/"June 12" format for `updated_at`
- [x] 3.9 Wire result click to navigate to `/c/{conversation_id}` via `router.push` + close modal
- [x] 3.10 Wire debounce (300ms) using `useDebounce` hook before passing query to `useSearchConversations`

## 4. Sidebar Integration

- [x] 4.1 Add search button below "New Chat" button in `ConversationSidebar.tsx` with `Search` icon, matching existing button styling
- [x] 4.2 Wire `SearchModal` open/close state in `ConversationSidebar.tsx`
- [x] 4.3 Verify all states (blank, loading, results, no results, error) render correctly (type check + lint pass with no new errors)
