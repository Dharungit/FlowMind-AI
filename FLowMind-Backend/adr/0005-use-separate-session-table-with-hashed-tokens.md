# 0005. Use Separate Session Table with Hashed Tokens

- Status: accepted
- Date: 2026-06-11

## Context

The application needs to track active refresh tokens per user for rotation, revocation (single-session and all-sessions logout), and future multi-device support. Storing plaintext refresh tokens in the database creates a credential exposure risk if the database is compromised.

## Decision

We will use a dedicated `Session` table with columns for `user_id`, SHA-256 hash of the refresh token, `ip_address`, `device_info`, `expires_at`, and `created_at`. The plaintext refresh token is never stored — only its hash. The table supports a soft-delete flag for invalidation.

## Consequences

- Positive: Hashed tokens prevent credential exposure if the database is breached.
- Positive: Separate session table enables multi-device session management (list, revoke individual, revoke all).
- Positive: Audit trail of session creation and invalidation events.
- Negative: Additional database table and queries for every auth operation.
- Negative: Cannot enumerate or display active sessions by plaintext token — only by session ID (e.g., user can see "Chrome on Windows" but not the raw token).
