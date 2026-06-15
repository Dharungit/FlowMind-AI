## 1. Fix chat input positioning (sticky to viewport bottom)

- [x] 1.1 Add `overflow-hidden` to the message area container in `chat-page.tsx` to force internal scrolling
- [x] 1.2 Verify the chat input stays fixed at the bottom while messages scroll internally

## 2. Prevent sidebar auto-close on desktop conversation selection

- [x] 2.1 In `Sidebar.tsx`, ensure `handleSelectConversation` does not close the sidebar on desktop
- [x] 2.2 Verify sidebar stays open after clicking a conversation on desktop (md+)

## 3. Fix oversized loader

- [x] 3.1 In `chat-page.tsx`, constrain the loading `Spinner` to a small inline size and remove full-height centering
- [x] 3.2 Verify the loading state shows a compact spinner instead of covering the entire screen

## 4. Replace path on new conversation creation

- [x] 4.1 In `useSendMessage.ts`, import `useRouter` from `next/navigation` and call `router.replace` after conversation creation
- [x] 4.2 Verify that after sending the first message from `/`, the URL updates to `/c/[conversationId]`

## 5. Add optimistic message update

- [x] 5.1 Add local `pendingMessages` state in `ChatPage` to hold messages sent but not yet confirmed by the server
- [x] 5.2 On `handleSend`, immediately push the user message to `pendingMessages` and clear the input
- [x] 5.3 Merge `pendingMessages` with server-fetched `messages` in the render, and clear `pendingMessages` when server data arrives
- [x] 5.4 Verify user message appears immediately on send, before the API response

## 6. Add WhatsApp-style typing indicator

- [x] 6.1 Create a `TypingIndicator` component with three animated dots (CSS keyframe bounce animation)
- [x] 6.2 Render the typing indicator in `ChatPage` below messages while waiting for the AI response
- [x] 6.3 Verify indicator shows while `isPending` is true and disappears when response arrives
