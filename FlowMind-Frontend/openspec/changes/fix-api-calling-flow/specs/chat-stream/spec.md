## ADDED Requirements

### Requirement: Authenticated streaming chat completion
Feature: Chat Stream
Rule: All chat completion requests must include a valid Bearer token obtained from the NextAuth session.

#### Scenario: User sends a message and receives a streaming response
- **GIVEN** the user is authenticated with a valid session containing an `accessToken`
- **WHEN** the user sends a chat message
- **THEN** the request is sent to `POST /v1/chat/completions` with an `Authorization: Bearer <accessToken>` header
- **AND** the response is consumed as an SSE stream (`ReadableStream`) with token-by-token deltas
- **AND** each token delta is delivered via the `onToken` callback
- **AND** the `onDone` callback is invoked when the stream completes

#### Scenario: Token expires mid-stream
- **GIVEN** the user has an expired `accessToken` but a valid `refreshToken`
- **WHEN** the chat completion request returns HTTP 401
- **THEN** the `AuthApiClient` attempts a token refresh via `POST /v1/auth/refresh`
- **AND** if refresh succeeds, the original request is retried with the new token
- **AND** the user receives the streaming response without interruption
- **AND** if refresh fails, the user is redirected to `/auth/signin`

#### Scenario: User cancels a streaming response
- **GIVEN** a streaming response is in progress
- **WHEN** the user clicks stop
- **THEN** the `AbortController` is triggered
- **AND** the assistant message is removed if it has empty content
- **AND** the UI returns to idle state

#### Scenario: Chat error is surfaced to the user
- **GIVEN** a chat request fails with a non-401 HTTP error (e.g. 500, 429)
- **WHEN** the error occurs
- **THEN** an `ApiError` is caught by `ChatClient`
- **AND** the error message is surfaced via the `onError` callback
- **AND** the UI displays the error in a red banner

### Requirement: Non-streaming chat completion
Feature: Chat Non-Streaming
Rule: Non-streaming chat completions follow the same auth flow as streaming requests.

#### Scenario: User sends a message via non-streaming endpoint
- **GIVEN** the user is authenticated with a valid session
- **WHEN** the user requests a non-streaming chat completion
- **THEN** the request is sent to `POST /v1/chat/completions` with `stream: false` and an `Authorization: Bearer <accessToken>` header
- **AND** the full response content is returned as a single string

### Requirement: Auth route protection
Feature: Route Protection
Rule: Unauthenticated users must be redirected to the sign-in page.

#### Scenario: Unauthenticated user accesses the chat page
- **GIVEN** the user is not authenticated
- **WHEN** they navigate to `/` (the chat page)
- **THEN** `middleware.ts` checks the session
- **AND** since no session exists, the user is redirected to `/auth/signin`
