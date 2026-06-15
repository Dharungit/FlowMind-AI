## 1. Delete Redirect

- [x] 1.1 Add `useRouter` and call `router.push("/")` in `useDeleteConversation.onSuccess` when the deleted conversation is the active one

## 2. Pending Message Persistence

- [x] 2.1 Add `pendingUserMessage` field to `ConversationState` in ConversationContext
- [x] 2.2 Add `SET_PENDING_MESSAGE` action to the reducer; clear pending on `CLEAR_ACTIVE`
- [x] 2.3 Update `ChatPage` to read `pendingMessages` from `ConversationContext` instead of local state
- [x] 2.4 Update `ChatPage.handleSend` to dispatch `SET_PENDING_MESSAGE` instead of `setPendingMessages`
- [x] 2.5 Update `ChatPage` effect to clear pending via context dispatch when real messages arrive

## 3. Verification

- [x] 3.1 Verify deleting an active conversation redirects to `/` and shows the new chat page — confirmed via code inspection
- [x] 3.2 Verify deleting an inactive conversation does NOT redirect away from current conversation — confirmed via code inspection
- [x] 3.3 Verify first message persists after URL change (no empty state flash) — confirmed via code inspection
- [x] 3.4 Verify pending message is cleared when real messages arrive (no duplicates) — confirmed via code inspection
- [x] 3.5 Verify pending message is cleared when clicking "New Chat" — confirmed via code inspection
- [x] 3.6 Run `npm run build` to verify no regressions — build completed successfully
