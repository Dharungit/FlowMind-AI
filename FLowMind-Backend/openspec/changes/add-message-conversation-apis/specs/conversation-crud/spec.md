## ADDED Requirements

### Requirement: Create conversation
Feature: Conversation CRUD
Rule: Authenticated users can create new conversations

#### Scenario: User creates a conversation with a title
- **GIVEN** a registered user is authenticated via a valid JWT access token
- **WHEN** they POST to `/v1/conversations` with `{"title": "My Chat"}`
- **THEN** the response status is `201 Created`
- **AND** the response body contains an `id`, `title` of `"My Chat"`, and a `created_at` timestamp

#### Scenario: User creates a conversation without a title
- **GIVEN** a registered user is authenticated via a valid JWT access token
- **WHEN** they POST to `/v1/conversations` with an empty body
- **THEN** the response status is `201 Created`
- **AND** the response body contains a `title` that defaults to `"New Conversation"`

#### Scenario: Unauthenticated user is rejected
- **GIVEN** no valid JWT access token is provided
- **WHEN** they POST to `/v1/conversations`
- **THEN** the response status is `401 Unauthorized`

### Requirement: List conversations
Rule: Authenticated users can list their own conversations, ordered by most recent

#### Scenario: User lists their conversations
- **GIVEN** the user has 3 existing conversations
- **WHEN** they GET `/v1/conversations`
- **THEN** the response status is `200 OK`
- **AND** the response body contains an array of 3 conversation objects
- **AND** each object has `id`, `title`, `created_at`, and `updated_at` fields

#### Scenario: User with no conversations gets empty list
- **GIVEN** the user has no conversations
- **WHEN** they GET `/v1/conversations`
- **THEN** the response status is `200 OK`
- **AND** the response body contains an empty array

#### Scenario: User cannot see another user's conversations
- **GIVEN** user A has 2 conversations and user B has 1 conversation
- **WHEN** user A GETs `/v1/conversations`
- **THEN** the response body contains exactly 2 conversations
- **AND** both belong to user A

### Requirement: Get conversation by ID
Rule: Authenticated users can retrieve a specific conversation by ID

#### Scenario: User retrieves their own conversation
- **GIVEN** the user has a conversation with known ID
- **WHEN** they GET `/v1/conversations/{id}`
- **THEN** the response status is `200 OK`
- **AND** the response body contains the conversation with its messages array

#### Scenario: User retrieves another user's conversation
- **GIVEN** a conversation belongs to another user
- **WHEN** they GET `/v1/conversations/{id}`
- **THEN** the response status is `404 Not Found`

#### Scenario: User retrieves a non-existent conversation
- **GIVEN** no conversation exists with the given ID
- **WHEN** they GET `/v1/conversations/{id}`
- **THEN** the response status is `404 Not Found`

### Requirement: Update conversation title
Rule: Authenticated users can update the title of their own conversations

#### Scenario: User updates the title
- **GIVEN** the user has a conversation titled "Old Title"
- **WHEN** they PUT `/v1/conversations/{id}` with `{"title": "New Title"}`
- **THEN** the response status is `200 OK`
- **AND** the `title` field in the response is `"New Title"`

#### Scenario: User updates another user's conversation title
- **GIVEN** a conversation belongs to another user and has title "Original"
- **WHEN** they PUT `/v1/conversations/{id}` with `{"title": "Hacked"}`
- **THEN** the response status is `404 Not Found`

### Requirement: Delete conversation
Rule: Authenticated users can delete their own conversations

#### Scenario: User deletes their conversation
- **GIVEN** the user has a conversation with 5 messages
- **WHEN** they DELETE `/v1/conversations/{id}`
- **THEN** the response status is `204 No Content`
- **AND** the conversation and all its messages are removed from the database

#### Scenario: User deletes another user's conversation
- **GIVEN** a conversation belongs to another user
- **WHEN** they DELETE `/v1/conversations/{id}`
- **THEN** the response status is `404 Not Found`
