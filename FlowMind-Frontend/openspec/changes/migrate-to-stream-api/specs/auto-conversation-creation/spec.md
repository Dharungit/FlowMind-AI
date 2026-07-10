## ADDED Requirements

### Requirement: Backend auto-creates conversation when no conversation_id
The frontend SHALL omit conversation_id from the stream payload for new chats. The backend SHALL create a new conversation and return the generated ID in the meta SSE event.

#### Scenario: New conversation created from first message
- **GIVEN** the user has no active conversation
- **WHEN** the frontend calls POST /v1/stream with body `{"messages": [{"role": "user", "content": "Hello"}]}` (no conversation_id)
- **THEN** the first SSE event must be `{"type": "meta", "conversation_id": "<new-uuid>"}`
- **AND** the backend must persist both the user message and the assistant response under the new conversation

### Requirement: Frontend navigates to conversation URL on meta event
Rule: The frontend SHALL update the URL to `/c/{conversation_id}` when the meta SSE event arrives, without causing a page remount or losing the in-progress stream.

#### Scenario: URL updates during new chat stream
- **GIVEN** the user is on `/` with no active conversation
- **WHEN** the user sends a message
- **AND** the meta event arrives with `conversation_id: "conv-abc"`
- **THEN** the activeConversationId must be set to "conv-abc"
- **AND** the URL must update to `/c/conv-abc`
- **AND** the streaming tokens must continue to render without interruption
- **AND** no loading spinner or empty state flash should appear

#### Scenario: Existing conversation continues without URL change
- **GIVEN** the user is on `/c/conv-123` with an active conversation
- **WHEN** the user sends a follow-up message
- **THEN** the body must include `conversation_id: "conv-123"`
- **AND** the URL must not change
- **AND** the meta event conversation_id must match the existing one

### Requirement: Conversation list refreshes on stream completion
Rule: The frontend SHALL refresh the sidebar conversation list when a stream completes, so new conversations appear automatically.

#### Scenario: Sidebar shows new conversation after first message
- **GIVEN** the user sends the first message in a new conversation
- **WHEN** the stream completes with the done event
- **THEN** the sidebar conversation list must be refreshed
- **AND** the new conversation must appear in the list
