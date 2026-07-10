## ADDED Requirements

### Requirement: Optimistic user message display

Feature: Optimistic message update
Rule: When a user sends a message, it should appear in the chat immediately without waiting for the API response.

#### Scenario: User message appears immediately on send
- **GIVEN** the user is in an active conversation
- **WHEN** the user types a message and presses Enter
- **THEN** the user message is displayed in the message thread immediately
- **AND** the message input is cleared

#### Scenario: User message on new conversation
- **GIVEN** the user is on the home screen with no active conversation
- **WHEN** the user types a message and presses Enter
- **THEN** the user message is displayed immediately in the message thread
- **AND** the URL is replaced with the new conversation's path once the API confirms creation

#### Scenario: API error handling
- **GIVEN** the user has sent a message that was optimistically displayed
- **WHEN** the API returns an error
- **THEN** the optimistic message remains visible
- **AND** an error message is shown to the user
