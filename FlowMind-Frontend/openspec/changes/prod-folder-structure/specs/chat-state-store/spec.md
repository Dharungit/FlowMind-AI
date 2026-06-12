## ADDED Requirements

### Requirement: Chat state is managed via ChatContext

Feature: ChatStateStore
Rule: Chat state (messages array, streaming flag, error) is owned by a ChatContext + useReducer provider, replacing the inline useReducer in the existing use-chat.ts hook.

#### Scenario: Send a message
- **GIVEN** the user has typed a message in the chat input
- **AND** no message is currently streaming
- **WHEN** the user submits the message
- **THEN** the user message is appended to the messages array with role "user"
- **AND** a loading placeholder is appended with role "assistant" and empty content
- **AND** the isStreaming flag is set to true
- **AND** an API request is initiated to the chat completions endpoint

#### Scenario: Receive streaming chunks
- **GIVEN** a message is currently streaming (isStreaming is true)
- **WHEN** a new token chunk arrives from the SSE stream
- **THEN** the token is appended to the last assistant message's content
- **AND** the messages array is updated immutably

#### Scenario: Stop streaming
- **GIVEN** a message is currently streaming (isStreaming is true)
- **WHEN** the user clicks the stop button
- **THEN** the API request is aborted
- **AND** isStreaming is set to false
- **AND** the partial assistant message content is preserved

#### Scenario: Streaming error
- **GIVEN** a message is currently streaming
- **WHEN** the SSE stream encounters a network error or returns an error response
- **THEN** isStreaming is set to false
- **AND** the error message is stored in the error state
- **AND** the partial content (if any) is preserved in the last assistant message

#### Scenario: Clear error
- **GIVEN** the error state contains an error message
- **WHEN** the user sends a new message
- **THEN** the error state is cleared

### Requirement: ChatProvider wraps only chat routes

Feature: ChatStateStore
Rule: ChatProvider is mounted in the (chat) route group layout, not in the root layout, to avoid mounting chat state on auth pages.

#### Scenario: Chat state is scoped to chat routes
- **GIVEN** the application has route groups configured
- **WHEN** a user navigates to the login page
- **THEN** the ChatProvider is not mounted
- **AND** chat state is not initialized

#### Scenario: Chat state is available on chat pages
- **GIVEN** the user is on any route within the (chat) group
- **WHEN** a component calls useChat() hook
- **THEN** it receives the current chat state and dispatch function
