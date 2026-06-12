## 1. Dependencies and Configuration

- [x] 1.1 Add `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `google-auth`, `PyJWT` to `pyproject.toml`
- [x] 1.2 Add `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `JWT_SECRET` to `.env.example` and mark `AUTH_TOKEN` as deprecated
- [x] 1.3 Create async database engine and session factory in `app/database.py`

## 2. Data Models and Migrations

- [x] 2.1 Initialize Alembic with `alembic init alembic` and configure `env.py` for async SQLAlchemy
- [x] 2.2 Create `User` SQLAlchemy model (id, google_sub, email, display_name, avatar_url, created_at, updated_at, metadata JSONB)
- [x] 2.3 Create `Session` SQLAlchemy model (id, user_id FK, refresh_token_hash, ip_address, device_info, expires_at, created_at, is_invalidated)
- [x] 2.4 Generate and run the initial Alembic migration

## 3. Services

- [x] 3.1 Implement `TokenService` — generate access tokens (HS256 JWT, 15 min expiry), verify tokens, generate opaque refresh tokens
- [x] 3.2 Implement `UserService` — find or create user by Google profile, update existing user, get user by ID
- [x] 3.3 Implement `SessionService` — create session, look up by refresh token hash, invalidate single session, invalidate all user sessions

## 4. Auth Routes

- [x] 4.1 Implement `POST /v1/auth/google` — verify Google ID token via `google-auth`, create/update user, issue JWT pair, return tokens + user profile
- [x] 4.2 Implement `POST /v1/auth/refresh` — validate refresh token, rotate (invalidate old, create new), return new token pair
- [x] 4.3 Implement `POST /v1/auth/logout` — invalidate single session or all user sessions
- [x] 4.4 Implement `GET /v1/auth/me` — return current user profile from access token

## 5. Middleware

- [x] 5.1 Implement `JwtAuthMiddleware` — extract and validate JWT from `Authorization` header, attach user to request state, skip auth routes
- [x] 5.2 Update `app/main.py` — replace `AuthMiddleware` with `JwtAuthMiddleware`, register auth router

## 6. Tests

- [x] 6.1 Write unit tests for `TokenService` (generate, verify, expiry, invalid signature)
- [x] 6.2 Write unit tests for `UserService` (create, update, find by google_sub)
- [x] 6.3 Write unit tests for `SessionService` (create, lookup, invalidate, rotate)
- [x] 6.4 Write integration tests for all four auth endpoints (success, failure, edge cases)
- [x] 6.5 Write integration test for `JwtAuthMiddleware` (valid token, expired, missing, tampered)

## 7. Verification

- [x] 7.1 Run full test suite and confirm all tests pass
- [ ] 7.2 Run `openspec validate implement-google-oauth-authentication --type change --strict` before archive
