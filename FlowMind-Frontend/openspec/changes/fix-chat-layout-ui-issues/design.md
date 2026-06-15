## Context

The chat layout has 5 UI/UX regressions that impact the core chat experience. All fixes are client-side only — no API or data model changes. The app uses Next.js App Router, React Context for state, and TanStack React Query for server-state management.

## Goals / Non-Goals

**Goals:**
- Fix chat input to stay fixed at viewport bottom regardless of message scroll
- Prevent sidebar from auto-closing on conversation click (desktop only)
- Reduce loader size so it doesn't cover the entire screen
- Replace `/` with `/c/[id]` via `router.replace` after conversation creation
- Show user message immediately on send with WhatsApp-style typing indicator while waiting for AI response

**Non-Goals:**
- No API or data model changes
- No streaming implementation
- No architectural refactors beyond the fixes listed
- No changes to the sidebar toggle behavior (Escape key, hamburger button)

## Decisions

### D1 — Chat input: flex containment with sticky footer

**Decision:** Keep the input in the normal document flow but enforce proper flex containment so it stays at the bottom while the message area scrolls internally.

**Rationale:** The current `flex h-full flex-col` + `flex-1` message area + `shrink-0` input should work if all intermediate containers properly constrain height. The root cause is the message area's parent missing `overflow-hidden`, which lets the entire page scroll instead of the message thread. Adding `overflow-hidden` to the message container forces the MessageThread's internal `overflow-y-auto` to engage.

**Alternatives considered:**
- `fixed bottom-0` positioning: Fragile — needs manual left-offset for sidebar, breaks on resize/sidebar toggle
- `sticky bottom-0`: Same flex containment issue — doesn't work without constrained parent height

### D2 — Sidebar: prevent close on desktop conversation selection

**Decision:** Ensure `handleSelectConversation` never dispatches `CLOSE_SIDEBAR`. Currently the code doesn't explicitly close it, but navigation may trigger a state reset. Add a guard in `handleSelectConversation` to ensure sidebar stays open by not interacting with sidebar state.

**Rationale:** The sidebar state should only change through explicit user action (hamburger toggle, Escape key on desktop, backdrop click on mobile). Navigation should not affect it.

### D3 — Loader: reduce to inline size

**Decision:** Change the `Spinner` in the loading state to use a reasonable inline size (`size-5`) instead of the default (which can be large). Also remove the full-height centering container to avoid covering the screen.

**Rationale:** The loading state currently renders a full-height flex centered container — when the page container is large, this fills the entire viewport. The fix constrains the spinner to a small inline element that doesn't dominate the layout.

### D4 — New conversation path replacement

**Decision:** In `useSendMessage`, after successfully creating a conversation (when `!activeConversationId`), use `router.replace` from `next/navigation` to update the URL to `/c/${conversationId}`.

**Rationale:** The current flow creates a conversation → sets `SET_ACTIVE` → stays at `/`. The URL should reflect the active conversation. Using `router.replace` (not `push`) avoids adding history entries for the transient `/` state.

**Alternative considered:** Using `router.push` — would add a history entry for `/` which is undesirable since the user shouldn't be able to navigate "back" to a root state.

### D5 — Optimistic message update + typing indicator

**Decision:** Maintain a local `pendingMessages` state in `ChatPage` that holds messages sent but not yet reflected in the server data. On send, immediately push the user message to this array. While `isPending` is true, render a typing indicator component below pending messages. When the query invalidates and refetches, clear `pendingMessages`.

**Rationale:** This is the least invasive approach — it doesn't modify the mutation hook's architecture or React Query's cache handling. The local state acts as an overlay on top of the existing server-driven data flow. The typing indicator is a simple presentational component with CSS keyframe dots animation.

**Alternative considered:** React Query `onMutate` optimistic update — modifies the query cache directly, requires rollback logic on error, and ties the UI to the mutation lifecycle more tightly.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Typing indicator persists if mutation hangs | Add a timeout or tie it to `isPending` lifecycle — component unmounts when mutation settles |
| URL replace races with SET_ACTIVE dispatch | Ensure `router.replace` is called after the conversation ID is confirmed from API |
| `overflow-hidden` could clip legitimate content | Test with long messages, code blocks, and error states |
| Pending messages double with server messages on first render after refetch | Clear `pendingMessages` when real data arrives (useEffect watching `conversation.messages`) |

## Migration Plan

Deploy as a single PR. Each fix is independently testable. Rollback is a revert of the PR — no data migration needed.

## Open Questions

None.
