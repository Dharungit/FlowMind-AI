## Why

Two conversation routing bugs degrade the UX: deleting an active conversation leaves the user stranded on the deleted conversation's URL, and sending the first message in a new chat flashes the "Start a conversation" placeholder after the URL change because pending UI state is lost on remount.

## What Changes

- **Delete redirect**: When the active conversation is deleted, navigate to `/` instead of staying on the stale URL
- **Persist pending message**: Move the optimistic user message from local ChatPage state to ConversationContext so it survives the route change during new conversation creation
- **Clear pending on reset**: CLEAR_ACTIVE also clears any pending message so stale data doesn't leak between conversations

## Capabilities

### New Capabilities
- `delete-redirect`: After deleting the currently active conversation, the user is redirected to the new chat page (`/`)
- `pending-message-persistence`: The user's optimistically rendered message survives the route transition when a new conversation is created, preventing the "Start a conversation" placeholder flash

### Modified Capabilities
- *(none)*

## Impact

- **Files affected**: `src/features/conversations/hooks/useConversations.ts` (add navigation on delete), `src/store/conversation/ConversationContext.tsx` (add pending user message to state), `src/components/chat/chat-page.tsx` (use context for pending message instead of local state)
- **No API changes**
- **No dependency changes**
