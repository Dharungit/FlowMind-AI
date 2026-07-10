## MODIFIED Requirements

### Requirement: Active Conversation via URL Search Param

The system SHALL track the active conversation using a `/c/[conversationId]` path segment instead of a URL search parameter.

#### Scenario: Active conversation sets URL
- **GIVEN** the user is on the home page
- **WHEN** the user selects a conversation from the sidebar
- **THEN** the URL SHALL update to `/c/<conversation-id>`
- **AND** the page SHALL NOT trigger a full reload

#### Scenario: URL sets active conversation on mount
- **GIVEN** the URL is `/c/<conversation-id>`
- **WHEN** the page loads
- **THEN** the conversation with that ID SHALL be marked as active in the sidebar
- **AND** the sidebar SHALL highlight that conversation item

#### Scenario: New Chat clears URL
- **GIVEN** the URL is `/c/<conversation-id>`
- **WHEN** the user clicks "New Chat"
- **THEN** the URL SHALL be cleared to `/`
- **AND** no conversation SHALL be highlighted in the sidebar

#### Scenario: Unknown conversation path
- **GIVEN** the URL is `/c/<non-existent-id>`
- **WHEN** the page loads and the conversation list is fetched
- **THEN** the system SHALL display the empty chat state
- **AND** no conversation SHALL be highlighted in the sidebar

---

### Requirement: Deep Linking

The system SHALL support deep-linking to conversations via the `/c/[conversationId]` path.

#### Scenario: Navigate directly to a conversation
- **GIVEN** a user navigates to `/c/<valid-id>`
- **WHEN** they open that URL
- **THEN** the conversation SHALL be loaded and displayed
- **AND** the sidebar SHALL highlight the matching conversation item

#### Scenario: Shareable conversation URL
- **GIVEN** a user has an active conversation
- **WHEN** they copy the current URL
- **THEN** the URL SHALL be `/c/<id>`
- **AND** pasting that URL in a new tab SHALL open the same conversation

---

### Requirement: Browser Navigation

The system SHALL integrate with the browser's back and forward navigation for conversation history.

#### Scenario: Back button returns to previous conversation
- **GIVEN** the user selected conversation A, then selected conversation B
- **WHEN** the user clicks the browser back button
- **THEN** the URL SHALL revert to `/c/<id-a>`
- **AND** conversation A SHALL become the active conversation

#### Scenario: Forward button after going back
- **GIVEN** the user went back from conversation B to conversation A
- **WHEN** the user clicks the browser forward button
- **THEN** the URL SHALL advance to `/c/<id-b>`
- **AND** conversation B SHALL become the active conversation

#### Scenario: Back button from New Chat
- **GIVEN** the user was on an active conversation and clicked "New Chat"
- **WHEN** the user clicks the browser back button
- **THEN** the previous conversation SHALL be restored as active
- **AND** the URL SHALL be `/c/<previous-id>`

---

### Requirement: State Synchronization

The system SHALL initialize conversation state from the route page component on mount, rather than from a centralized provider parsing the URL.

#### Scenario: Page reads route param on mount
- **GIVEN** the URL is `/c/<conversation-id>`
- **WHEN** the conversation page component mounts and reads `useParams().conversationId`
- **THEN** it SHALL dispatch `SET_ACTIVE` with the conversation ID

#### Scenario: Home page clears state on mount
- **GIVEN** the user navigates to `/`
- **WHEN** the home page component mounts
- **THEN** it SHALL dispatch `CLEAR_ACTIVE`

#### Scenario: Refresh preserves active conversation
- **GIVEN** the user is at `/c/<id>`
- **WHEN** the page is refreshed
- **THEN** the conversation SHALL remain active after the page reloads
- **AND** the sidebar SHALL highlight the same conversation

## REMOVED Requirements

### Requirement: Provider Reads URL on Mount
**Reason**: The ConversationProvider no longer parses `window.location.search` to determine the active conversation. State initialization is now the responsibility of each route's page component via `useParams()`.

**Migration**: Page components at `/` and `/c/[conversationId]` each dispatch the appropriate action (`CLEAR_ACTIVE` or `SET_ACTIVE`) on mount.
