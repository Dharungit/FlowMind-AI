## ADDED Requirements

### Requirement: Proactive token refresh before expiry
Feature: auth-token-lifecycle
Rule: The client should detect an expiring token and refresh it before the backend rejects it.

#### Scenario: Token refreshed before expiry threshold
- **GIVEN** the session has an `expiresAt` value within 5 minutes of `Date.now()`
- **WHEN** any API request is initiated
- **THEN** the client calls `getSession()` to trigger the JWT callback refresh
- **AND** the request proceeds with a valid access token

#### Scenario: No refresh needed when token is fresh
- **GIVEN** the session has an `expiresAt` value more than 5 minutes from `Date.now()`
- **WHEN** any API request is initiated
- **THEN** the client uses the existing access token without triggering a refresh

### Requirement: Retry on 401 with single refresh
Feature: auth-token-lifecycle
Rule: When a request receives a 401, exactly one refresh attempt is made before retrying, even when multiple requests fail simultaneously.

#### Scenario: Single request retries after 401
- **GIVEN** a valid refresh token exists in the session
- **WHEN** a request returns a 401 status
- **THEN** the client acquires a refresh lock
- **AND** calls `getSession()` to refresh the token via the JWT callback
- **AND** retries the original request with the new access token
- **AND** the retry succeeds

#### Scenario: Multiple concurrent 401s share one refresh
- **GIVEN** multiple requests are in-flight simultaneously
- **WHEN** all requests receive a 401 status
- **THEN** only one refresh attempt is made via the JWT callback
- **AND** all requests retry with the refreshed token
- **AND** all retries succeed

#### Scenario: Refresh failure triggers sign out
- **GIVEN** the JWT callback has set `error: "RefreshAccessTokenError"` on the session
- **WHEN** a request receives a 401 and attempts refresh
- **THEN** the client calls `signOut({ callbackUrl: "/login" })`
- **AND** throws an `ApiError(401, "Session expired")`

### Requirement: Consistent retry across request and stream methods
Feature: auth-token-lifecycle
Rule: Both regular requests and streaming requests must use the same refresh and retry mechanism.

#### Scenario: Streaming request retries after 401
- **GIVEN** a streaming request uses the `stream()` method
- **WHEN** it receives a 401 status
- **THEN** the same refresh and retry logic applies as for regular requests
- **AND** the retried stream request returns a valid response

#### Scenario: Stream request uses refreshed authorization header
- **GIVEN** a streaming request is retried after a 401
- **WHEN** the retried request is sent
- **THEN** the `Authorization` header contains the new access token from the refreshed session
