## ADDED Requirements

### Requirement: Access Token Issuance
Feature: JWT Access Tokens
Rule: Access tokens must be JWTs signed with HS256 using the configured `JWT_SECRET`, with a 15-minute expiry. They must contain at minimum the `sub` (user ID) and `email` claims.

#### Scenario: Login returns valid access token
- **GIVEN** a successful Google token verification
- **WHEN** the server generates the response
- **THEN** the response includes an `access_token` field
- **AND** the access token is a valid HS256 JWT
- **AND** the JWT contains the user's ID as `sub` and email as `email`
- **AND** the JWT `exp` claim is 15 minutes from the current time

#### Scenario: Expired access token rejected
- **GIVEN** a protected route (`POST /v1/chat/completions`)
- **AND** a JWT access token that has passed its `exp` time
- **WHEN** the request includes `Authorization: Bearer <expired_token>`
- **THEN** the response returns HTTP 401
- **AND** the response body contains an `authentication_error` type with message indicating token expiry

#### Scenario: Tampered token rejected
- **GIVEN** a protected route
- **AND** a JWT that has been modified after signing (invalid signature)
- **WHEN** the request includes `Authorization: Bearer <tampered_token>`
- **THEN** the response returns HTTP 401
- **AND** the response body contains an `authentication_error` type

#### Scenario: Missing token rejected
- **GIVEN** a protected route
- **WHEN** the request has no `Authorization` header
- **THEN** the response returns HTTP 401

### Requirement: Refresh Token Issuance
Feature: JWT Refresh Tokens
Rule: Refresh tokens must be opaque strings (not JWTs), stored as SHA-256 hashes in the database, with a 7-day lifetime. Each refresh token is bound to a single user session.

#### Scenario: Valid refresh returns new token pair
- **GIVEN** a valid, non-expired refresh token
- **WHEN** the user sends `POST /v1/auth/refresh` with `{"refresh_token": "<valid_token>"}`
- **THEN** the response returns HTTP 200
- **AND** the response contains a new `access_token` and a new `refresh_token`
- **AND** the old refresh token is invalidated (cannot be used again)

#### Scenario: Reused refresh token rejected
- **GIVEN** a refresh token that was already used in a previous successful refresh
- **WHEN** the user sends `POST /v1/auth/refresh` with the same token again
- **THEN** the response returns HTTP 401
- **AND** the response body contains an `authentication_error` type

#### Scenario: Expired refresh token rejected
- **GIVEN** a refresh token that was issued more than 7 days ago
- **WHEN** the user sends `POST /v1/auth/refresh` with `{"refresh_token": "<expired_token>"}`
- **THEN** the response returns HTTP 401
- **AND** the response body contains an `authentication_error` type
