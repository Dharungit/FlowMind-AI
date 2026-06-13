## ADDED Requirements

### Requirement: Auth state exposure

AuthContext MUST provide a unified useAuth() hook facade that wraps the existing React Query hooks (useCurrentUser, useLogin, useLogout) and the next-auth SessionProvider.

#### Scenario: Authenticated user available
- **GIVEN** a user is authenticated with a valid session
- **WHEN** a component calls useAuth()
- **THEN** it receives the user object with id, email, display_name, avatar_url
- **AND** isAuthenticated is true
- **AND** isLoading is false

#### Scenario: Unauthenticated user
- **GIVEN** no valid session exists
- **WHEN** a component calls useAuth()
- **THEN** user is null
- **AND** isAuthenticated is false
- **AND** isLoading is false

#### Scenario: Session loading
- **GIVEN** the session status is "loading"
- **WHEN** a component calls useAuth()
- **THEN** isLoading is true
- **AND** user is null
- **AND** isAuthenticated is false

#### Scenario: Login action
- **GIVEN** the user is not authenticated
- **WHEN** useAuth().login() is called
- **THEN** the Google OAuth sign-in flow is initiated via next-auth's signIn()

#### Scenario: Logout action
- **GIVEN** the user is authenticated
- **WHEN** useAuth().logout() is called
- **THEN** the backend logout endpoint is called
- **AND** the React Query cache is cleared
- **AND** the next-auth session is invalidated

### Requirement: AuthContext server state delegation

AuthContext MUST be a thin wrapper that does not duplicate user state. React Query MUST remain the source of truth for server data.

#### Scenario: React Query refetch updates auth context
- **GIVEN** the user profile changes on the backend
- **WHEN** React Query refetches the profile data (e.g., on window refocus)
- **THEN** components using useAuth() receive the updated user object
