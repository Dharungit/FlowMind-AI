## 1. Clean ConversationProvider

- [x] 1.1 Remove `useEffect` that reads `window.location.search` for `?conversation=` from `src/store/conversation/ConversationContext.tsx` — the provider becomes a pure state holder with no URL awareness
- [x] 1.2 Remove unused `useEffect` import from ConversationContext

## 2. Create Conversation Route Page

- [x] 2.1 Create `src/app/(chat)/c/[conversationId]/page.tsx` — a thin client component that reads `useParams().conversationId`, dispatches `SET_ACTIVE` on mount via `useEffect`, and renders the existing ChatPage component (imported from `(chat)/page.tsx` or refactored to a shared location)
- [x] 2.2 Add `useEffect` with `CLEAR_ACTIVE` dispatch on mount to existing `src/app/(chat)/page.tsx`

## 3. Update Sidebar Navigation

- [x] 3.1 Change `router.push("/?conversation=${id}")` to `router.push("/c/${id}")` in `src/components/layout/Sidebar.tsx` `handleSelectConversation`

## 4. Verification

- [x] 4.1 Run TypeScript check: `npx tsc --noEmit`
- [x] 4.2 Run linter: `npm run lint` and fix any new issues
- [x] 4.3 Run `openspec validate conversation-route-paths --type change --strict` and fix any issues
- [x] 4.4 Manual smoke test: select a conversation → URL shows `/c/<id>`; click New Chat → URL shows `/`; refresh on `/c/<id>` → conversation persists; browser back/forward → conversation history works
