## ADDED Requirements

### Requirement: Middleware Route Protection
Next.js proxy SHALL protect the root `/` route and redirect unauthenticated users to `/auth/signin`.

#### Scenario: Unauthenticated user visits protected page
- **GIVEN** the user is not authenticated
- **WHEN** they visit `/`
- **THEN** the middleware detects no valid session
- **AND** redirects to `/auth/signin?callbackUrl=/`

#### Scenario: Authenticated user visits protected page
- **GIVEN** the user is authenticated with a valid session
- **WHEN** they visit `/`
- **THEN** the middleware allows the request through
- **AND** the page renders normally

#### Scenario: Authenticated user visits sign-in page
- **GIVEN** the user is authenticated with a valid session
- **WHEN** they visit `/auth/signin`
- **THEN** the middleware redirects them to `/`

#### Scenario: Unauthenticated user visits public page
- **GIVEN** the user is not authenticated
- **WHEN** they visit `/auth/signin`
- **THEN** the middleware allows the request through
- **AND** the sign-in page renders normally

#### Scenario: Middleware excludes static assets
- **GIVEN** an unauthenticated user
- **WHEN** they request a static asset (`/_next/static/*`, `/favicon.ico`, `/public/*`)
- **THEN** the middleware allows the request through without checking auth

### Requirement: Client-Side AuthGuard
A reusable `AuthGuard` component SHALL wrap protected UI sections and show a loading state while session is resolving.

#### Scenario: AuthGuard shows loading while session resolves
- **GIVEN** a page wrapped in `AuthGuard`
- **WHEN** the session is still loading (`status === "loading"`)
- **THEN** a loading spinner or skeleton is displayed
- **AND** the protected content is not rendered

#### Scenario: AuthGuard renders children when authenticated
- **GIVEN** a page wrapped in `AuthGuard`
- **WHEN** the session resolves with `status === "authenticated"`
- **THEN** the child content is rendered

#### Scenario: AuthGuard redirects when unauthenticated
- **GIVEN** a page wrapped in `AuthGuard`
- **WHEN** the session resolves with `status === "unauthenticated"`
- **THEN** the user is redirected to `/auth/signin`
