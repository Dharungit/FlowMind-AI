## Why

FlowMind currently has no conversation management — all messages live in a single ephemeral array that disappears on page refresh. Users cannot maintain multiple conversation threads, revisit past chats, or organize their workflow. Adding a ChatGPT-style conversation sidebar establishes the foundation for multi-conversation support, persistence, and mobile navigation — all without altering the existing chat architecture.

## What Changes

- Add a conversation sidebar (280px, persistent on desktop, overlay drawer on mobile) with a "New Chat" button in a dedicated top section and a scrollable conversation list below
- Introduce conversation data model (`ConversationResponse`, `MessageResponse`, etc.) as TypeScript types, matching the existing backend Pydantic contracts
- Implement a mock service layer with simulated async delays to power loading skeletons, empty states, and CRUD flows; designed for drop-in replacement with real API calls
- Add `ConversationProvider` (React Context + useReducer) for UI state (sidebar open, active conversation ID) alongside TanStack React Query for server-state CRUD (list, create, rename, delete)
- Track active conversation via URL search param (`?conversation=uuid`) synced with provider state, supporting refresh resilience and deep-linking
- Add hamburger toggle button to the existing `Header` component, wired to the existing `UIState.sidebarOpen` / `TOGGLE_SIDEBAR` / `CLOSE_SIDEBAR` actions
- Conversation list items show title + relative timestamp, with hover-revealed rename (inline edit) and delete (confirmation dialog) actions
- "New Chat" clears the message thread without creating a conversation entry; the conversation materializes in the sidebar only on first message sent
- Animated slide transitions (300ms ease) for mobile overlay and desktop collapse using `motion` (already a project dependency)

## Capabilities

### New Capabilities

- `conversation-sidebar`: Persistent desktop sidebar (collapsible) and mobile overlay drawer displaying a conversation list with active highlighting, "New Chat" button, and conversation actions (rename, delete)
- `conversation-management`: Client-side CRUD via mock service layer — create, list, rename, delete conversations with loading, empty, and error states; ready for real API swap
- `conversation-routing`: Active conversation tracked via URL search param (`?conversation=uuid`), synced with provider state, enabling refresh resilience and deep-link sharing

### Modified Capabilities

<!-- No existing capabilities change at the spec level. The chat message flow, streaming, and auth remain untouched. -->

## Impact

- **New files:** `src/features/conversations/` (types, mock service, hooks, components: Sidebar, ConversationItem, NewChatButton, ConversationList, DeleteDialog, RenameInput)
- **Modified files:** `src/components/layout/Header.tsx` (add hamburger toggle), `src/providers.tsx` or root layout (add `ConversationProvider`), `src/store/ui/UIContext.tsx` (consume existing sidebar state in Sidebar component)
- **Dependencies:** None new — `motion` and `lucide-react` already in the project, React Query already configured, `@base-ui/react` primitives available for dialogs
- **No breaking changes** to existing chat page, auth flow, streaming, or API client
