## ADDED Requirements

### Requirement: Send Message to Existing Conversation

The system SHALL send a user message to an existing conversation and receive the assistant's reply.

#### Scenario: Successful message send
- **GIVEN** a conversation exists with an `id`
- **WHEN** `POST /v1/conversations/{conversation_id}/messages` is called with `{ "messages": [{ "role": "user", "content": "Hello!" }] }`
- **THEN** the backend SHALL persist the user message
- **AND** the backend SHALL call the AI to generate a response
- **AND** a `MessageResponse` SHALL be returned with HTTP 200
- **AND** the response SHALL contain `id`, `role` (assistant), `content`, `metadata`, and `created_at`

#### Scenario: Message array format
- **GIVEN** a message is being sent to a conversation
- **WHEN** the request body is constructed
- **THEN** the `messages` array SHALL contain objects with `role` and `content` keys
- **AND** the `role` SHALL be `"user"`

#### Scenario: Response includes metadata
- **GIVEN** the AI generates a response
- **WHEN** the response is returned
- **THEN** the `metadata` field SHALL be an object (may contain model info, usage data, etc.)
- **AND** `metadata` MAY be `null`

---

### Requirement: Create-and-Send Orchestration (New Chat)

When no active conversation exists, the system SHALL create a conversation and send the message atomically.

#### Scenario: First message creates conversation
- **GIVEN** the user is on a new chat (no active conversation)
- **WHEN** the user submits their first message
- **THEN** a new conversation SHALL be created via `POST /v1/conversations`
- **AND** the message SHALL be sent to the new conversation via `POST /v1/conversations/{id}/messages`
- **AND** the assistant reply SHALL be returned to the user

#### Scenario: New conversation appears in sidebar
- **GIVEN** a new conversation was created during message send
- **WHEN** the send completes successfully
- **THEN** the new conversation SHALL appear at the top of the sidebar list

#### Scenario: No conversation created on empty message
- **GIVEN** the user is on a new chat with no active conversation
- **WHEN** the user attempts to send an empty message
- **THEN** no conversation SHALL be created
- **AND** no API call SHALL be made

#### Scenario: Create succeeds but send fails
- **GIVEN** the conversation was created successfully
- **WHEN** the message send fails
- **THEN** the empty conversation SHALL remain in the sidebar
- **AND** the error SHALL be surfaced to the user
- **AND** the user SHALL be able to retry

---

### Requirement: Non-Streaming Response Handling

The system SHALL handle non-streaming message responses.

#### Scenario: Full response received at once
- **GIVEN** a message has been submitted
- **WHEN** the API responds
- **THEN** the complete assistant message content SHALL arrive in a single response
- **AND** no incremental tokens SHALL be delivered

#### Scenario: Response displayed immediately
- **GIVEN** the API has returned a response
- **WHEN** the response is received
- **THEN** the assistant message SHALL be displayed in full
- **AND** the input SHALL be immediately available for the next message
