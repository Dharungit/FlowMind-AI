## 1. Dependencies & Configuration

- [ ] 1.1 Install `next-auth`, `@tanstack/react-query`, `@tanstack/react-query-devtools` (dev)
- [ ] 1.2 Add environment variables to `.env.local`: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXT_PUBLIC_API_URL`
- [ ] 1.3 Update `next.config.ts` to allowlist Google OAuth domains if needed

## 2. NextAuth Configuration

- [ ] 2.1 Create `features/auth/api/auth.ts` with NextAuth config using Google provider
- [ ] 2.2 Implement `authorize` via Google provider — no custom credentials provider needed
- [ ] 2.3 Implement `jwt` callback: on initial sign-in, send Google `id_token` to `POST /v1/auth/google`, store `{ access_token, refresh_token, user }` in the JWT
- [ ] 2.4 Implement `jwt` callback refresh logic: when access token expires, call `POST /v1/auth/refresh` with stored `refresh_token`, update JWT
- [ ] 2.5 Implement `session` callback: expose `{ accessToken, user }` from the decoded JWT to the client
- [ ] 2.6 Create `app/api/auth/[...nextauth]/route.ts` as the NextAuth API route handler

## 3. Auth API Client

- [ ] 3.1 Create `features/auth/api/auth-client.ts` with a fetch wrapper that reads the access token from NextAuth
- [ ] 3.2 Implement `Authorization: Bearer <token>` header injection on every request
- [ ] 3.3 Implement 401 interceptor: queue concurrent requests, attempt token refresh, retry on success
- [ ] 3.4 Implement 401 interceptor fallback: sign out and redirect to `/auth/signin` on refresh failure
- [ ] 3.5 Create `features/auth/api/types.ts` with typed interfaces for `AuthResponse`, `RefreshResponse`, `UserProfile`, `GoogleAuthRequest`, `RefreshRequest`, `LogoutRequest`

## 4. TanStack Query Integration

- [ ] 4.1 Create `features/auth/components/providers.tsx` with `SessionProvider` (NextAuth) and `QueryClientProvider` (TanStack) wrappers
- [ ] 4.2 Wrap root layout in the combined providers
- [ ] 4.3 Create `features/auth/hooks/use-auth.ts` with `useLogin` mutation (Google sign-in trigger), `useLogout` mutation, and `useProfile` query (`GET /v1/auth/me`)
- [ ] 4.4 Create `features/auth/hooks/use-session.ts` — thin wrapper around NextAuth's `useSession` with strict types

## 5. Route Guards

- [ ] 5.1 Create `middleware.ts` at project root with `matcher` config to protect `/` and public `/auth/*`
- [ ] 5.2 Implement redirect logic: unauthenticated → `/auth/signin?callbackUrl=<current>`, authenticated on auth routes → `/`
- [ ] 5.3 Ensure middleware excludes `/_next/static/*`, `/favicon.ico`, `/api/auth/*`, and other public assets
- [ ] 5.4 Create `features/auth/components/auth-guard.tsx` — client-side wrapper that shows skeleton while session loads, redirects to sign-in when unauthenticated

## 6. Sign-In Page UI

- [ ] 6.1 Create `app/auth/signin/page.tsx` with centered card layout
- [ ] 6.2 Add FlowMind brand icon, "Sign in to FlowMind" heading, and "Sign in with Google" button using the existing `Button` component with Google SVG icon
- [ ] 6.3 Integrate `AnimatedGridPattern` as full-page background
- [ ] 6.4 Implement `callbackUrl` from query params (default to `/`)
- [ ] 6.5 Add loading state: spinner on button, disabled during OAuth redirect
- [ ] 6.6 Add error state: parse `?error=` query param, show inline error banner
- [ ] 6.7 Add `prefers-reduced-motion` support to disable grid animation

## 7. User Menu & Protected Layout

- [ ] 7.1 Create `features/auth/components/user-menu.tsx` — Avatar + display name + "Sign out" dropdown
- [ ] 7.2 Integrate user menu into the main layout (visible when authenticated)
- [ ] 7.3 Wire sign-out to call `POST /v1/auth/logout` then `signOut()` redirecting to `/auth/signin`

## 8. Verification

- [ ] 8.1 Run `openspec validate add-authentication-module --type change --strict` before archive
- [ ] 8.2 Run `npm run build` to verify no TypeScript errors
- [ ] 8.3 Test full flow: Google sign-in → token exchange → protected `/` → refresh → sign-out
