## ADDED Requirements

### Requirement: Auto-generate title from first user message

The system SHALL expose a `POST /v1/conversations/{id}/generate-title` endpoint that generates a concise title from the first user + assistant exchange, updates the conversation, and returns the updated title. Title generation is on-demand, triggered by the client.

Feature: conversation-title-generation

#### Scenario: Generate title from first exchange
- **GIVEN** a conversation with at least one user message
- **WHEN** the client sends POST /v1/conversations/{id}/generate-title
- **THEN** the system SHALL call the LLM with the first user message and first assistant response as context
- **AND** the LLM prompt SHALL include requirements: noun phrases, title case, 5-word max, no punctuation, no quotes
- **AND** the LLM prompt SHALL include 4 worked examples
- **AND** the conversation title SHALL be updated to the generated title
- **AND** title_generated SHALL be set to True
- **AND** the response SHALL include the updated title and title_generated = True

#### Scenario: Generated title is concise
- **GIVEN** the first user message contains multiple sentences
- **WHEN** the LLM generates a title
- **THEN** the returned title SHALL be no more than 5 words
- **AND** the backend SHALL truncate to 5 words if the LLM exceeds the limit
- **AND** the title SHALL use Title Case
- **AND** the title SHALL be a noun phrase reflecting the conversation topic, not the answer

#### Scenario: No user messages returns 400
- **GIVEN** a conversation with no messages
- **WHEN** the client sends POST /v1/conversations/{id}/generate-title
- **THEN** the system SHALL return 400 Bad Request

#### Scenario: Nonexistent conversation returns 404
- **GIVEN** a conversation ID that does not belong to the user
- **WHEN** the client sends POST /v1/conversations/{id}/generate-title
- **THEN** the system SHALL return 404 Not Found

#### Scenario: Conversation title_generated is reflected in response
- **GIVEN** a conversation with a generated title
- **WHEN** the client fetches the conversation via GET /v1/conversations/{id}
- **THEN** the response SHALL include `title_generated` with value True
