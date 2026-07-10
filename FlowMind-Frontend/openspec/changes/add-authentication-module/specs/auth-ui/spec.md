## ADDED Requirements

### Requirement: Sign-In Page
The `/auth/signin` page SHALL provide a Google sign-in button in a centered card layout with `@magicui/animated-grid-pattern` background.

#### Scenario: Sign-in page renders correctly
- **GIVEN** the user is not authenticated
- **WHEN** they navigate to `/auth/signin`
- **THEN** a centered card is displayed with the FlowMind brand icon
- **AND** a "Sign in to FlowMind" heading
- **AND** a "Sign in with Google" button
- **AND** the `AnimatedGridPattern` background is visible

#### Scenario: Sign-in button triggers Google OAuth
- **GIVEN** the user is on `/auth/signin`
- **WHEN** they click "Sign in with Google"
- **THEN** `signIn("google", { callbackUrl })` is called
- **AND** the button shows a loading spinner
- **AND** the button becomes disabled

#### Scenario: Sign-in page shows error from URL
- **GIVEN** the user is on `/auth/signin`
- **WHEN** the URL contains an `?error=` query parameter
- **THEN** an error banner is displayed below the button with the error message
- **AND** the error banner has appropriate styling for error state

#### Scenario: Sign-in page reads callbackUrl from query
- **GIVEN** the user is on `/auth/signin?callbackUrl=/chat`
- **WHEN** they click "Sign in with Google"
- **THEN** after successful sign-in, they are redirected to `/chat`

#### Scenario: Sign-in page respects reduced motion
- **GIVEN** the user has `prefers-reduced-motion: reduce` set
- **WHEN** they visit `/auth/signin`
- **THEN** the `AnimatedGridPattern` squares do not animate
- **AND** the static grid pattern is still visible

### Requirement: User Menu
Authenticated users SHALL see a user menu with their avatar and sign-out option.

#### Scenario: User menu shows authenticated user
- **GIVEN** the user is authenticated
- **WHEN** the user menu renders
- **THEN** the user's `avatarUrl` is displayed as an `Avatar` component
- **AND** the user's `displayName` is shown
- **AND** a "Sign out" option is available

#### Scenario: Sign out from user menu
- **GIVEN** the user is authenticated
- **WHEN** they click "Sign out" in the user menu
- **THEN** `signOut()` is called
- **AND** the user is redirected to `/auth/signin`
