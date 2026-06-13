# FLowMind-Backend

Production-grade FastAPI backend providing an OpenAI-compatible chat completions API with Google OAuth authentication. Acts as a proxy to any OpenAI-compatible LLM provider (DeepSeek by default), supporting streaming (SSE), non-streaming responses, tool/function calling, JWT-based auth, PostgreSQL persistence, rate limiting, and structlog-structured logging.

---

## Architecture

```
Client
  │
  ▼
CORSMiddleware
  │
  ▼
LoggingMiddleware
  │
  ▼
RateLimitMiddleware (sliding window per IP, 60 req/min default)
  │
  ▼
JwtAuthMiddleware (validates JWT access tokens, skips public auth routes)
  │
  ├── POST /v1/auth/google         (public) ──► google-auth ──► Google
  │   POST /v1/auth/refresh        (public)
  │   POST /v1/auth/logout         (authenticated)
  │   GET  /v1/auth/me             (authenticated) ──► UserService ──► PostgreSQL
  │
  │
  ├── POST /v1/conversations          (authenticated) ──► ConversationService ──► PostgreSQL
  │   GET  /v1/conversations          (authenticated)
  │   GET  /v1/conversations/{id}     (authenticated)
  │   PUT  /v1/conversations/{id}     (authenticated)
  │   DELETE /v1/conversations/{id}   (authenticated)
  │
  ├── POST /v1/conversations/{id}/messages  (authenticated) ──► MessageService ──► ChatService ──► LLM Provider
  │   DELETE /v1/messages/{id}              (authenticated)      │
  │                                                            └──► PostgreSQL
  │
  └── (legacy) POST /v1/chat/completions removed
```

---

## Project Structure

```
app/
├── api/
│   ├── auth.py             # POST /v1/auth/google, refresh, logout, GET /me
│   └── chat.py             # Conversation + message CRUD endpoints
├── schemas/
│   ├── auth.py             # Pydantic models for auth requests/responses
│   ├── chat.py             # Pydantic models (ChatMessage, ChatRequest, ChatResponse, ToolDef)
│   └── conversations.py    # Conversation + message request/response schemas
├── services/
│   ├── chat.py             # ChatService — wraps AsyncOpenAI client (internal only)
│   ├── conversation.py     # ConversationService — create, list, get, update, delete conversations
│   ├── message.py          # MessageService — add message with auto-persist, delete messages
│   ├── token.py            # TokenService — JWT generation, verification, refresh tokens
│   ├── user.py             # UserService — create/update/lookup users
│   └── session.py          # SessionService — create, rotate, revoke sessions
├── config.py               # Settings via pydantic-settings
├── database.py             # Async SQLAlchemy engine + session factory
├── models.py               # User, Session, Conversation, Message SQLAlchemy models
├── middleware.py           # JwtAuthMiddleware, RateLimitMiddleware, LoggingMiddleware
└── main.py                 # FastAPI app factory + ASGI entry point

alembic/                    # Database migrations (async)
├── env.py
├── versions/
│   ├── ..._create_users_and_sessions_tables.py
│   └── ..._add_conversations_and_messages_tables.py
└── alembic.ini

tests/
├── conftest.py             # Shared fixtures
├── test_api.py             # Integration tests (chat + auth)
├── test_chat_service.py    # ChatService unit tests
├── test_config.py          # Config unit tests
├── test_middleware.py      # Middleware integration tests (JWT auth)
├── test_schemas.py         # Schema unit tests
├── test_token_service.py   # TokenService unit tests
├── test_user_service.py    # UserService unit tests
└── test_session_service.py # SessionService unit tests
```

---

## Quick Start

```bash
# Prerequisites: Python 3.11+, PostgreSQL 14+

# Create database
createdb flowmind

python -m venv .venv
.venv\Scripts\activate          # Windows

pip install ".[dev]"
cp .env.example .env
# Edit .env — set PROVIDER_API_KEY, DATABASE_URL, GOOGLE_CLIENT_ID, JWT_SECRET

# Run database migrations
alembic upgrade head

uvicorn app.main:app --reload --port 8000
```

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

Swagger UI at `http://localhost:8000/docs`.

---

## Configuration

All via env vars / `.env`.

| Variable | Type | Default | Description |
|---|---|---|---|
| `PROVIDER_BASE_URL` | string | `https://api.deepseek.com/v1` | LLM provider API base URL |
| `PROVIDER_API_KEY` | string | *(required)* | Provider API key |
| `PROVIDER_DEFAULT_MODEL` | string | `deepseek-chat` | Default model when request omits `model` |
| `AUTH_TOKEN` | string | *(empty)* | **Deprecated** — use JWT-based auth |
| `DATABASE_URL` | string | `postgresql+asyncpg://user:pass@localhost:5432/flowmind` | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | string | *(required for auth)* | Google OAuth client ID |
| `JWT_SECRET` | string | *(required)* | Secret key for signing JWT access tokens |
| `RATE_LIMIT_PER_MINUTE` | int | `60` | Max requests/min per IP (mutating methods) |
| `LOG_LEVEL` | string | `INFO` | Logging level |

Point at any OpenAI-compatible provider by changing `PROVIDER_BASE_URL` and `PROVIDER_API_KEY`.

---

## API

### POST /v1/auth/google

Authenticate with a Google ID token.

**Request:**
```json
{"id_token": "<google-id-token>"}
```

**Response (200):**
```json
{
  "access_token": "<jwt>",
  "refresh_token": "<opaque>",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "User Name",
    "avatar_url": "https://..."
  }
}
```

**Errors:** 401 — invalid/expired/wrong-audience token.

---

### POST /v1/auth/refresh

Rotate a refresh token. The old token is invalidated and a new pair is issued.

**Request:**
```json
{"refresh_token": "<opaque>"}
```

**Response (200):**
```json
{
  "access_token": "<new-jwt>",
  "refresh_token": "<new-opaque>"
}
```

**Errors:** 401 — invalid or expired refresh token.

---

### POST /v1/auth/logout

Invalidate a session. Requires a valid JWT access token in the `Authorization` header.

**Request (single session):**
```json
{"refresh_token": "<opaque>"}
```

**Request (all sessions):**
```json
{"all": true}
```

**Response:** `{"status": "ok"}`

---

### GET /v1/auth/me

Return the current user profile. Requires a valid JWT access token in the `Authorization` header.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "User Name",
  "avatar_url": "https://..."
}
```

**Errors:** 401 — invalid/expired/missing token.

---

### Conversations

All conversation endpoints require a valid JWT access token in the `Authorization: Bearer <token>` header.

---

#### POST /v1/conversations

Create a new conversation.

**Request:**
```json
{"title": "My Chat"}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `title` | string | no | `"New Conversation"` | Conversation title |

**Response (201):**
```json
{
  "id": "uuid",
  "title": "My Chat",
  "created_at": "2026-06-13T02:15:00+00:00",
  "updated_at": "2026-06-13T02:15:00+00:00"
}
```

---

#### GET /v1/conversations

List the authenticated user's conversations, ordered by most recently updated.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "My Chat",
    "created_at": "2026-06-13T02:15:00+00:00",
    "updated_at": "2026-06-13T02:15:00+00:00"
  }
]
```

Returns an empty array if no conversations exist.

---

#### GET /v1/conversations/{id}

Get a single conversation with all its messages.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "My Chat",
  "created_at": "2026-06-13T02:15:00+00:00",
  "updated_at": "2026-06-13T02:15:00+00:00",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Hello!",
      "metadata": null,
      "created_at": "2026-06-13T02:15:00+00:00"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Hi! How can I help?",
      "metadata": null,
      "created_at": "2026-06-13T02:15:05+00:00"
    }
  ]
}
```

**Errors:** 404 — conversation not found or owned by another user.

---

#### PUT /v1/conversations/{id}

Update the conversation title.

**Request:**
```json
{"title": "Updated Title"}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "created_at": "2026-06-13T02:15:00+00:00",
  "updated_at": "2026-06-13T02:15:10+00:00"
}
```

**Errors:** 404 — conversation not found or owned by another user.

---

#### DELETE /v1/conversations/{id}

Delete a conversation and all its messages.

**Response:** `204 No Content`

**Errors:** 404 — conversation not found or owned by another user.

---

### Messages

#### POST /v1/conversations/{id}/messages

Send a new message to a conversation. The backend appends your message to the full conversation history loaded from the database, calls the LLM internally, persists the user message and the assistant reply, and returns the assistant's response.

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "Tell me a joke"}
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `messages` | array | yes | Array of `{role, content}`, typically just the new user message |

**Response (200):**
```json
{
  "id": "uuid",
  "role": "assistant",
  "content": "Why did the chicken cross the road? To get to the other side!",
  "metadata": null,
  "created_at": "2026-06-13T02:15:05+00:00"
}
```

**Errors:** 404 — conversation not found or owned by another user.

---

#### DELETE /v1/messages/{id}

Delete a single message from a conversation.

**Response:** `204 No Content`

**Errors:** 404 — message not found or not owned by the authenticated user.

---

### Error Shape

All API errors follow this shape:

```json
{"error": {"message": "...", "type": "...", "code": 401|404|429|500}}
```

| Code | `type` | Description |
|---|---|---|
| 401 | `authentication_error` | Missing/invalid/expired JWT or refresh token |
| 404 | — | Resource not found |
| 429 | `rate_limit_error` | Rate limit exceeded |
| 422 | — | Body validation error (FastAPI native) |
| 500 | `internal_server_error` | Unhandled error |

### GET /health

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

---

## Authentication

### JWT-Based Authentication (current)

All routes except `/health`, `/v1/auth/google`, and `/v1/auth/refresh` require a valid JWT access token in the `Authorization: Bearer <token>` header. Access tokens are HS256 JWTs with a 15-minute expiry. Refresh tokens are opaque strings with a 7-day lifetime and are rotated on each use.

**Auth flow:**

1. Client sends Google ID token to `POST /v1/auth/google`
2. Backend verifies the token via `google-auth`, creates/updates user, returns JWT pair + user profile
3. Client uses `access_token` for subsequent requests (15 min validity)
4. When the access token expires, client calls `POST /v1/auth/refresh` with the `refresh_token` to get a new pair
5. Client calls `POST /v1/auth/logout` to invalidate a single session or all sessions

### Deprecated: Bearer Token Auth

The legacy `AUTH_TOKEN` env var is retained for backward compatibility but is no longer used by the middleware. It will be removed in a future release.

---

## Rate Limiting

In-memory sliding 60-second window per IP. Applies to POST/PUT/DELETE/PATCH. Configured via `RATE_LIMIT_PER_MINUTE`. Returns 429 when exceeded.

---

## Logging

[structlog](https://www.structlog.org/) — logs method, path, status code, and duration per request. Controlled by `LOG_LEVEL`.

---

## Tool / Function Calling

Define tools in the request payload. The model may respond with `tool_calls` instead of content. Your client executes the function and returns the result in a message with `role: "tool"`.

---

## Testing

```bash
pytest -v
```

| File | Type | Description |
|---|---|---|
| `test_config.py` | Unit | Settings defaults, custom provider, auth-disabled |
| `test_schemas.py` | Unit | Model creation, serialization round-trip |
| `test_chat_service.py` | Unit | Non-streaming, streaming, model override (mocked) |
| `test_middleware.py` | Integration | JWT auth (missing, valid, expired, tampered), public endpoints |
| `test_api.py` | Integration | Health check, conversation CRUD, auth endpoints, legacy route removal |
| `test_token_service.py` | Unit | JWT generation, verification, expiry, refresh token hashing |
| `test_user_service.py` | Unit | User create/update/lookup (mocked DB) |
| `test_session_service.py` | Unit | Session create, find, invalidate (mocked DB) |

All tests use mocked dependencies — no real API calls or database required.

---

## Docker

```bash
# 1. Copy and edit environment variables
cp .env.example .env
# Edit .env — at minimum set PROVIDER_API_KEY, GOOGLE_CLIENT_ID, JWT_SECRET

# 2. Start everything (PostgreSQL + API)
docker compose up --build
```

This starts two services:
- **PostgreSQL 16** (`db`) on port 5432 with a healthcheck
- **FastAPI** (`api`) on port 8000 — auto-runs Alembic migrations on boot, then serves via uvicorn

The `api` service waits for `db` to be healthy before starting, so boot order is handled automatically. No separate migration step required.

---

## Development Workflow

OpenSpec intent-driven workflow (proposal → specs → design → ADR → tasks → apply). See `.agents/` and `.opencode/` for agent skills and configuration.
