## ADDED Requirements

### Requirement: API client sends correct request shape
Feature: Backend Integration
Rule: The chat API client sends POST requests with the defined payload format to the configured backend URL

#### Scenario: Sends a chat completion request
- **GIVEN** a user message has been submitted
- **WHEN** the chat API client sends the request
- **THEN** it POSTs to the URL specified by `NEXT_PUBLIC_BACKEND_URL`
- **AND** the request body contains `model`, `messages`, `stream`, and `temperature` fields
- **AND** the `messages` array contains objects with `role` and `content` keys
- **AND** the `Content-Type` header is `application/json`

#### Scenario: Request includes conversation history
- **GIVEN** the conversation has multiple messages
- **WHEN** the chat API client sends a new request
- **THEN** the `messages` array includes all prior user and assistant messages in order

#### Scenario: Request body omits optional fields when not provided
- **GIVEN** no temperature override is specified
- **WHEN** the chat API client sends the request
- **THEN** a default temperature of 0.7 is used

### Requirement: API client handles streaming responses
Feature: Backend Integration
Rule: The API client consumes a ReadableStream response and yields tokens incrementally

#### Scenario: Streams tokens from a ReadableStream response
- **GIVEN** the request was sent with `stream: true`
- **WHEN** the backend responds with a ReadableStream
- **THEN** the client reads the stream chunk by chunk
- **AND** each chunk is yielded as a token to the caller

#### Scenario: Stream can be cancelled mid-flight
- **GIVEN** a streaming response is being consumed
- **WHEN** the caller aborts the request
- **THEN** the stream reading stops immediately
- **AND** no further tokens are yielded

#### Scenario: Non-streaming response returns full message
- **GIVEN** the request was sent with `stream: false`
- **WHEN** the backend responds
- **THEN** the client returns the complete message content at once

### Requirement: API client handles errors gracefully
Feature: Backend Integration
Rule: The API client surfaces network and server errors without crashing the UI

#### Scenario: Network error is surfaced to caller
- **GIVEN** the backend is unreachable
- **WHEN** the chat API client sends a request
- **THEN** the client throws or returns an error indicator
- **AND** the error message describes the connection failure

#### Scenario: HTTP error status is surfaced
- **GIVEN** the backend returns a non-2xx status code
- **WHEN** the chat API client receives the response
- **THEN** the client throws or returns an error indicator
- **AND** the error includes the status code

### Requirement: Backend URL is configurable via environment
Feature: Backend Integration
Rule: The backend URL is read from `NEXT_PUBLIC_BACKEND_URL` at runtime

#### Scenario: Uses environment variable for backend URL
- **GIVEN** `NEXT_PUBLIC_BACKEND_URL` is set in the environment
- **WHEN** the chat API client is initialized
- **THEN** it reads the URL from `NEXT_PUBLIC_BACKEND_URL`

#### Scenario: Missing environment variable is handled
- **GIVEN** `NEXT_PUBLIC_BACKEND_URL` is not set
- **WHEN** the chat API client is called
- **THEN** the client surfaces a configuration error
