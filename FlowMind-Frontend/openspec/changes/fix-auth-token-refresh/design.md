## Context

The app uses NextAuth with JWT session strategy. Access tokens expire after 55 minutes, refresh tokens are rotated on each refresh. There are currently TWO competing refresh mechanisms:

1. **JWT callback in `auth.ts`** (server-side): On every `getSession()` call, if `expiresAt` is past and a `refreshToken` exists, it calls `POST /v1/auth/refresh` and updates the JWT cookie with the new tokens.

2. **`tryRefresh()` in `auth-client.ts`** (client-side): On 401 response, it calls `POST /v1/auth/refresh`, then `POST /api/auth/session` to try updating the NextAuth session.

The client-side mechanism is broken because:
- `POST /api/auth/session` doesn't rewrite the JWT cookie — it only updates the in-memory session object, so the next `getSession()` call still gets stale tokens from the cookie
- No concurrency guard — multiple simultaneous 401s trigger concurrent refresh calls with the same (soon-to-be-rotated) refresh token
- The `stream()` method mutates shared `headers` reference after `options` is constructed, making retry behavior fragile

## Goals / Non-Goals

**Goals:**
- All API calls transparently use valid access tokens
- Token refresh happens before expiry, not reactively on 401
- Multiple concurrent requests that need refresh are serialized (single refresh, all retry)
- Stream and regular requests have consistent refresh behavior

**Non-Goals:**
- Changing the backend refresh API contract
- Changing the JWT callback refresh logic (it works correctly)
- Adding a new HTTP client library

## Decisions

### Decision 1: Remove client-side `tryRefresh()`, rely on JWT callback refresh

**Context:** The JWT callback in `auth.ts` already handles token refresh correctly. Every `getSession()` call triggers the JWT callback, which checks `expiresAt` and refreshes if needed, then writes the updated JWT back to the cookie.

**Rationale:** The client-side `tryRefresh()` duplicates this logic, uses an incorrect session update mechanism, and creates race conditions. Letting the JWT callback be the single source of truth for token refresh eliminates these issues.

**Consequence:** Before any API request, call `getSession()` to trigger the JWT callback refresh if needed. On 401, call `getSession()` again (which triggers another refresh attempt via the JWT callback) instead of calling the refresh endpoint directly.

### Decision 2: Proactive token refresh via expiry check

**Context:** Currently, refresh only happens reactively on 401. If the JWT callback fails to refresh (e.g., network blip), the session gets `error: "RefreshAccessTokenError"` and the user is logged out.

**Rationale:** By proactively refreshing before expiry (at ~50 minutes for a 55-minute token), we reduce the chance of hitting a 401 and ensure the refresh happens in a controlled manner.

**Implementation:** In `AuthApiClient`, before making any request, check `session.expiresAt`. If it's within 5 minutes of expiring (or already expired), call `getSession()` to trigger the JWT callback refresh. If `session.error` is set, proactively sign out rather than making a doomed request.

### Decision 3: Refresh lock to serialize concurrent 401s

**Context:** If 5 requests fire simultaneously and all have expired tokens, they'll all hit 401, and without a lock they'll all try to refresh concurrently.

**Rationale:** A simple promise-based lock ensures only one refresh attempt happens at a time. All concurrent requests that need refresh wait for the same refresh promise, then retry with the updated session.

**Implementation:** A class-level `refreshPromise: Promise<boolean> | null` field. When a 401 is encountered and no refresh is in progress, start one and store the promise. Subsequent 401s await the same promise. After resolution, clear it.

### Decision 4: Consistent retry pattern for `request()` and `stream()`

**Context:** `request()` and `stream()` have duplicated 401 retry logic with slightly different patterns (`stream()` mutates shared references).

**Rationale:** Extract a shared `executeWithRetry` helper that handles the common pattern: fetch → on 401 → acquire refresh lock → await refresh → retry with new session token.

## Architecture

```
┌─────────────────┐     getSession()      ┌──────────────────┐
│  AuthApiClient   │ ──────────────────▶  │  NextAuth JWT     │
│  (request/stream)│                      │  Callback (auth.ts)│
│                  │ ◀────────────────── │                  │
│  - proactive     │   session with fresh │  - checks expiresAt│
│    expiry check  │   tokens             │  - refreshes via   │
│  - executeWithRetry│                    │    POST /v1/auth/  │
│  - refresh lock   │                    │    refresh         │
└─────────────────┘                      │  - writes JWT      │
        │                                │    cookie          │
        │ 401 retry                       └──────────────────┘
        ▼
┌─────────────────┐
│  Backend API     │
│  /v1/*           │
└─────────────────┘
```

**Flow (normal):**
1. `apiClient.get()` is called
2. Check `session.expiresAt` — if nearing expiry, call `getSession()` (triggers JWT callback refresh)
3. Attach `Authorization: Bearer <accessToken>` from session
4. Execute fetch

**Flow (401 handling):**
1. Fetch returns 401
2. If refresh lock exists, await it (another request is already refreshing)
3. If no refresh lock, acquire it and call `getSession()` (triggers JWT callback refresh)
4. If refresh succeeded (no session.error), release lock and retry with new token
5. If refresh failed, release lock and call `signOut()`

## Sequence (401 retry with concurrency)

```
Request A ──▶ fetch ──▶ 401 ──▶ acquire lock ──▶ getSession() ──▶ retry ──▶ 200
                                    │
Request B ──▶ fetch ──▶ 401 ──▶ await lock ───┘                ──▶ retry ──▶ 200
                                    │
Request C ──▶ fetch ──▶ 401 ──▶ await lock ───┘                ──▶ retry ──▶ 200
```

## Risks / Trade-offs

- **[Risk] JWT callback refresh has no retry logic** → Mitigation: the 401 retry in `executeWithRetry` acts as a second chance. If the first `getSession()` refresh fails (network issue), the 401 triggers another `getSession()` which retries the refresh.
- **[Risk] `getSession()` is async and makes a network call to the NextAuth endpoint** → Mitigation: NextAuth reads the JWT from a cookie and processes it server-side; the overhead is minimal (~1 HTTP round trip to the origin, not the backend).
- **[Risk] Refreshing proactively means extra `getSession()` calls** → Mitigation: only call `getSession()` if `expiresAt` is within 5 minutes of expiry; most requests will skip this check.

## Open Questions

- Should the proactive refresh happen in `AuthApiClient` or be elevated to a background interval (e.g., a `setInterval` that refreshes before expiry)? The former is simpler; the latter provides more consistent behavior.
- Should the `session.error === "RefreshAccessTokenError"` case trigger an immediate redirect to login from `AuthApiClient`, or should that remain the responsibility of the auth guard component?
