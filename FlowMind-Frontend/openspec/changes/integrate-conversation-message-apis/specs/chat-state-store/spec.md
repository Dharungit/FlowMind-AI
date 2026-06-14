## MODIFIED Requirements

### Requirement: Chat state management

Chat state (error flag) MUST be owned by a ChatContext + useReducer provider. Messages are no longer stored in ChatContext — they are managed by React Query.

#### Scenario: Send a message
- **GIVEN** the user has typed a message in the chat input
- **WHEN** the user submits the message
- **THEN** the `useSendMessage` mutation SHALL be called
- **AND** React Query SHALL manage the loading state
- **AND** the input SHALL remain enabled while the request is in flight

#### Scenario: Send error
- **GIVEN** a message send fails
- **WHEN** the error occurs
- **THEN** the error SHALL be surfaced via React Query's error state
- **AND** the input SHALL remain usable for retry

#### Scenario: Clear error
- **GIVEN** an error is present
- **WHEN** the user sends a new message
- **THEN** the error state SHALL be cleared

### Requirement: ChatProvider scope

ChatProvider MUST be mounted in the (chat) route group layout, not in the root layout, to avoid mounting chat state on auth pages.

#### Scenario: Chat state is scoped to chat routes
- **GIVEN** the application has route groups configured
- **WHEN** a user navigates to the login page
- **THEN** the ChatProvider is not mounted
- **AND** chat state is not initialized

#### Scenario: Chat state is available on chat pages
- **GIVEN** the user is on any route within the (chat) group
- **WHEN** a component calls the chat context hook
- **THEN** it receives the current chat state (error) and dispatch function

## REMOVED Requirements

### Requirement: Action: START_STREAMING
**Reason**: Streaming has been removed. Messages are now sent non-streaming via `useSendMessage` and React Query manages loading state.

**Migration**: Replace `dispatch(startStreaming())` with the `useSendMessage` mutation's `isPending` flag.

### Requirement: Action: APPEND_TOKEN
**Reason**: Streaming has been removed. No incremental tokens are received.

**Migration**: Remove all `dispatch(appendToken(token))` calls.

### Requirement: Action: STOP_STREAMING
**Reason**: Streaming has been removed. No mid-stream cancellation is needed.

**Migration**: Remove stop button and its associated dispatch calls. Non-streaming requests can't be partially cancelled.

### Requirement: Action: FINISH_STREAMING
**Reason**: Streaming has been removed. Completion is handled by the mutation's `onSuccess` callback.

**Migration**: Use React Query's mutation `onSuccess` callback instead.

### Requirement: Receive streaming chunks
**Reason**: Streaming has been removed. The conversation messages endpoint returns a complete response.

**Migration**: Remove `appendToken`/`APPEND_TOKEN` dispatch from the chat flow.

### Requirement: Stop streaming
**Reason**: Streaming has been removed.

**Migration**: Remove the stop button from the UI and the abort controller logic from the chat flow.

### Requirement: Streaming error
**Reason**: Streaming has been removed.

**Migration**: Error handling is now managed by React Query's mutation error state.

### Requirement: Send a message (old streaming flow)
**Reason**: The message send flow has been rewritten. The user message is no longer appended via ChatContext dispatch — it's managed by optimistic updates in React Query.

**Migration**: Use `useSendMessage` mutation from `@/features/conversations/hooks/useSendMessage` instead of `useChat` hook.
