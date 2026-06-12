## ADDED Requirements

### Requirement: Route groups separate auth and chat layouts

Feature: RouteGroups
Rule: The Next.js App Router uses route groups `(auth)` and `(chat)` to scope layout providers, without affecting URL paths.

#### Scenario: Auth routes use auth layout
- **GIVEN** the route `(auth)/login/page.tsx` exists
- **WHEN** a user navigates to `/login`
- **THEN** the `(auth)/layout.tsx` wraps the login page
- **AND** the URL path is `/login` (not `/auth/login`)

#### Scenario: Chat routes use chat layout
- **GIVEN** the route `(chat)/c/[chatId]/page.tsx` exists
- **WHEN** a user navigates to `/c/abc123`
- **THEN** the `(chat)/layout.tsx` wraps the chat page
- **AND** ChatProvider is mounted within this layout

#### Scenario: Root layout wraps all route groups
- **GIVEN** the application has route groups (auth) and (chat)
- **WHEN** the app renders any page
- **THEN** the root `src/app/layout.tsx` is always the outermost layout
- **AND** AppProvider and AuthProvider are mounted in the root layout

#### Scenario: Route groups do not create URL segments
- **GIVEN** folders are named `(auth)` and `(chat)` with parentheses
- **WHEN** Next.js resolves the route
- **THEN** the parenthesized folder names are excluded from the URL path

### Requirement: Existing routes are migrated to route groups

Feature: RouteGroups
Rule: The current `app/auth/signin/` is moved to `(auth)/login/`, and the root `app/page.tsx` becomes `(chat)/page.tsx`.

#### Scenario: Sign-in page is accessible at /login
- **GIVEN** the page file is at `src/app/(auth)/login/page.tsx`
- **WHEN** a user navigates to `/login`
- **THEN** the sign-in page renders

#### Scenario: Chat landing page is at root
- **GIVEN** the page file is at `src/app/(chat)/page.tsx`
- **WHEN** a user navigates to `/`
- **THEN** the chat landing page renders with ChatProvider available
