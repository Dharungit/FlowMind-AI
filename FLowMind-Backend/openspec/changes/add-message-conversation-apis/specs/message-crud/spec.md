## ADDED Requirements

### Requirement: Add message to conversation
Feature: Message CRUD
Rule: Authenticated users can send messages to their own conversations

#### Scenario: User sends a new message to their conversation
- **GIVEN** the user has an existing conversation with known ID
- **AND** the conversation has 2 prior messages
- **WHEN** they POST `/v1/conversations/{id}/messages` with `{"messages": [{"role": "user", "content": "Tell me a joke"}]}`
- **THEN** the response status is `200 OK`
- **AND** the response body contains the assistant's reply with `role` of `"assistant"` and non-empty `content`

#### Scenario: User sends to another user's conversation
- **GIVEN** a conversation belongs to another user
- **WHEN** they POST `/v1/conversations/{id}/messages`
- **THEN** the response status is `404 Not Found`

#### Scenario: User sends to a non-existent conversation
- **GIVEN** no conversation exists with the given ID
- **WHEN** they POST `/v1/conversations/{id}/messages`
- **THEN** the response status is `404 Not Found`

#### Scenario: User sends an empty messages array
- **GIVEN** the user has an existing conversation
- **WHEN** they POST `/v1/conversations/{id}/messages` with `{"messages": []}`
- **THEN** the response status is `422 Unprocessable Entity`

#### Scenario: Both user message and assistant reply are persisted
- **GIVEN** an existing conversation with 2 prior messages
- **WHEN** the user sends a new message
- **THEN** the conversation now contains 4 messages (2 prior + 1 user + 1 assistant)
- **AND** both the new user message and assistant reply have non-null `created_at` timestamps

### Requirement: Delete message
Rule: Authenticated users can delete individual messages from their own conversations

#### Scenario: User deletes a message from their conversation
- **GIVEN** the user has a conversation with 3 messages
- **WHEN** they DELETE `/v1/messages/{messageId}`
- **THEN** the response status is `204 No Content`
- **AND** the conversation now contains 2 messages

#### Scenario: User deletes a message from another user's conversation
- **GIVEN** a message belongs to a conversation owned by another user
- **WHEN** they DELETE `/v1/messages/{messageId}`
- **THEN** the response status is `404 Not Found`
