# FLowMind-Backend

Production-grade FastAPI backend providing an OpenAI-compatible chat completions API. Acts as a thin proxy to any OpenAI-compatible LLM provider (DeepSeek by default), supporting streaming (SSE), non-streaming responses, tool/function calling, configurable auth, rate limiting, and structlog-structured logging.

---

## Architecture

```
Client
  │
  ▼
CORSMiddleware
  │
  ▼
LoggingMiddleware (method, path, status, duration_ms)
  │
  ▼
RateLimitMiddleware (sliding window per IP, 60 req/min default)
  │
  ▼
AuthMiddleware (optional Bearer token)
  │
  ▼
POST /v1/chat/completions ──► ChatService ──► OpenAI SDK ──► LLM Provider
                                  │
                              stream=True  → SSE StreamingResponse
                              stream=False → JSON ChatResponse
```

Single-endpoint proxy. No database, no user management, no conversation persistence.

---

## Project Structure

```
app/
├── api/chat.py           # POST /v1/chat/completions route
├── schemas/chat.py       # Pydantic models (ChatMessage, ChatRequest, ChatResponse, ToolDef)
├── services/chat.py      # ChatService — wraps AsyncOpenAI client
├── config.py             # Settings via pydantic-settings
├── middleware.py         # AuthMiddleware, RateLimitMiddleware, LoggingMiddleware
└── main.py              # FastAPI app factory + ASGI entry point

tests/
├── conftest.py           # Shared fixtures
├── test_api.py           # Integration tests
├── test_chat_service.py  # ChatService unit tests
├── test_config.py        # Config unit tests
├── test_middleware.py    # Middleware integration tests
└── test_schemas.py       # Schema unit tests
```

---

## Quick Start

```bash
# Prerequisites: Python 3.11+

python -m venv .venv
.venv\Scripts\activate          # Windows

pip install ".[dev]"
cp .env.example .env
# Edit .env — set PROVIDER_API_KEY

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
| `AUTH_TOKEN` | string | *(empty)* | Bearer token; empty = auth disabled |
| `RATE_LIMIT_PER_MINUTE` | int | `60` | Max requests/min per IP (mutating methods) |
| `LOG_LEVEL` | string | `INFO` | Logging level |

Point at any OpenAI-compatible provider by changing `PROVIDER_BASE_URL` and `PROVIDER_API_KEY`.

---

## API

### POST /v1/chat/completions

OpenAI-compatible chat completions.

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
| 401 | `authentication_error` | Missing/invalid Bearer token |
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

When `AUTH_TOKEN` is set (non-empty), `AuthMiddleware` requires `Authorization: Bearer <token>` on POST/PUT/DELETE/PATCH. The `/health` endpoint is always public. Auth is skipped entirely when `AUTH_TOKEN` is empty.

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
| `test_middleware.py` | Integration | Auth on/off, rate limit, public endpoints |
| `test_api.py` | Integration | Health check, validation, full mocked flow |

All tests use mocked `AsyncOpenAI` — no real API calls.

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
