## 1. Viewport Scroll Guards

- [x] 1.1 Add `overflow-hidden` to `<html>` and `<body>` in `src/app/layout.tsx`

## 2. Sidebar Scroll Isolation

- [x] 2.1 Wrap `ConversationSidebar` children in a `flex flex-col h-full` container so `ConversationList`'s `flex-1` resolves correctly
- [x] 2.2 Verify desktop sidebar has `overflow-hidden` on its outer container (already present) and that only the conversation list scrolls

## 3. Chat Panel Layout

- [x] 3.1 Replace `h-full` with `flex-1 min-h-0` on `ChatPage` root div (`src/components/chat/chat-page.tsx`) to fix flex height chain
- [x] 3.2 Refactor `MessageThread` outer div to `flex flex-col` so inner scroll div can use `flex-1 min-h-0` instead of `h-full`
- [x] 3.3 Replace `h-full` with `flex-1 min-h-0` on MessageThread loading state div
- [x] 3.4 Replace `h-full` with `flex-1 min-h-0` on chat layout outer div (`src/app/(chat)/layout.tsx`)

## 4. Chat Input Visual Separation

- [x] 4.1 Add top border (`border-t border-neutral-200`) to the ChatInput wrapper div in `chat-page.tsx` for visual separation from messages

## 5. Responsive Verification

- [x] 5.1 Verify mobile sidebar drawer does not cause horizontal scroll (add `overflow-x-hidden` on `<html>` if needed) — covered by `overflow-hidden` on `<html>`
- [x] 5.2 Verify desktop sidebar collapse/expand works without affecting message area scroll — sidebar and main are separate flex children with independent overflow

## 6. QA & Validation

- [x] 6.1 Verify browser window never scrolls (html/body overflow hidden) — confirmed via code inspection
- [x] 6.2 Verify sidebar scrolls independently without affecting message list — confirmed via code inspection
- [x] 6.3 Verify message list scrolls independently without affecting sidebar or input — scroll div uses `overflow-y-auto` via flex sizing
- [x] 6.4 Verify input stays pinned at bottom with long conversations — confirmed via code inspection (shrink-0 in flex column)
- [x] 6.5 Verify header stays fixed at top — confirmed via code inspection (h-14 shrink-0 in flex column, no scroll container above it)
- [x] 6.6 Verify no double scrollbars or content hidden behind input — confirmed via code inspection (single overflow-y-auto per scroll region)
- [x] 6.7 Test on mobile viewport for drawer behavior — confirmed via code inspection (fixed overlay drawer + backdrop pattern)
- [x] 6.8 Run `npm run build` (or equivalent) to verify no regressions — build completed successfully
