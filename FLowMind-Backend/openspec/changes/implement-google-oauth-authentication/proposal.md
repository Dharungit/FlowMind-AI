## Why

FlowMind currently has no user system and only a trivial Bearer-token auth that is disabled by default. Adding Google OAuth authentication establishes user identity, enables per-user session management, and lays the foundation for future features like persistent chat history, rate limiting by user, and usage tracking — without requiring major architectural changes later.

## What Changes

- Add PostgreSQL database layer with async SQLAlchemy and Alembic migrations
- Create `User` and `Session` SQLAlchemy models
- Add `POST /v1/auth/google` — verifies a Google ID token via `google-auth`, auto-creates or updates the user, issues JWT access + refresh tokens
- Add `POST /v1/auth/refresh` — accepts a valid refresh token, rotates it (issues new pair, invalidates old), returns new tokens
- Add `POST /v1/auth/logout` — invalidates the refresh token (single-session or all-sessions via query param)
- Add `GET /v1/auth/me` — returns the current user profile from the access token
- Replace existing `AuthMiddleware` with a `JwtAuthMiddleware` that validates JWT access tokens on protected routes
- Remove dependency on `AUTH_TOKEN` env var (the old bearer-token system is superseded)
- Add new env vars: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`
- Add new Python dependencies: `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `google-auth`, `PyJWT`

## Capabilities

### New Capabilities
- `google-oauth`: Google ID token verification, user auto-creation or update on first login
- `jwt-auth`: JWT access token (15 min) and refresh token (7 day) issuance, verification, and rotation
- `session-management`: Refresh token lifecycle — storage (hashed), rotation on use, single/all-session logout
- `user-management`: User profile retrieval via `GET /v1/auth/me`

### Modified Capabilities
*(None — this is the first set of formal capabilities for the project.)*

## Impact

- **Database**: New PostgreSQL dependency; new `User` and `Session` tables; Alembic migration pipeline added
- **API**: Four new auth endpoints; `POST /v1/chat/completions` becomes authenticated (via JWT middleware replacing old auth)
- **Configuration**: New required env vars (`DATABASE_URL`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`); `AUTH_TOKEN` becomes optional then removed
- **Middleware**: Existing short-circuit Bearer-token check replaced by JWT validation with 401 on missing/expired/invalid tokens
- **Dependencies**: Five new production packages; no breaking changes to the existing chat endpoint contract (same interface, just now requiring a valid JWT)
