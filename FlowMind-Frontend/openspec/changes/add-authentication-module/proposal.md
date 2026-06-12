## Why

FlowMind currently has no authentication layer. Users can access the app without any identity verification, making it impossible to support personalized experiences, user-specific data isolation, or backend API authorization. Adding a production-ready auth module unlocks user accounts, secure API access, and session management.

## What Changes

- Add `next-auth` (latest stable) as the auth framework with backend-issued JWT delegation
- Add `@tanstack/react-query` for server-state management and auth-aware API calls
- Create a sign-in screen with email/password form, error handling, and loading states
- Implement NextAuth configuration to delegate auth to backend APIs (validate credentials, issue JWTs)
- Build an API client layer with request/response interceptors that attach auth tokens and handle 401 refresh/redirect
- Add route guards via Next.js middleware (server-side) and client-side `AuthGuard` component
- Create a reusable `SignInForm` component and `ProtectedLayout` wrapper
- Establish a `features/auth/` folder structure with clean separation of concerns (api, components, hooks, types)
- Add error boundaries and toast notifications for auth-related failures
- Set up TanStack Query mutation hooks for login/logout/refresh with optimistic updates
- Type everything strictly with TypeScript — no `any` in auth code

## Capabilities

### New Capabilities
- `user-auth`: Core authentication — sign-in, sign-out, session retrieval, and NextAuth configuration delegating to backend auth APIs
- `auth-api-client`: HTTP client with automatic token injection, 401 interception, and refresh logic
- `route-guards`: Next.js middleware and client-side guard component for protecting routes based on auth state
- `auth-ui`: Sign-in screen and reusable auth UI components (forms, protected layout, error display)

### Modified Capabilities
<!-- No existing capabilities to modify — this is a new feature area -->

## Impact

- **New dependencies**: `next-auth`, `@tanstack/react-query`, `@tanstack/react-query-devtools` (dev)
- **New folder structure**: `features/auth/` with sub-directories for api, components, hooks, types, and utils
- **New routes**: `/auth/signin` (sign-in page), middleware-protected routes under configurable matcher
- **Environment variables**: `AUTH_SECRET`, `AUTH_API_URL` (or similar backend auth endpoint), `AUTH_TRUST_HOST`
- **Existing routes**: May need opt-out from auth middleware for public pages (home, etc.)
- **API layer**: Backend auth endpoints expected — POST `/auth/login`, POST `/auth/refresh`, POST `/auth/logout`, GET `/auth/me`
