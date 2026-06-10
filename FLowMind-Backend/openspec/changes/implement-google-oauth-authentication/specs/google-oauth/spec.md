## ADDED Requirements

### Requirement: Google ID Token Verification
Feature: Google OAuth
Rule: The backend must accept a Google ID token from `POST /v1/auth/google`, verify it using the `google-auth` library, extract user identity from the verified payload, and auto-create or update the corresponding user record.

#### Scenario: Valid token creates new user
- **GIVEN** a first-time user with a valid Google ID token signed by Google
- **WHEN** the user sends `POST /v1/auth/google` with `{"id_token": "<valid_token>"}`
- **THEN** the response returns HTTP 200
- **AND** the response body contains `access_token`, `refresh_token`, and `user` fields
- **AND** a new user record is created in the database with the Google profile information

#### Scenario: Valid token updates existing user
- **GIVEN** an existing user with `google_sub` in the database
- **AND** the user's Google display name or avatar has changed
- **WHEN** the user sends `POST /v1/auth/google` with a valid current ID token
- **THEN** the response returns HTTP 200
- **AND** the existing user record is updated with the new display name and avatar URL

#### Scenario: Invalid token rejected
- **GIVEN** a token that is not a valid Google ID token (e.g., arbitrary string, token from another provider)
- **WHEN** the user sends `POST /v1/auth/google` with `{"id_token": "<invalid_token>"}`
- **THEN** the response returns HTTP 401
- **AND** the response body contains an `authentication_error` type

#### Scenario: Expired token rejected
- **GIVEN** an expired Google ID token
- **WHEN** the user sends `POST /v1/auth/google` with `{"id_token": "<expired_token>"}`
- **THEN** the response returns HTTP 401
- **AND** the response body contains an `authentication_error` type

#### Scenario: Wrong audience rejected
- **GIVEN** a valid Google ID token issued for a different Google Client ID
- **WHEN** the user sends `POST /v1/auth/google` with `{"id_token": "<wrong_audience_token>"}`
- **THEN** the response returns HTTP 401
- **AND** the response body contains an `authentication_error` type
