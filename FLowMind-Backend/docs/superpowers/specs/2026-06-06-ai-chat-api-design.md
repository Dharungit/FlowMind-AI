# AI Chat API — Design Doc

## Overview

Production-grade FastAPI backend for a ChatGPT-clone. Single endpoint proxies to an OpenAI-compatible provider (DeepSeek initially), with SSE streaming and tool/function calling. Stateless, internally authenticated, config-driven provider switching.

## Architecture

```
Request → Logging → Auth → Rate Limit → POST /v1/chat/completions → ChatService → OpenAI SDK → Provider
                                                                                            ↓
                                                                                StreamingResponse (SSE)
```

**Pattern**: Thin proxy via `ChatService` — no provider abstraction layer yet. The OpenAI SDK is called directly from a service class, keeping routes clean and enabling easy extraction later if needed.

## Project Structure

```
flowmind-backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, lifespan, middleware registration
│   ├── config.py            # Pydantic Settings from env
│   ├── api/
│   │   ├── __init__.py
│   │   └── chat.py          # POST /v1/chat/completions
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── chat.py          # OpenAI-compatible request/response models
│   ├── services/
│   │   ├── __init__.py
│   │   └── chat.py          # ChatService wrapping openai SDK
│   └── middleware.py         # Auth, rate-limit, structured logging
├── pyproject.toml
├── Dockerfile
├── .env.example
└── .dockerignore
```

## Configuration (config.py)

```python
class Settings(BaseSettings):
    provider_base_url: str = "https://api.deepseek.com/v1"
    provider_api_key: str
    provider_default_model: str = "deepseek-chat"
    auth_token: str | None = None
    rate_limit_per_minute: int = 60
    log_level: str = "INFO"
```

Provider swap = change `PROVIDER_BASE_URL` + `PROVIDER_API_KEY` in `.env`.

## API Schema (schemas/chat.py)

Mirrors OpenAI chat completion request/response shapes:

- **Request**: `ChatRequest` with `messages[]`, `stream`, `tools[]`, `temperature`, `max_tokens`
- **Message**: `ChatMessage` with `role`, `content`, optional `tool_call_id`, `name`
- **Tool**: `ToolDef` wrapping `FunctionDef` (name, description, parameters as JSON Schema)
- **Response**: `ChatResponse` with `id`, `choices[]`, `usage`
- **Streaming**: SSE chunks matching OpenAI delta format

## Endpoint (api/chat.py)

```
POST /v1/chat/completions
```

- If `stream=True`: returns `StreamingResponse` over `chat_service.stream_chat()` (async generator)
- If `stream=False`: returns `ChatResponse` JSON
- Passes all unknown fields through to the SDK

## Service (services/chat.py)

`ChatService` is initialized with the OpenAI client (configured from `Settings`):

- `async def chat(request)` — non-streaming path
- `async def stream_chat(request)` — async generator yielding SSE bytes

One file, no interfaces, no adapters. Refactor later if multi-provider becomes real.

## Middleware Stack (middleware.py)

| Layer | Implementation | Config |
|-------|---------------|--------|
| Logging | Structured JSON; request_id, method, path, status, duration | `LOG_LEVEL` |
| Auth | Bearer token check against `AUTH_TOKEN` | `AUTH_TOKEN` (skip if unset) |
| Rate Limit | In-memory sliding window per IP | `RATE_LIMIT_PER_MINUTE` |

## Error Handling

Unified error response matching OpenAI error shape:

```json
{"error": {"message": "...", "type": "...", "code": 429}}
```

Mapped error types: `rate_limit_error` (429), `authentication_error` (401), `invalid_request_error` (400), `internal_server_error` (500).

## Infrastructure

- **Runtime**: Docker container on any host
- **Dependencies**: `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`, `openai`, `structlog`
- **Dev**: `uvicorn app.main:app --reload`
- **Prod**: `gunicorn -k uvicorn.workers.UvicornWorker app.main:app`

## Non-Goals (MVP)

- No database / conversation persistence
- No user management / multi-tenant
- No streaming fallback detection
- No provider health checks
- No caching layer
