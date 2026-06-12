## ADDED Requirements

### Requirement: Authenticated API Requests
Feature: Auth API Client
Rule: All API requests to the backend are automatically authenticated with the current access token.

#### Scenario: Attach access token to request
- **GIVEN** the user is authenticated with a valid access token
- **WHEN** any API request is made using the auth client
- **THEN** the `Authorization: Bearer <access_token>` header is set
- **AND** the request is sent to the backend

#### Scenario: Request without authentication
- **GIVEN** the user is not authenticated
- **WHEN** any API request is made using the auth client
- **THEN** the request is sent without an `Authorization` header

### Requirement: Automatic Token Refresh on 401
Feature: Auth API Client
Rule: When a request returns 401, the client automatically attempts token refresh and retries the request.

#### Scenario: Successful token refresh and retry
- **GIVEN** the user has an expired access token and a valid refresh token
- **WHEN** a request returns 401
- **THEN** the client calls `POST /v1/auth/refresh` with the stored `refresh_token`
- **AND** the backend returns a new `{ access_token, refresh_token }`
- **THEN** the original request is retried with the new access token
- **AND** the caller receives the successful response

#### Scenario: Token refresh failure forces sign-out
- **GIVEN** the user has an expired access token and an expired refresh token
- **WHEN** a request returns 401
- **THEN** the client attempts token refresh
- **AND** the backend returns a 401 on refresh
- **THEN** the user is signed out
- **AND** the user is redirected to `/auth/signin`
- **AND** the original request is rejected with an auth error

#### Scenario: Concurrent 401 handling
- **GIVEN** the user has an expired access token
- **WHEN** multiple requests return 401 concurrently
- **THEN** only one token refresh request is made
- **AND** all pending requests are queued until the refresh completes
- **THEN** all queued requests are retried with the new token
