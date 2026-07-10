## REMOVED Requirements

### Requirement: API client request shape
**Reason**: The old `/v1/chat/completions` endpoint has been replaced by `POST /v1/conversations/{id}/messages`. Message sending is now handled by `ConversationApiClient`.

**Migration**: Use `ConversationApiClient.sendMessage(conversationId, messages)` instead of `sendMessage(messages)`.

### Requirement: API client streaming
**Reason**: Streaming has been removed for now. The conversation messages endpoint returns a complete non-streaming response.

**Migration**: Use the non-streaming `sendMessage` method from `ConversationApiClient`. The `onToken` callback is no longer supported.

## ADDED Requirements

### Requirement: Conversation Messages Endpoint

The system SHALL send messages to the conversation messages endpoint.

#### Scenario: POST messages to conversation
- **GIVEN** a conversation exists
- **WHEN** sending a message
- **THEN** the client SHALL POST to `/v1/conversations/{conversation_id}/messages`
- **AND** the request body SHALL contain a `messages` array with `role` and `content` keys

#### Scenario: Response is a single message object
- **GIVEN** a message has been sent
- **WHEN** the API responds
- **THEN** the response SHALL be a `MessageResponse` object with `id`, `role`, `content`, `metadata`, and `created_at`

## MODIFIED Requirements

### Requirement: API client error handling

The API client SHALL surface network and server errors without crashing the UI.

#### Scenario: Network error is surfaced to caller
- **GIVEN** the backend is unreachable
- **WHEN** the conversation API client sends a request
- **THEN** the client throws or returns an error indicator
- **AND** the error message describes the connection failure

#### Scenario: HTTP error status is surfaced
- **GIVEN** the backend returns a non-2xx status code
- **WHEN** the conversation API client receives the response
- **THEN** the client throws or returns an error indicator
- **AND** the error includes the status code

### Requirement: Backend URL configuration

The backend URL SHALL be read from `NEXT_PUBLIC_BACKEND_URL` at runtime.

#### Scenario: Uses environment variable for backend URL
- **GIVEN** `NEXT_PUBLIC_BACKEND_URL` is set in the environment
- **WHEN** the conversation API client is initialized
- **THEN** it reads the URL from the shared `AuthApiClient` configuration

#### Scenario: Missing environment variable is handled
- **GIVEN** `NEXT_PUBLIC_BACKEND_URL` is not set
- **WHEN** the conversation API client is called
- **THEN** the client surfaces a configuration error
