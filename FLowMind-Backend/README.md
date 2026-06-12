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
  └── POST /v1/chat/completions ──► ChatService ──► OpenAI SDK ──► LLM Provider
                                        │
                                    stream=True  → SSE StreamingResponse
                                    stream=False → JSON ChatResponse
```

---

## Project Structure

```
app/
├── api/
│   ├── auth.py             # POST /v1/auth/google, refresh, logout, GET /me
│   └── chat.py             # POST /v1/chat/completions route
├── schemas/
│   ├── auth.py             # Pydantic models for auth requests/responses
│   └── chat.py             # Pydantic models (ChatMessage, ChatRequest, ChatResponse, ToolDef)
├── services/
│   ├── chat.py             # ChatService — wraps AsyncOpenAI client
│   ├── token.py            # TokenService — JWT generation, verification, refresh tokens
│   ├── user.py             # UserService — create/update/lookup users
│   └── session.py          # SessionService — create, rotate, revoke sessions
├── config.py               # Settings via pydantic-settings
├── database.py             # Async SQLAlchemy engine + session factory
├── models.py               # User + Session SQLAlchemy models
├── middleware.py           # JwtAuthMiddleware, RateLimitMiddleware, LoggingMiddleware
└── main.py                 # FastAPI app factory + ASGI entry point

alembic/                    # Database migrations (async)
├── env.py
├── versions/
│   └── ..._create_users_and_sessions_tables.py
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

### POST /v1/chat/completions

OpenAI-compatible chat completions. Requires a valid JWT access token in the `Authorization` header.

**Request:**

```json
{
  "model": "deepseek-chat",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 1024,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather",
        "parameters": {
          "type": "object",
          "properties": {"location": {"type": "string"}},
          "required": ["location"]
        }
      }
    }
  ]
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `model` | string | no | provider default | Model identifier |
| `messages` | array | yes | — | Array of `{role, content, name?, tool_call_id?}` |
| `stream` | boolean | no | `true` | SSE streaming |
| `temperature` | float | no | provider default | Sampling temperature |
| `max_tokens` | int | no | provider default | Max response tokens |
| `tools` | array | no | — | Function definitions |

**Non-streaming response:**

```json
{
  "id": "chatcmpl-123abc",
  "object": "chat.completion",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "Hello! How can I help?"},
    "finish_reason": "stop"
  }],
  "usage": {"prompt_tokens": 9, "completion_tokens": 9, "total_tokens": 18}
}
```

**Streaming response** (SSE, `text/event-stream`):

```
data: {"id":"...","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"},"index":0}]}

data: {"id":"...","object":"chat.completion.chunk","choices":[{"delta":{"content":"! How can I help?"},"index":0}]}

data: [DONE]
```

**Error shape:**

```json
{"error": {"message": "...", "type": "...", "code": 401|429|500}}
```

| Code | `type` | Description |
|---|---|---|
| 401 | `authentication_error` | Missing/invalid/expired JWT or refresh token |
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
| `test_api.py` | Integration | Health check, validation, auth endpoints, full mocked flow |
| `test_token_service.py` | Unit | JWT generation, verification, expiry, refresh token hashing |
| `test_user_service.py` | Unit | User create/update/lookup (mocked DB) |
| `test_session_service.py` | Unit | Session create, find, invalidate (mocked DB) |

All tests use mocked dependencies — no real API calls or database required.

---

## Docker

```bash
docker build -t flowmind-backend .
docker run -p 8000:8000 -e PROVIDER_API_KEY=your-key flowmind-backend
```

Image: `python:3.12-slim`, exposes `8000`, runs uvicorn.

---

## Development Workflow

OpenSpec intent-driven workflow (proposal → specs → design → ADR → tasks → apply). See `.agents/` and `.opencode/` for agent skills and configuration.
