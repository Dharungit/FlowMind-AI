## ADDED Requirements

### Requirement: Current User Retrieval
Feature: User Management
Rule: The `GET /v1/auth/me` endpoint must return the authenticated user's profile from the JWT access token.

#### Scenario: Valid token returns user profile
- **GIVEN** a valid JWT access token for an existing user
- **WHEN** the user sends `GET /v1/auth/me` with `Authorization: Bearer <valid_token>`
- **THEN** the response returns HTTP 200
- **AND** the response body contains `id`, `email`, `display_name`, and `avatar_url` fields

#### Scenario: Invalid token returns 401
- **GIVEN** any of: missing, expired, tampered, or malformed JWT access token
- **WHEN** the user sends `GET /v1/auth/me` with that token
- **THEN** the response returns HTTP 401
- **AND** the response body contains an `authentication_error` type
