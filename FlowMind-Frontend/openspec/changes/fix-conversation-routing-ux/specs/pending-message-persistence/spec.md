## ADDED Requirements

### Requirement: Pending user message persists across route change
When a user sends their first message from the new chat page, the optimistic user message must survive the route transition to the new conversation URL so the UI never shows the empty state placeholder.

#### Scenario: First message survives URL change
- **GIVEN** the user is on the new chat page at URL `/`
- **WHEN** the user sends their first message "Hello"
- **THEN** the user's message "Hello" must remain visible after the URL changes to `/c/{newId}`
- **AND** a loading or typing indicator must show below the user message while the assistant response is being generated
- **AND** the "Start a conversation" empty state placeholder must never appear during this transition

#### Scenario: Pending message cleared when real messages arrive
- **GIVEN** the pending user message "Hello" is visible after URL change
- **WHEN** the conversation data loads with the real "Hello" message included
- **THEN** the pending message must be removed
- **AND** only the real messages from the API must be displayed
- **AND** no duplicate "Hello" message must appear

#### Scenario: Pending message cleared on new chat
- **GIVEN** the user has a pending message from a previous conversation send
- **WHEN** the user clicks "New Chat" or navigates to `/`
- **THEN** the pending message must be cleared
- **AND** the new chat empty state must appear cleanly
