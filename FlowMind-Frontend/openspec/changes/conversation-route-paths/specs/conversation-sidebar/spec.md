## MODIFIED Requirements

### Requirement: New Chat Button

The system SHALL display a "New Chat" button in a dedicated top section of the sidebar. Clicking it SHALL navigate to `/` and clear the active conversation.

#### Scenario: New Chat button visible
- **GIVEN** the user is authenticated and the sidebar is open
- **WHEN** the sidebar renders
- **THEN** a "New Chat" button SHALL be displayed at the top of the sidebar
- **AND** the button SHALL include a plus icon and the text "New Chat"

#### Scenario: New Chat clears active conversation
- **GIVEN** the user has an active conversation displayed in the chat area
- **WHEN** the user clicks the "New Chat" button
- **THEN** the URL SHALL navigate to `/`
- **AND** the message thread SHALL be cleared
- **AND** no new conversation entry SHALL appear in the sidebar until a message is sent

#### Scenario: New Chat after active conversation
- **GIVEN** the user clicked "New Chat" and the message thread was cleared
- **WHEN** the user sends their first message
- **THEN** a new conversation entry SHALL be created in the sidebar with the title "New Conversation"

---

### Requirement: Conversation List

The system SHALL display a scrollable list of the user's conversations. Selecting a conversation SHALL navigate to `/c/<conversation-id>`.

#### Scenario: Conversations displayed
- **GIVEN** the user has existing conversations
- **WHEN** the sidebar renders the conversation list
- **THEN** each conversation SHALL display its title and relative timestamp
- **AND** conversations SHALL be ordered by most recently updated first

#### Scenario: Active conversation highlighted
- **GIVEN** the user has selected a conversation
- **WHEN** the conversation list renders
- **THEN** the selected conversation item SHALL have a distinct active background color
- **AND** the selected conversation title SHALL use medium font weight

#### Scenario: Selecting a conversation navigates to path URL
- **GIVEN** a conversation is displayed in the sidebar
- **WHEN** the user clicks on the conversation item
- **THEN** the URL SHALL navigate to `/c/<conversation-id>`
- **AND** the conversation SHALL become the active conversation

#### Scenario: Empty conversation list
- **GIVEN** the user has no conversations
- **WHEN** the sidebar renders
- **THEN** an empty state message SHALL be displayed
- **AND** the message SHALL include an icon and instructional text

#### Scenario: Conversation list scrolls independently
- **GIVEN** the user has more conversations than fit in the sidebar viewport
- **WHEN** the sidebar renders
- **THEN** the conversation list SHALL be scrollable
- **AND** the "New Chat" button SHALL remain fixed at the top
