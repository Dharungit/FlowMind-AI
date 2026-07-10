## REMOVED Requirements

### Requirement: Mock Service Layer
**Reason**: The mock service has been replaced by the real `ConversationApiClient` which calls the backend REST API directly.

**Migration**: All callers should import from `@/features/conversations/api/conversation-client` instead of `@/features/conversations/conversations.mock`. The mock file can be deleted.

## MODIFIED Requirements

### Requirement: Create Conversation

The system SHALL create a new conversation via the REST API when the user sends their first message after starting a new chat.

#### Scenario: Conversation created on first message
- **GIVEN** the user has clicked "New Chat" and the message thread is empty
- **WHEN** the user sends their first message
- **THEN** a new conversation SHALL be created via `POST /v1/conversations`
- **AND** the conversation SHALL appear at the top of the sidebar list

#### Scenario: Conversation not created on empty submission
- **GIVEN** the user has clicked "New Chat" and the message thread is empty
- **WHEN** the user attempts to send an empty message
- **THEN** no conversation SHALL be created

### Requirement: List Conversations

The system SHALL fetch and display all conversations for the authenticated user via the REST API.

#### Scenario: Successful fetch
- **GIVEN** the user is authenticated and conversations exist
- **WHEN** the conversation list is requested
- **THEN** all conversations SHALL be returned ordered by `updated_at` descending
- **AND** each item SHALL include id, title, created_at, and updated_at

#### Scenario: Loading state
- **GIVEN** the user is authenticated
- **WHEN** the conversation list is being fetched
- **THEN** skeleton placeholders SHALL be displayed in place of conversation items
- **AND** the skeleton rows SHALL match the height and shape of conversation items

#### Scenario: Empty state
- **GIVEN** the user is authenticated but has no conversations
- **WHEN** the conversation list fetch completes with zero items
- **THEN** an empty state SHALL be displayed with an icon and instructive text

#### Scenario: Fetch error
- **GIVEN** the conversation list fetch fails
- **WHEN** the error occurs
- **THEN** an error message SHALL be displayed
- **AND** a retry action SHALL be available

### Requirement: Rename Conversation

The system SHALL allow the user to rename a conversation's title via the API.

#### Scenario: Successful rename
- **GIVEN** a conversation exists with a title
- **WHEN** the user submits a new non-empty title
- **THEN** `PUT /v1/conversations/{id}` SHALL be called
- **AND** the sidebar list SHALL reflect the new title
- **AND** the conversation's `updated_at` SHALL be refreshed

#### Scenario: Reject empty title
- **GIVEN** the user is editing a conversation title
- **WHEN** the user submits an empty string
- **THEN** the rename SHALL be rejected client-side
- **AND** the original title SHALL be preserved

#### Scenario: Reject unchanged title
- **GIVEN** the user is editing a conversation title
- **WHEN** the user submits a title identical to the current one
- **THEN** the rename SHALL be a no-op
- **AND** the input SHALL close without changes

### Requirement: Delete Conversation

The system SHALL allow the user to delete a conversation via the API after explicit confirmation.

#### Scenario: Successful delete
- **GIVEN** a conversation exists and the user confirms deletion
- **WHEN** the delete action executes
- **THEN** `DELETE /v1/conversations/{id}` SHALL be called
- **AND** the conversation SHALL be removed from the list
- **AND** the conversation SHALL no longer appear in the sidebar

#### Scenario: Delete active conversation
- **GIVEN** the conversation being deleted is the currently active conversation
- **WHEN** the delete action executes
- **THEN** the active conversation SHALL be cleared
- **AND** the chat area SHALL return to the empty state

#### Scenario: Delete non-active conversation
- **GIVEN** the conversation being deleted is not the currently active one
- **WHEN** the delete action executes
- **THEN** the conversation SHALL be removed from the list
- **AND** the active conversation and chat area SHALL remain unchanged
