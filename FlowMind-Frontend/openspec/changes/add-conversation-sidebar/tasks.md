## 1. Types & Mock Service Layer

- [ ] 1.1 Create `src/features/conversations/types.ts` with TypeScript interfaces matching backend Pydantic models (`ConversationResponse`, `ConversationDetailResponse`, `MessageResponse`, `ConversationCreate`, `ConversationUpdate`, `MessageItem`, `MessageAddRequest`), plus `ConversationStatus` enum (idle, loading, error, empty)
- [ ] 1.2 Create `src/features/conversations/conversations.mock.ts` with a mock service exposing async functions: `getConversations()`, `getConversation(id)`, `createConversation(data)`, `updateConversation(id, data)`, `deleteConversation(id)` — each with 300-800ms simulated delay and an in-memory dummy data array seeded with 5-8 sample conversations

## 2. State Management & Hooks

- [ ] 2.1 Create `src/store/conversation/ConversationContext.tsx` with `ConversationProvider` using `useReducer` for UI state: `activeConversationId`, `dispatch` actions (`SET_ACTIVE`, `CLEAR_ACTIVE`)
- [ ] 2.2 Create `src/features/conversations/hooks/useConversations.ts` with React Query hooks: `useConversationList()` (useQuery), `useConversation(id)` (useQuery), `useCreateConversation()` (useMutation), `useUpdateConversation()` (useMutation), `useDeleteConversation()` (useMutation) — all calling the mock service
- [ ] 2.3 Wire `ConversationProvider` into the app provider stack in `src/app/layout.tsx`, nested inside `AuthProvider` and wrapping `UIProvider`

## 3. Sidebar Components

- [ ] 3.1 Create `src/features/conversations/components/NewChatButton.tsx` — pill-shaped button with plus icon and "New Chat" text, `bg-[#F5F5F5]` default / `bg-[#E5E5E5]` hover, full-width within sidebar padding
- [ ] 3.2 Create `src/features/conversations/components/RenameInput.tsx` — inline text input replacing conversation title on edit click; auto-focus, Enter to save, Escape to cancel, rejects empty/unchanged titles
- [ ] 3.3 Create `src/features/conversations/components/DeleteDialog.tsx` — confirmation dialog using `@base-ui/react` Dialog primitive: "Delete conversation?" heading, "This action cannot be undone." body, Cancel (secondary) and Delete (destructive) buttons
- [ ] 3.4 Create `src/features/conversations/components/ConversationItem.tsx` — single row (40px height, `rounded-lg`) showing title (14px, `font-medium` when active) + relative timestamp (12px, `text-[#737373]`); hover-revealed edit/delete icons; `bg-[#EBEBEB]` active state, `bg-[#F5F5F5]` hover state
- [ ] 3.5 Create `src/features/conversations/components/ConversationList.tsx` — scrollable list rendering `ConversationItem` components from `useConversationList()`; loading state shows 4 skeleton rows (`bg-[#F5F5F5]` with `animate-pulse`); empty state shows `MessageSquare` icon + "No conversations" text; sorts by `updated_at` descending
- [ ] 3.6 Create `src/features/conversations/components/ConversationSidebar.tsx` — feature container composing `NewChatButton` in top section, `ConversationList` below, responsive logic (desktop: persistent `w-[280px]`, mobile: `fixed` overlay with `bg-black/50` backdrop)
- [ ] 3.7 Create `src/components/layout/Sidebar.tsx` — thin layout shell rendering `ConversationSidebar`, reading `sidebarOpen` from existing `useUI()` hook, applying `motion` slide transition (300ms ease, respecting `prefers-reduced-motion`)

## 4. Header Integration

- [ ] 4.1 Add hamburger toggle button to `src/components/layout/Header.tsx` — `Menu` icon (20px, `lucide-react`) positioned to the left of "FlowMind" text, calls `dispatch({ type: "TOGGLE_SIDEBAR" })` from `useUI()`

## 5. Chat Page Integration

- [ ] 5.1 Wire `ConversationSidebar` into root layout (`src/app/layout.tsx`) alongside the chat page, using `useUI().state.sidebarOpen` for desktop persistent/mobile overlay behavior
- [ ] 5.2 Implement `?conversation=` URL search param synchronization in `ConversationProvider`: read param on mount to set active ID, update param on `SET_ACTIVE`/`CLEAR_ACTIVE` dispatch using `useSearchParams` + `useRouter`
- [ ] 5.3 Wire "New Chat" button to clear active conversation: navigate to `/`, clear message thread in `ChatContext`, dispatch `CLEAR_ACTIVE`
- [ ] 5.4 Implement conversation creation on first message send: when user sends a message with no active conversation, call `useCreateConversation()` with title "New Conversation", set the new ID as active, update URL param
- [ ] 5.5 Handle delete of active conversation: when deleted conversation is current active, clear chat area and redirect to `/`

## 6. Animation & Accessibility

- [ ] 6.1 Apply sidebar slide animation: 300ms `ease` transition for width on desktop (280px ↔ 0), `translate-x` transition for mobile overlay, using `motion` library
- [ ] 6.2 Add `prefers-reduced-motion` support: override all sidebar animations to instant (duration 0) when the media query matches
- [ ] 6.3 Add keyboard support: Escape closes mobile sidebar and dismisses rename input; focus trap in delete dialog; arrow key navigation through conversation items

## 7. Verification

- [ ] 7.1 Manual verification: confirm desktop sidebar persists/collapses, mobile overlay slides with backdrop, New Chat clears thread, conversations create/rename/delete work, URL param syncs, browser back/forward navigation works, refresh preserves active conversation
- [ ] 7.2 Run `openspec validate add-conversation-sidebar --type change --strict` and fix any issues
