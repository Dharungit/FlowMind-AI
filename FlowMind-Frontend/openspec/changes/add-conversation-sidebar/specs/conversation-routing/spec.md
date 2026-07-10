## ADDED Requirements

### Requirement: Active Conversation via URL Search Param

The system SHALL track the active conversation using a `conversation` URL search parameter.

#### Scenario: Active conversation sets URL param
- **GIVEN** the user is on the home page
- **WHEN** the user selects a conversation from the sidebar
- **THEN** the URL SHALL update to include `?conversation=<conversation-id>`
- **AND** the page SHALL NOT trigger a full reload

#### Scenario: URL param sets active conversation
- **GIVEN** the URL includes `?conversation=<conversation-id>`
- **WHEN** the page loads
- **THEN** the conversation with that ID SHALL be marked as active in the sidebar
- **AND** the sidebar SHALL highlight that conversation item

#### Scenario: New Chat clears URL param
- **GIVEN** the URL includes `?conversation=<conversation-id>`
- **WHEN** the user clicks "New Chat"
- **THEN** the URL SHALL be cleared to the base path `/`
- **AND** no conversation SHALL be highlighted in the sidebar

#### Scenario: Unknown conversation ID
- **GIVEN** the URL includes `?conversation=<non-existent-id>`
- **WHEN** the page loads and the conversation list is fetched
- **THEN** the system SHALL display the empty chat state
- **AND** no conversation SHALL be highlighted in the sidebar

---

### Requirement: Deep Linking

The system SHALL support deep-linking to conversations via the URL search param.

#### Scenario: Navigate directly to a conversation
- **GIVEN** a user has a URL with `?conversation=<valid-id>`
- **WHEN** they navigate to that URL
- **THEN** the conversation SHALL be loaded and displayed
- **AND** the sidebar SHALL highlight the matching conversation item

#### Scenario: Shareable conversation URL
- **GIVEN** a user has an active conversation
- **WHEN** they copy the current URL
- **THEN** the URL SHALL contain the conversation ID as a search param
- **AND** pasting that URL in a new tab SHALL open the same conversation

---

### Requirement: Browser Navigation

The system SHALL integrate with the browser's back and forward navigation for conversation history.

#### Scenario: Back button returns to previous conversation
- **GIVEN** the user selected conversation A, then selected conversation B
- **WHEN** the user clicks the browser back button
- **THEN** the URL SHALL revert to `?conversation=<conversation-a-id>`
- **AND** conversation A SHALL become the active conversation

#### Scenario: Forward button after going back
- **GIVEN** the user went back from conversation B to conversation A
- **WHEN** the user clicks the browser forward button
- **THEN** the URL SHALL advance to `?conversation=<conversation-b-id>`
- **AND** conversation B SHALL become the active conversation

#### Scenario: Back button from New Chat
- **GIVEN** the user was on an active conversation and clicked "New Chat"
- **WHEN** the user clicks the browser back button
- **THEN** the previous conversation SHALL be restored as active
- **AND** the URL SHALL include `?conversation=<previous-id>`

---

### Requirement: State Synchronization

The system SHALL keep the ConversationProvider state synchronized with the URL search param as the single source of truth.

#### Scenario: Provider reads from URL on mount
- **GIVEN** the URL includes `?conversation=<conversation-id>`
- **WHEN** the ConversationProvider mounts
- **THEN** its active conversation ID state SHALL match the URL param

#### Scenario: URL updates when provider state changes
- **GIVEN** the user interacts with the sidebar to change active conversation
- **WHEN** the ConversationProvider dispatches a new active conversation ID
- **THEN** the URL search param SHALL update to match

#### Scenario: Refresh preserves active conversation
- **GIVEN** the user has an active conversation with `?conversation=<id>` in the URL
- **WHEN** the page is refreshed
- **THEN** the conversation SHALL remain active after the page reloads
- **AND** the sidebar SHALL highlight the same conversation
