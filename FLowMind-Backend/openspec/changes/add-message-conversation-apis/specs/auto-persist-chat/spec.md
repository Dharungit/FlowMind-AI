## ADDED Requirements

### Requirement: Internal chat completion
Feature: Auto-persist Chat
Rule: The previous public `/v1/chat/completions` endpoint is removed; chat completion is called internally by the message add flow

#### Scenario: Internal chat completion is no longer publicly routable
- **GIVEN** the application is running
- **WHEN** a client sends `POST /v1/chat/completions`
- **THEN** the response status is `404 Not Found`

#### Scenario: Message flow triggers internal chat completion
- **GIVEN** a user sends a message via `POST /v1/conversations/{id}/messages`
- **WHEN** the user message is persisted
- **THEN** the `ChatService.chat()` method is called internally with the full conversation history
- **AND** the assistant's response is persisted as a new message in the same conversation

### Requirement: Full history loaded from database
Rule: When processing a new message, the backend loads all prior messages from the database

#### Scenario: All prior messages are included in the LLM call
- **GIVEN** a conversation has 10 prior messages
- **WHEN** a new user message is submitted
- **THEN** the internal chat completion receives all 10 prior messages plus the new user message

#### Scenario: Messages are passed in chronological order
- **GIVEN** a conversation has messages created at times T1, T2, T3
- **WHEN** a new message is submitted
- **THEN** the internal chat completion receives messages ordered by `created_at` ascending
