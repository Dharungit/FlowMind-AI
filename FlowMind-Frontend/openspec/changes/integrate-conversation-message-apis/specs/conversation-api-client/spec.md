## ADDED Requirements

### Requirement: Conversation API Client Class

The system SHALL provide a `ConversationApiClient` class that wraps the shared `AuthApiClient` for all conversation and message endpoints.

#### Scenario: Client uses shared AuthApiClient
- **GIVEN** the application has an `AuthApiClient` instance
- **WHEN** `ConversationApiClient` is instantiated
- **THEN** it SHALL reuse the existing `AuthApiClient` for all HTTP requests
- **AND** it SHALL NOT implement its own auth token handling

#### Scenario: Base URL derived from AuthApiClient
- **GIVEN** `AuthApiClient` is configured with a backend URL
- **WHEN** conversation API calls are made
- **THEN** they SHALL use the same base URL as `AuthApiClient`

---

### Requirement: List Conversations

The system SHALL fetch all conversations for the authenticated user.

#### Scenario: Successful list fetch
- **GIVEN** the user is authenticated and conversations exist
- **WHEN** `GET /v1/conversations` is called
- **THEN** an array of conversation objects SHALL be returned
- **AND** each object SHALL contain `id`, `title`, `created_at`, and `updated_at`

#### Scenario: Empty list
- **GIVEN** the user is authenticated but has no conversations
- **WHEN** `GET /v1/conversations` is called
- **THEN** an empty array SHALL be returned

#### Scenario: Returns typed ConversationResponse array
- **GIVEN** the API returns a list of conversations
- **WHEN** the response is parsed
- **THEN** each item SHALL conform to the `ConversationResponse` type

---

### Requirement: Create Conversation

The system SHALL create a new conversation.

#### Scenario: Successful creation
- **GIVEN** the user wants to start a new conversation
- **WHEN** `POST /v1/conversations` is called with a title
- **THEN** a `ConversationResponse` SHALL be returned with HTTP 201
- **AND** the response SHALL contain `id`, `title`, `created_at`, and `updated_at`

#### Scenario: Default title when omitted
- **GIVEN** the user wants to start a new conversation
- **WHEN** `POST /v1/conversations` is called without a title
- **THEN** the backend SHALL create the conversation with title "New Conversation"
- **AND** a `ConversationResponse` SHALL be returned

---

### Requirement: Get Single Conversation

The system SHALL fetch a single conversation with all its messages.

#### Scenario: Successful fetch
- **GIVEN** a conversation exists
- **WHEN** `GET /v1/conversations/{id}` is called
- **THEN** a `ConversationDetailResponse` SHALL be returned
- **AND** the response SHALL include `id`, `title`, `created_at`, `updated_at`
- **AND** the response SHALL include a `messages` array containing `MessageResponse` objects

#### Scenario: Conversation not found
- **GIVEN** a conversation does not exist
- **WHEN** `GET /v1/conversations/{id}` is called
- **THEN** the client SHALL receive a 404 error

---

### Requirement: Rename Conversation

The system SHALL update a conversation's title.

#### Scenario: Successful rename
- **GIVEN** a conversation exists
- **WHEN** `PUT /v1/conversations/{id}` is called with a new title
- **THEN** the updated `ConversationResponse` SHALL be returned
- **AND** the `updated_at` field SHALL be refreshed

---

### Requirement: Delete Conversation

The system SHALL delete a conversation.

#### Scenario: Successful delete
- **GIVEN** a conversation exists
- **WHEN** `DELETE /v1/conversations/{id}` is called
- **THEN** HTTP 204 No Content SHALL be returned

---

### Requirement: Delete Message

The system SHALL delete a single message.

#### Scenario: Successful message deletion
- **GIVEN** a message exists within a conversation
- **WHEN** `DELETE /v1/messages/{message_id}` is called
- **THEN** HTTP 204 No Content SHALL be returned

---

### Requirement: API Error Handling

The `ConversationApiClient` SHALL surface API errors consistently.

#### Scenario: Network error is surfaced
- **GIVEN** the backend is unreachable
- **WHEN** any API call is made
- **THEN** the client SHALL throw an error
- **AND** the error SHALL describe the connection failure

#### Scenario: HTTP error status is surfaced
- **GIVEN** the backend returns a non-2xx status code
- **WHEN** any API call is made
- **THEN** the client SHALL throw an `ApiError`
- **AND** the error SHALL include the HTTP status code
