## ADDED Requirements

### Requirement: Google OAuth Sign-In
Feature: User Authentication
Rule: Users sign in with their Google account. The Google ID token is exchanged for a backend-issued JWT via NextAuth callbacks.

#### Scenario: Successful Google sign-in
- **GIVEN** the user is not authenticated
- **WHEN** they click "Sign in with Google"
- **THEN** Google OAuth consent screen appears
- **AND** after consent, the browser redirects to the NextAuth callback
- **AND** the `jwt` callback sends the Google `id_token` to `POST /v1/auth/google`
- **AND** the backend returns `{ access_token, refresh_token, user }`
- **THEN** the tokens are stored in the NextAuth encrypted JWT session cookie
- **AND** the user is redirected to the callback URL (default `/`)

#### Scenario: Google sign-in with backend error
- **GIVEN** the user is not authenticated
- **WHEN** the OAuth callback sends the `id_token` to `POST /v1/auth/google`
- **AND** the backend returns a 4xx or 5xx error
- **THEN** NextAuth raises an error
- **AND** the user sees an error message on the sign-in page
- **AND** the user remains unauthenticated

#### Scenario: Google sign-in with network failure
- **GIVEN** the user is not authenticated
- **WHEN** the OAuth callback cannot reach `POST /v1/auth/google` due to network failure
- **THEN** NextAuth retries with exponential backoff
- **AND** if all retries fail, the user sees a network error on the sign-in page

### Requirement: Session Retrieval
Feature: Session Management
Rule: Authenticated users can retrieve their session data including access token and user profile.

#### Scenario: Retrieve session when authenticated
- **GIVEN** the user has a valid NextAuth session cookie
- **WHEN** `useSession()` is called in a client component
- **THEN** the session contains `{ accessToken, user: { id, email, displayName, avatarUrl } }`

#### Scenario: Retrieve session when not authenticated
- **GIVEN** the user has no valid NextAuth session cookie
- **WHEN** `useSession()` is called in a client component
- **THEN** the session is `null`
- **AND** `status` is `"unauthenticated"`

### Requirement: Token Refresh
Feature: Session Management
Rule: When the access token expires, NextAuth's `jwt` callback refreshes it using the stored refresh token.

#### Scenario: Automatic token refresh
- **GIVEN** the user has an expired access token and a valid refresh token in the JWT session
- **WHEN** the `jwt` callback runs on next request
- **AND** the callback detects the access token is expired
- **THEN** it sends the `refresh_token` to `POST /v1/auth/refresh`
- **AND** the backend returns `{ access_token, refresh_token }`
- **THEN** the new tokens replace the old ones in the JWT session cookie

#### Scenario: Token refresh failure
- **GIVEN** the user has an expired access token and an expired/invalid refresh token
- **WHEN** the `jwt` callback attempts to refresh via `POST /v1/auth/refresh`
- **AND** the backend returns a 401
- **THEN** the user is signed out
- **AND** the session is cleared

### Requirement: Sign Out
Feature: Session Management
Rule: Authenticated users can sign out, which revokes tokens on the backend and clears the local session.

#### Scenario: Successful sign-out
- **GIVEN** the user is authenticated
- **WHEN** they click "Sign out"
- **THEN** `POST /v1/auth/logout` is called with the current `refresh_token`
- **AND** the NextAuth session cookie is cleared
- **AND** the user is redirected to `/auth/signin`

#### Scenario: Sign-out with backend error
- **GIVEN** the user is authenticated
- **WHEN** they click "Sign out"
- **AND** `POST /v1/auth/logout` fails with a 5xx error
- **THEN** the local NextAuth session cookie is still cleared
- **AND** the user is redirected to `/auth/signin`
- **AND** a quiet console warning is logged about the backend failure
