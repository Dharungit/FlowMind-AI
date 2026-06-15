## ADDED Requirements

### Requirement: Delete active conversation redirects to new chat
When the user deletes the conversation they are currently viewing, they must be navigated to the new chat page.

#### Scenario: Delete active conversation
- **GIVEN** the user is viewing conversation "abc123" at URL `/c/abc123`
- **WHEN** the user deletes conversation "abc123" from the sidebar
- **THEN** the URL must change to `/`
- **AND** the UI must show the new chat empty state with the input area

#### Scenario: Delete inactive conversation
- **GIVEN** the user is viewing conversation "abc123" at URL `/c/abc123`
- **WHEN** the user deletes conversation "xyz789" from the sidebar
- **THEN** the URL must remain at `/c/abc123`
- **AND** the current conversation "abc123" must remain fully visible
- **AND** conversation "xyz789" must be removed from the sidebar list
