## Why

The chat layout has several UX regressions that make the interface feel broken — the message input scrolls out of view, the sidebar auto-closes on desktop, the loading state is oversized, new conversations don't update the URL, and user messages appear only after the API responds. These issues erode trust in the UI and need targeted fixes without changing the app's architecture.

## What Changes

- **Fix chat input positioning** — Make the input stick to the viewport bottom instead of scrolling with messages
- **Prevent sidebar auto-close on desktop** — Selecting a conversation should not close the sidebar
- **Fix oversized loader** — Reduce the loading indicator so it doesn't cover the entire screen
- **Replace path on new conversation** — Use `router.replace` to update the URL once a conversation is created
- **Add optimistic message display** — Show user messages immediately on send with a WhatsApp-style typing indicator while waiting for the AI response

## Capabilities

### New Capabilities
- `optimistic-message-update`: Display user messages immediately upon send and show a typing dots animation while the API processes the response
- `typing-indicator`: WhatsApp-style animated three-dots indicator shown below the user message while waiting for the AI response

### Modified Capabilities
- (none — behavioral changes are contained within existing UI components, no API contract changes)

## Impact

- **Components modified**: `chat-page.tsx`, `chat-input.tsx`, `message-thread.tsx` (or parent layout), `Sidebar.tsx`, `useSendMessage.ts`
- **New components**: `typing-indicator.tsx` (small presentational component)
- **No API changes**: All fixes are client-side layout and state management changes
- **No dependency changes**: Uses existing Tailwind, React Query, and React primitives
