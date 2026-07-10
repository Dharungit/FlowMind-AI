## Why

The current `?conversation=uuid` search param approach works but produces awkward URLs (`/?conversation=c1a2b3c4`) that don't match chat app conventions. Path-based routing (`/c/abc123`) gives cleaner, more shareable, bookmark-friendly URLs and aligns with ChatGPT's URL structure. It also enables proper Next.js static/dynamic route segmentation for future features like conversation metadata in `<head>`.

## What Changes

- **BREAKING**: Replace `?conversation=` search param routing with path-based `/c/[conversationId]` dynamic route segment
- Create new `(chat)/c/[conversationId]/page.tsx` that renders the chat UI for a specific conversation, reading the conversation ID from `useParams()`
- Keep existing `(chat)/page.tsx` at `/` as the "new chat" entry point — dispatches `CLEAR_ACTIVE` on mount
- Remove `window.location.search` parsing from `ConversationProvider` — the provider becomes a pure state holder with no URL awareness
- Update `Sidebar` navigation: `router.push("/?conversation=id")` → `router.push("/c/id")`
- Page components at each route own conversation state initialization via `useEffect` on mount
- Sidebar continues to dispatch `SET_ACTIVE` on click for immediate UI feedback; page mount `useEffect` handles refresh and deep-link recovery

## Capabilities

### New Capabilities

- `conversation-route-paths`: Clean `/c/[conversationId]` URL structure with proper Next.js dynamic routing, replacing search param approach. Enables deep-linking, browser back/forward, and refresh resilience via route-based conversation identification.

### Modified Capabilities

- `conversation-routing`: Changed from search param (`?conversation=`) to path segment (`/c/[conversationId]`). The existing spec scenarios (deep linking, browser navigation, state sync) remain valid but the URL format changes. **BREAKING** — old `?conversation=` URLs no longer work.
- `conversation-sidebar`: Sidebar navigation dispatches to `/c/[id]` instead of `/?conversation=[id]`. The `New Chat` button still navigates to `/`. All sidebar behavior spec scenarios unchanged beyond URL format.
- `conversation-management`: No behavior change to CRUD operations. The active conversation tracking mechanism moves from URL search param to route param.

## Impact

- **New files:** `src/app/(chat)/c/[conversationId]/page.tsx` (thin wrapper rendering ChatPage with conversation ID from params)
- **Modified files:** `src/app/(chat)/page.tsx` (add `CLEAR_ACTIVE` on mount), `src/components/layout/Sidebar.tsx` (update router.push URLs), `src/store/conversation/ConversationContext.tsx` (remove `window.location.search` reading, becomes pure state holder)
- **Removed:** URL search param parsing logic from ConversationProvider
- **Dependencies:** None new — uses existing `useParams` from `next/navigation`
- **Breaking change:** Old `?conversation=` URLs stop working. Any shared/bookmarked URLs need updating.
