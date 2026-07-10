## ADDED Requirements

### Requirement: Session Creation
Feature: Session Management
Rule: Each successful login or refresh must create a session record containing the hashed refresh token, user ID, IP address, device info, and expiry timestamp.

#### Scenario: Login creates session record
- **GIVEN** a successful Google token verification
- **WHEN** the server issues the response
- **THEN** a session record is created in the database
- **AND** the session record contains the user ID, SHA-256 hash of the refresh token, and expiry
- **AND** the session record has `created_at` and `expires_at` timestamps

#### Scenario: Refresh creates new session record
- **GIVEN** a successful refresh with rotation
- **WHEN** the server issues the new token pair
- **THEN** the old session record is marked as invalidated
- **AND** a new session record is created with the new refresh token hash

### Requirement: Session Logout
Feature: Session Management
Rule: Users must be able to invalidate a single session or all sessions.

#### Scenario: Single session logout invalidates specific session
- **GIVEN** an active session with a valid refresh token
- **WHEN** the user sends `POST /v1/auth/logout` with `{"refresh_token": "<valid_token>"}`
- **THEN** the corresponding session record is marked as invalidated
- **AND** the response returns HTTP 200
- **AND** the refresh token can no longer be used for refresh

#### Scenario: All sessions logout invalidates all user sessions
- **GIVEN** a user with multiple active sessions
- **WHEN** the user sends `POST /v1/auth/logout` with `{"all": true}` and a valid access token
- **THEN** all session records for that user are marked as invalidated
- **AND** the response returns HTTP 200
