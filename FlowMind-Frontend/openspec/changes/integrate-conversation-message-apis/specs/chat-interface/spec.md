## REMOVED Requirements

### Requirement: Streaming response display
**Reason**: Streaming has been removed. All responses arrive as complete messages via the non-streaming conversation messages endpoint.

**Migration**: Remove the token-by-token rendering logic. Assistant messages render in full on arrival.

### Requirement: Stop generation
**Reason**: Streaming has been removed. There is no in-progress generation to cancel.

**Migration**: Remove the stop button from the input area. A send button replaces the send/stop toggle.

## MODIFIED Requirements

### Requirement: Chat message thread display

The system SHALL display a scrollable thread of user and assistant messages loaded from React Query.

#### Scenario: User sends a message and sees it in the thread
- **GIVEN** the chat screen is open
- **WHEN** the user types text in the input area and presses Enter
- **THEN** a user message bubble appears in the thread with the typed text
- **AND** the assistant reply appears once the API responds

#### Scenario: Assistant responds to a user message
- **GIVEN** a user message has been sent
- **WHEN** the backend returns a response
- **THEN** an assistant message bubble appears in the thread with the full response content

#### Scenario: Thread auto-scrolls to the latest message
- **GIVEN** the thread contains more messages than fit on screen
- **WHEN** a new message is added
- **THEN** the thread scrolls to show the newest message

#### Scenario: User pauses auto-scroll by scrolling up
- **GIVEN** new messages are arriving in the thread
- **WHEN** the user scrolls up manually
- **THEN** auto-scroll is paused
- **AND** a "scroll to bottom" button appears

#### Scenario: User resumes auto-scroll via button
- **GIVEN** auto-scroll is paused
- **WHEN** the user clicks the "scroll to bottom" button
- **THEN** the thread scrolls to the latest message
- **AND** auto-scroll resumes

#### Scenario: Messages loaded from React Query
- **GIVEN** a conversation is active
- **WHEN** the chat page loads
- **THEN** messages SHALL be fetched via `GET /v1/conversations/{id}`
- **AND** messages SHALL be rendered from the React Query cache
- **AND** a loading skeleton SHALL be shown while fetching

### Requirement: Message input area text entry

The system SHALL provide a text input that sends on Enter and inserts newline on Shift+Enter.

#### Scenario: User sends message with Enter
- **GIVEN** the input area is empty
- **WHEN** the user types text and presses Enter
- **THEN** the message is sent via `useSendMessage`
- **AND** the input area is cleared

#### Scenario: User inserts newline with Shift+Enter
- **GIVEN** the input area is focused
- **WHEN** the user presses Shift+Enter
- **THEN** a newline is inserted in the input
- **AND** no message is sent

#### Scenario: Input remains enabled while waiting for response
- **GIVEN** a message has been submitted and the response is pending
- **WHEN** the user attempts to type or press Enter
- **THEN** the input SHALL remain enabled
- **AND** the user can send another message

### Requirement: Empty state placeholder

The system SHALL show a placeholder when no messages exist.

#### Scenario: Empty state is shown on first load
- **GIVEN** the chat screen has just loaded
- **WHEN** there are no messages
- **THEN** an empty state placeholder is displayed
- **AND** no message bubbles are rendered

#### Scenario: Empty state disappears on first message
- **GIVEN** the empty state is displayed
- **WHEN** the user sends their first message
- **THEN** the empty state is replaced by the message thread

### Requirement: Markdown rendering

Assistant messages SHALL render Markdown content with formatted output.

#### Scenario: Code block is rendered with formatting
- **GIVEN** an assistant message contains a code block
- **WHEN** the message is displayed
- **THEN** the code block is rendered in a monospace font
- **AND** the code block has a distinct background

#### Scenario: Bold and list formatting is rendered
- **GIVEN** an assistant message contains bold text and a list
- **WHEN** the message is displayed
- **THEN** bold text appears emphasized
- **AND** list items are rendered as a bullet list
