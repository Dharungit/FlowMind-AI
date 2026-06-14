## ADDED Requirements

### Requirement: Conversation via Path-Based URL

The system SHALL identify the active conversation using a path segment `/c/[conversationId]` instead of a URL search parameter.

#### Scenario: Active conversation sets path segment
- **GIVEN** the user is on the home page
- **WHEN** the user selects a conversation from the sidebar
- **THEN** the URL SHALL update to `/c/<conversation-id>`
- **AND** the page SHALL NOT trigger a full reload

#### Scenario: Path segment sets active conversation on mount
- **GIVEN** the URL is `/c/<conversation-id>`
- **WHEN** the page mounts
- **THEN** the conversation with that ID SHALL be marked as active
- **AND** the conversation item SHALL be highlighted in the sidebar

#### Scenario: Home page clears active conversation
- **GIVEN** the user navigates to `/`
- **WHEN** the page mounts
- **THEN** the active conversation SHALL be cleared
- **AND** the chat area SHALL show the new chat empty state

#### Scenario: Unknown conversation path
- **GIVEN** the URL is `/c/<non-existent-id>`
- **WHEN** the page loads and the conversation list is fetched
- **THEN** the system SHALL display the empty chat state
- **AND** no conversation SHALL be highlighted in the sidebar

---

### Requirement: Deep Linking via Path Segment

The system SHALL support deep-linking to conversations via the `/c/[conversationId]` path.

#### Scenario: Navigate directly to a conversation
- **GIVEN** a user navigates to `/c/<valid-id>`
- **WHEN** the page loads
- **THEN** the conversation SHALL be displayed
- **AND** the sidebar SHALL highlight the matching conversation item

#### Scenario: Shareable conversation URL
- **GIVEN** a user has an active conversation at `/c/<id>`
- **WHEN** they copy the current URL
- **THEN** the URL SHALL be `/c/<id>`
- **AND** pasting that URL in a new tab SHALL open the same conversation

---

### Requirement: Browser Navigation with Path Routes

The system SHALL integrate with the browser's back and forward navigation using path-based conversation URLs.

#### Scenario: Back button returns to previous conversation
- **GIVEN** the user navigated from `/c/<id-a>` to `/c/<id-b>`
- **WHEN** the user clicks the browser back button
- **THEN** the URL SHALL revert to `/c/<id-a>`
- **AND** conversation A SHALL become the active conversation

#### Scenario: Forward button after going back
- **GIVEN** the user went back from `/c/<id-b>` to `/c/<id-a>`
- **WHEN** the user clicks the browser forward button
- **THEN** the URL SHALL advance to `/c/<id-b>`
- **AND** conversation B SHALL become the active conversation

#### Scenario: Back button from New Chat
- **GIVEN** the user was at `/c/<id>` and clicked "New Chat" navigating to `/`
- **WHEN** the user clicks the browser back button
- **THEN** the previous conversation SHALL be restored as active
- **AND** the URL SHALL be `/c/<id>`

---

### Requirement: Page-Driven State Initialization

The system SHALL initialize conversation state from route parameters on page mount, rather than from global URL parsing in a provider.

#### Scenario: Conversation page sets active ID from route param
- **GIVEN** the conversation route page at `(chat)/c/[conversationId]` mounts
- **WHEN** the page component reads `useParams().conversationId`
- **THEN** it SHALL dispatch `SET_ACTIVE` with the conversation ID

#### Scenario: Home page clears active ID on mount
- **GIVEN** the home page at `(chat)/` mounts
- **WHEN** the page component renders
- **THEN** it SHALL dispatch `CLEAR_ACTIVE`

#### Scenario: Refresh preserves active conversation
- **GIVEN** the user is at `/c/<id>`
- **WHEN** the page is refreshed
- **THEN** the conversation SHALL remain active after the page reloads
- **AND** the sidebar SHALL highlight the same conversation
