## Why

Users have no way to search across their conversation history. As the number of conversations grows, finding a specific discussion requires manually scrolling through the sidebar. A search feature lets users quickly locate relevant conversations by content.

## What Changes

- Add a Search button below the New Chat button in the sidebar
- Create a search modal with a debounced text input and scrollable results
- Modal has three states: initial blank (empty state before any search), no results (empty search completed), and populated results
- Add `GET /v1/conversations/search?q=` API endpoint integration
- Each result shows conversation title (semibold) and matched text, with hover date display
- Clicking a result navigates to that conversation
- Error states surfaced via sonner toast and inline error in the modal

## Capabilities

### New Capabilities
- `conversation-search`: Search conversations by text query with debounced input, skeleton loading, scrollable results, and navigation on click. Handles initial blank state, empty results, and error states.

### Modified Capabilities

*(none)*

## Impact

- **New files**: `src/hooks/useDebounce.ts`, `src/features/conversations/hooks/useSearchConversations.ts`, `src/features/conversations/components/SearchModal.tsx`
- **Modified files**: `src/features/conversations/types.ts`, `src/features/conversations/api/conversation-client.ts`, `src/features/conversations/components/ConversationSidebar.tsx`
- **API dependency**: New `GET /v1/conversations/search?q=` endpoint returning `{ results: [{ conversation_id, title, matched_text, created_at, updated_at }] }`
