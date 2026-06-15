## Why

The current chat layout does not match ChatGPT's stable scrolling behavior. Parent containers lack `overflow-hidden`, causing page-level scrolling when message content grows. The sidebar, message list, and input area are not properly isolated, leading to double scrollbars, input being pushed off-screen, and inconsistent scrolling across desktop and mobile.

## What Changes

- **Root layout**: Add `overflow-hidden` to `<html>` and `<body>` to prevent page-level scrolling
- **Chat layout structure**: Refactor to explicit `h-screen` + `flex-col` + `overflow-hidden` chain with `min-h-0` on all flex children that need to shrink
- **Sidebar**: Ensure independent scroll via `flex-col h-full overflow-hidden` on sidebar + `overflow-y-auto` on conversation list; no spill into main area
- **MessageList**: Make the only scrollable region in the chat panel via `flex-1 min-h-0 overflow-y-auto`; remove `h-full` dependency in favor of explicit flex sizing
- **ChatInput**: Pinned at bottom with `shrink-0` and visual separation (top border/shadow); styled as a rounded, max-width-centered container with send button inside
- **Responsive**: Desktop sidebar visible; mobile sidebar as collapsible drawer; no horizontal scrolling

## Capabilities

### New Capabilities
- `chatgpt-layout`: Full viewport flex layout with isolated scroll regions — sidebar scrolls independently, message list scrolls independently, everything else is fixed

### Modified Capabilities
- *(none — this is a structural refactor, no behavior specs change)*

## Impact

- **Files affected**: `src/app/layout.tsx`, `src/app/(chat)/layout.tsx`, `src/app/(chat)/page.tsx`, `src/components/chat/chat-page.tsx`, `src/components/chat/message-thread.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/components/chat/chat-input.tsx`, `src/app/globals.css`, `src/features/conversations/components/ConversationSidebar.tsx`
- **No API changes**
- **No dependency changes**
- **No behavior changes** to sending/receiving messages — purely a layout refactor
