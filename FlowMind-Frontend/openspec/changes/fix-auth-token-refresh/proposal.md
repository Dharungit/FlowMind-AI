## Why

The auth token refresh flow is broken. After ~55 minutes (when the access token expires), all API calls fail with 401 instead of transparently refreshing the token. The client-side `tryRefresh()` in `auth-client.ts` conflicts with the server-side JWT callback refresh in `auth.ts`, uses an incorrect session update mechanism (`POST /api/auth/session` which doesn't rewrite the JWT cookie), and has no guard against concurrent refresh attempts when multiple requests hit 401 simultaneously.

## What Changes

- Remove the broken client-side `tryRefresh()` method from `AuthApiClient`
- Rely exclusively on the JWT callback's built-in refresh mechanism in `auth.ts`
- Add a proactive pre-request token expiry check in `AuthApiClient` that triggers `getSession()` (which fires the JWT callback refresh) before the token expires
- Add a refresh lock/mutex to prevent concurrent refresh requests when multiple calls hit 401
- Fix the `stream()` method's retry logic to use a clean request options pattern instead of mutating shared references
- Ensure consistent 401 retry behavior between `request()` and `stream()` methods

## Capabilities

### New Capabilities
- `auth-token-lifecycle`: Proactive token refresh, refresh-on-401 with concurrency guard, consistent retry across request and stream methods

### Modified Capabilities
_N/A — no existing behaviour specs to modify_

## Impact

- `src/features/auth/api/auth-client.ts` — major refactor of refresh logic
- `src/features/auth/api/auth.ts` — no change needed (JWT callback refresh already works correctly)
- All consumers of `apiClient` benefit transparently (conversations, messages, user profile)
