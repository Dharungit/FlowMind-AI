## ADDED Requirements

### Requirement: Chat message thread display
The system SHALL display a scrollable thread of user and assistant messages.

#### Scenario: User sends a message and sees it in the thread
- **GIVEN** the chat screen is open with no messages
- **WHEN** the user types text in the input area and presses Enter
- **THEN** a user message bubble appears in the thread with the typed text

#### Scenario: Assistant responds to a user message
- **GIVEN** a user message has been sent
- **WHEN** the backend returns a response
- **THEN** an assistant message bubble appears in the thread

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

### Requirement: Message input area text entry
The system SHALL provide a text input that sends on Enter and inserts newline on Shift+Enter.

#### Scenario: User sends message with Enter
- **GIVEN** the input area is empty
- **WHEN** the user types text and presses Enter
- **THEN** the message is sent
- **AND** the input area is cleared

#### Scenario: User inserts newline with Shift+Enter
- **GIVEN** the input area is focused
- **WHEN** the user presses Shift+Enter
- **THEN** a newline is inserted in the input
- **AND** no message is sent

#### Scenario: Input is disabled while streaming
- **GIVEN** an assistant response is being streamed
- **WHEN** the user attempts to type or press Enter
- **THEN** the input is disabled
- **AND** the user cannot send a new message

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

### Requirement: Streaming response display
Assistant responses SHALL render incrementally as tokens arrive.

#### Scenario: Tokens appear one by one during streaming
- **GIVEN** a message has been sent with stream: true
- **WHEN** the backend sends response tokens
- **THEN** each token is appended to the assistant message as it arrives
- **AND** no tokens are lost

#### Scenario: Loading state before first token
- **GIVEN** a message has been sent with stream: true
- **WHEN** the request is in flight and no token has arrived yet
- **THEN** a "thinking" indicator is shown in the assistant message area

### Requirement: Stop generation
The user SHALL be able to cancel an in-progress streaming response.

#### Scenario: Stop button appears during streaming
- **GIVEN** a streaming response is in progress
- **WHEN** the user looks at the input area
- **THEN** a stop/cancel button is visible

#### Scenario: Stop button ends the stream
- **GIVEN** a streaming response is in progress
- **WHEN** the user clicks the stop button
- **THEN** the response is cancelled
- **AND** the input is re-enabled
- **AND** the partial message remains visible

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
