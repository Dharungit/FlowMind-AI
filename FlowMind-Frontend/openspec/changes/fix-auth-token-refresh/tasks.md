## 1. Refactor `AuthApiClient` refresh logic

- [ ] 1.1 Remove the `tryRefresh()` method from `AuthApiClient`
- [ ] 1.2 Add a refresh lock (`refreshPromise`) to serialize concurrent 401 retries
- [ ] 1.3 Add proactive expiry check before each request (call `getSession()` if `expiresAt` is within 5 minutes)
- [ ] 1.4 Extract shared `executeWithRetry` helper from `request()` and `stream()` retry logic

## 2. Fix `request()` method

- [ ] 2.1 Update 401 handling to use refresh lock + `getSession()` instead of `tryRefresh()`
- [ ] 2.2 Ensure retry uses fresh session tokens from `getSession()`

## 3. Fix `stream()` method

- [ ] 3.1 Update 401 handling to use shared `executeWithRetry` helper
- [ ] 3.2 Ensure stream retry uses fresh authorization header from updated session

## 4. Handle refresh failure gracefully

- [ ] 4.1 Check `session.error` after refresh attempt — if `"RefreshAccessTokenError"`, sign out
- [ ] 4.2 Ensure `ApiError(401, "Session expired")` is thrown on refresh failure

## 5. Verify and validate

- [ ] 5.1 Run lint and typecheck on changed files
- [ ] 5.2 Verify the app works end-to-end: log in, wait for token expiry (or mock expiry), confirm transparent refresh
