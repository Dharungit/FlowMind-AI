# 0004. Implement Refresh Token Rotation

- Status: accepted
- Date: 2026-06-11

## Context

Refresh tokens are bearer credentials with a 7-day lifetime. If a refresh token is leaked (XSS, compromised client, network interception), an attacker could use it indefinitely until expiry. A rotation mechanism limits the damage window by invalidating each refresh token after a single use.

## Decision

Each refresh operation will:
1. Look up the session by the provided refresh token hash.
2. Verify the session is active and not expired.
3. Mark the current session as invalidated.
4. Generate a new refresh token and create a new session record.
5. Return the new token pair.

If a compromised, already-rotated token is presented, it is rejected.

## Consequences

- Positive: Limits refresh token theft — an attacker who steals a token can use it only once before rotation invalidates it.
- Positive: Aligns with OAuth2 security best practices (RFC 6749 refresh rotation pattern).
- Negative: Concurrent refresh requests could both succeed (race condition). Acceptable per OAuth2 spec — the user gets two valid sessions.
- Negative: Additional database writes on every refresh (one invalidate, one create).
