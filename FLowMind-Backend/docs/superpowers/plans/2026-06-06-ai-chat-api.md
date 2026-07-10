# AI Chat API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade FastAPI backend for a ChatGPT-clone with SSE streaming and tool calling.

**Architecture:** Thin proxy via `ChatService` wrapping the OpenAI SDK. Single `POST /v1/chat/completions` endpoint. Config-driven provider switching via `PROVIDER_BASE_URL` + `PROVIDER_API_KEY`. Stateless, internal auth, in-memory rate limiting.

**Tech Stack:** Python 3.11+, FastAPI, uvicorn, pydantic-settings, openai, structlog, pytest, httpx

---

### Task 1: Project Scaffold & Config

**Files:**
- Create: `pyproject.toml`
- Create: `app/__init__.py`
- Create: `app/config.py`
- Create: `tests/__init__.py`
- Create: `tests/conftest.py`
- Test: `tests/test_config.py`

- [ ] **Step 1: Create pyproject.toml with dependencies**

```toml
[project]
name = "flowmind-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "pydantic>=2.0",
    "pydantic-settings>=2.0",
    "openai>=1.0",
    "structlog>=24.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.24",
    "httpx>=0.27",
    "pytest-env>=1.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 2: Create empty app/__init__.py and tests/__init__.py**

```
# app/__init__.py — empty
# tests/__init__.py — empty
```

- [ ] **Step 3: Write test for config loading**

File: `tests/test_config.py`
```python
from app.config import Settings

def test_config_defaults():
    settings = Settings(_env_file=None, provider_api_key="test-key-123")
    assert settings.provider_base_url == "https://api.deepseek.com/v1"
    assert settings.provider_api_key == "test-key-123"
    assert settings.provider_default_model == "deepseek-chat"
    assert settings.rate_limit_per_minute == 60
    assert settings.log_level == "INFO"

def test_config_custom_provider():
    settings = Settings(
        _env_file=None,
        provider_base_url="https://api.openai.com/v1",
        provider_api_key="sk-xxx",
        provider_default_model="gpt-4o",
    )
    assert settings.provider_base_url == "https://api.openai.com/v1"
    assert settings.provider_default_model == "gpt-4o"

def test_config_auth_disabled_by_default():
    settings = Settings(_env_file=None, provider_api_key="key")
    assert settings.auth_token is None
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `python -m pytest tests/test_config.py -v`
Expected: ModuleNotFoundError / ImportError (config.py doesn't exist yet)

- [ ] **Step 5: Implement app/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    provider_base_url: str = "https://api.deepseek.com/v1"
    provider_api_key: str
    provider_default_model: str = "deepseek-chat"
    auth_token: str | None = None
    rate_limit_per_minute: int = 60
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
```

- [ ] **Step 6: Write tests/conftest.py**

```python
import pytest
from app.config import Settings


@pytest.fixture
def settings():
    return Settings(
        _env_file=None,
        provider_api_key="test-key-456",
        provider_base_url="https://api.deepseek.com/v1",
    )
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `python -m pytest tests/test_config.py -v`
Expected: 3 passed

- [ ] **Step 8: Commit**

```bash
git add pyproject.toml app/__init__.py app/config.py tests/__init__.py tests/test_config.py tests/conftest.py
git commit -m "feat: scaffold project with config"
```

---

### Task 2: Chat Schemas

**Files:**
- Create: `app/schemas/__init__.py`
- Create: `app/schemas/chat.py`
- Test: `tests/test_schemas.py`

- [ ] **Step 1: Write tests for chat request/response schemas**

```python
import json
from app.schemas.chat import ChatRequest, ChatMessage, ToolDef, ChatResponse

def test_chat_request_minimal():
    req = ChatRequest(messages=[ChatMessage(role="user", content="Hello")])
    assert req.messages[0].role == "user"
    assert req.messages[0].content == "Hello"
    assert req.stream is True  # default

def test_chat_request_with_tools():
    req = ChatRequest(
        messages=[ChatMessage(role="user", content="What's the weather?")],
        tools=[ToolDef(
            type="function",
            function={
                "name": "get_weather",
                "description": "Get weather for a city",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string"}
                    },
                    "required": ["city"]
                }
            }
        )]
    )
    assert len(req.tools) == 1
    assert req.tools[0].function["name"] == "get_weather"

def test_chat_request_model_defaults_none():
    req = ChatRequest(messages=[ChatMessage(role="user", content="Hi")])
    assert req.model is None  # will be filled by service with default

def test_chat_response():
    resp = ChatResponse(
        id="chatcmpl-123",
        choices=[{
            "index": 0,
            "message": {"role": "assistant", "content": "Hello!"},
            "finish_reason": "stop"
        }],
        usage={"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
    )
    assert resp.id == "chatcmpl-123"
    assert resp.choices[0].message["content"] == "Hello!"
    assert resp.usage["total_tokens"] == 15

def test_chat_response_json_serializable():
    resp = ChatResponse(
        id="chatcmpl-123",
        choices=[{
            "index": 0,
            "message": {"role": "assistant", "content": "Hi"},
            "finish_reason": "stop"
        }]
    )
    data = json.loads(resp.model_dump_json())
    assert data["object"] == "chat.completion"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_schemas.py -v`
Expected: ModuleNotFoundError

- [ ] **Step 3: Create app/schemas/__init__.py** (empty)

- [ ] **Step 4: Implement app/schemas/chat.py**

```python
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str | None = None
    tool_call_id: str | None = None
    name: str | None = None


class ToolDef(BaseModel):
    type: str = "function"
    function: dict


class ChatRequest(BaseModel):
    model: str | None = None
    messages: list[ChatMessage]
    stream: bool = True
    tools: list[ToolDef] | None = None
    temperature: float | None = None
    max_tokens: int | None = None


class ChatResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    choices: list[dict]
    usage: dict | None = None
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `python -m pytest tests/test_schemas.py -v`
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
git add app/schemas/__init__.py app/schemas/chat.py tests/test_schemas.py
git commit -m "feat: add chat request/response schemas"
```

---

### Task 3: Chat Service

**Files:**
- Create: `app/services/__init__.py`
- Create: `app/services/chat.py`
- Test: `tests/test_chat_service.py`

- [ ] **Step 1: Write tests for ChatService (mocked OpenAI client)**

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.chat import ChatService
from app.schemas.chat import ChatRequest, ChatMessage


@pytest.mark.asyncio
async def test_chat_non_streaming(settings):
    service = ChatService(settings)

    mock_response = MagicMock()
    mock_response.id = "chatcmpl-mock-123"
    mock_response.model = "deepseek-chat"
    mock_response.choices = [MagicMock(
        index=0,
        message=MagicMock(
            role="assistant",
            content="Hello, world!",
            tool_calls=None,
        ),
        finish_reason="stop",
    )]
    mock_response.usage = MagicMock(
        prompt_tokens=10,
        completion_tokens=5,
        total_tokens=15,
    )
    mock_response.model_dump.return_value = {
        "id": "chatcmpl-mock-123",
        "object": "chat.completion",
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": "Hello, world!"},
            "finish_reason": "stop",
        }],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
    }

    service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    req = ChatRequest(messages=[ChatMessage(role="user", content="Hi")])
    result = await service.chat(req)

    assert result.id == "chatcmpl-mock-123"
    assert result.choices[0]["message"]["content"] == "Hello, world!"

    service.client.chat.completions.create.assert_called_once()
    call_kwargs = service.client.chat.completions.create.call_args.kwargs
    assert call_kwargs["model"] == "deepseek-chat"
    assert call_kwargs["stream"] is False


@pytest.mark.asyncio
async def test_chat_streaming(settings):
    service = ChatService(settings)

    chunk = MagicMock()
    chunk.model_dump.return_value = {
        "id": "chatcmpl-mock-456",
        "object": "chat.completion.chunk",
        "choices": [{"index": 0, "delta": {"content": "Hello"}, "finish_reason": None}],
    }
    chunk.__aiter__ = AsyncMock(return_value=iter([chunk]))

    service.client.chat.completions.create = AsyncMock(return_value=chunk)

    req = ChatRequest(messages=[ChatMessage(role="user", content="Hi")], stream=True)
    chunks = [c async for c in service.stream_chat(req)]

    assert len(chunks) > 0
    service.client.chat.completions.create.assert_called_once()
    call_kwargs = service.client.chat.completions.create.call_args.kwargs
    assert call_kwargs["stream"] is True


@pytest.mark.asyncio
async def test_chat_uses_model_from_request(settings):
    service = ChatService(settings)
    mock_resp = MagicMock()
    mock_resp.id = "mock"
    mock_resp.model = "gpt-4"
    mock_resp.choices = []
    mock_resp.usage = None
    mock_resp.model_dump.return_value = {
        "id": "mock", "object": "chat.completion", "choices": [], "usage": None,
    }
    service.client.chat.completions.create = AsyncMock(return_value=mock_resp)

    req = ChatRequest(
        messages=[ChatMessage(role="user", content="Hi")],
        model="gpt-4",
    )
    await service.chat(req)
    assert service.client.chat.completions.create.call_args.kwargs["model"] == "gpt-4"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_chat_service.py -v`
Expected: ModuleNotFoundError

- [ ] **Step 3: Create app/services/__init__.py** (empty)

- [ ] **Step 4: Implement app/services/chat.py**

```python
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from app.config import Settings
from app.schemas.chat import ChatRequest, ChatResponse


class ChatService:
    def __init__(self, settings: Settings) -> None:
        self.client = AsyncOpenAI(
            base_url=settings.provider_base_url,
            api_key=settings.provider_api_key,
        )
        self.default_model = settings.provider_default_model

    async def chat(self, request: ChatRequest) -> ChatResponse:
        kwargs = self._build_kwargs(request)
        kwargs["stream"] = False
        raw = await self.client.chat.completions.create(**kwargs)
        data = raw.model_dump()
        return ChatResponse(**data)

    async def stream_chat(self, request: ChatRequest) -> AsyncGenerator[bytes, None]:
        kwargs = self._build_kwargs(request)
        kwargs["stream"] = True
        stream = await self.client.chat.completions.create(**kwargs)
        async for chunk in stream:
            data = chunk.model_dump()
            yield b"data: " + chunk.model_dump_json().encode() + b"\n\n"
        yield b"data: [DONE]\n\n"

    def _build_kwargs(self, request: ChatRequest) -> dict:
        kwargs = request.model_dump(exclude_none=True)
        kwargs["messages"] = [m.model_dump(exclude_none=True) for m in request.messages]
        if request.tools is not None:
            kwargs["tools"] = [t.model_dump(exclude_none=True) for t in request.tools]
        kwargs["model"] = request.model or self.default_model
        kwargs.pop("stream", None)
        return kwargs
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `python -m pytest tests/test_chat_service.py -v`
Expected: 3 passed

- [ ] **Step 6: Commit**

```bash
git add app/services/__init__.py app/services/chat.py tests/test_chat_service.py
git commit -m "feat: add ChatService with streaming support"
```

---

### Task 4: Middleware (Auth, Rate Limit, Logging)

**Files:**
- Create: `app/middleware.py`
- Test: `tests/test_middleware.py`

- [ ] **Step 1: Write tests for middleware**

```python
import pytest
from starlette.testclient import TestClient
from app.main import create_app
from app.config import Settings


def test_auth_disabled_when_no_token():
    settings = Settings(_env_file=None, provider_api_key="key")
    app = create_app(settings)
    client = TestClient(app)

    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    # Should return error from service (no API key set), not auth error
    assert resp.status_code != 401


def test_auth_enabled_rejects_missing_token():
    settings = Settings(
        _env_file=None,
        provider_api_key="key",
        auth_token="secret-123",
    )
    app = create_app(settings)
    client = TestClient(app)

    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert resp.status_code == 401
    data = resp.json()
    assert data["error"]["type"] == "authentication_error"


def test_auth_enabled_accepts_valid_token():
    settings = Settings(
        _env_file=None,
        provider_api_key="key",
        auth_token="secret-123",
    )
    app = create_app(settings)
    client = TestClient(app)

    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers={"Authorization": "Bearer secret-123"},
    )
    assert resp.status_code != 401


@pytest.mark.parametrize("method,path", [
    ("get", "/health"),
    ("options", "/v1/chat/completions"),
])
def test_auth_skipped_for_non_post(method, path):
    settings = Settings(
        _env_file=None,
        provider_api_key="key",
        auth_token="secret-123",
    )
    app = create_app(settings)
    client = TestClient(app)

    resp = getattr(client, method)(path)
    assert resp.status_code != 401
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_middleware.py -v`
Expected: ImportError (app.main doesn't exist yet)

- [ ] **Step 3: Implement app/middleware.py**

```python
import time
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("flowmind")


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, auth_token: str | None = None):
        super().__init__(app)
        self.auth_token = auth_token

    async def dispatch(self, request: Request, call_next):
        if self.auth_token and request.method in ("POST", "PUT", "DELETE", "PATCH"):
            auth = request.headers.get("Authorization", "")
            if auth != f"Bearer {self.auth_token}":
                return JSONResponse(
                    status_code=401,
                    content={
                        "error": {
                            "message": "Invalid or missing authentication token",
                            "type": "authentication_error",
                            "code": 401,
                        }
                    },
                )
        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_per_minute: int = 60):
        super().__init__(app)
        self.max_per_minute = max_per_minute
        self._requests: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "DELETE", "PATCH"):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            window = now - 60
            timestamps = self._requests.setdefault(client_ip, [])
            timestamps[:] = [t for t in timestamps if t > window]
            if len(timestamps) >= self.max_per_minute:
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": {
                            "message": "Rate limit exceeded. Try again later.",
                            "type": "rate_limit_error",
                            "code": 429,
                        }
                    },
                )
            timestamps.append(now)
        return await call_next(request)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start
        logger.info(
            "request completed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round(duration * 1000),
            },
        )
        return response
```

- [ ] **Step 4: Skip tests for now (they depend on create_app from main.py).** These will pass after Task 5.

- [ ] **Step 5: Commit**

```bash
git add app/middleware.py
git commit -m "feat: add auth, rate limit, and logging middleware"
```

---

### Task 5: API Endpoint & Main App

**Files:**
- Create: `app/api/__init__.py`
- Create: `app/api/chat.py`
- Create: `app/main.py`
- Modify: `tests/conftest.py`
- Modify: `tests/test_middleware.py`

- [ ] **Step 1: Create app/api/__init__.py** (empty)

- [ ] **Step 2: Implement app/api/chat.py**

```python
from fastapi import APIRouter, Depends, Request
from starlette.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.chat import ChatService

router = APIRouter(prefix="/v1")


async def get_service(request: Request) -> ChatService:
    return request.app.state.chat_service


@router.post("/chat/completions")
async def chat_completion(
    request: ChatRequest,
    service: ChatService = Depends(get_service),
):
    if request.stream:
        return StreamingResponse(
            service.stream_chat(request),
            media_type="text/event-stream",
        )
    result = await service.chat(request)
    return result
```

- [ ] **Step 3: Implement app/main.py with create_app factory**

```python
import logging

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.api.chat import router as chat_router
from app.config import Settings
from app.middleware import AuthMiddleware, LoggingMiddleware, RateLimitMiddleware
from app.services.chat import ChatService


def create_app(settings: Settings | None = None) -> FastAPI:
    if settings is None:
        settings = Settings()

    structlog.configure(
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper(), logging.INFO)
        ),
    )

    app = FastAPI(title="FLowMind Chat API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(
        RateLimitMiddleware,
        max_per_minute=settings.rate_limit_per_minute,
    )
    app.add_middleware(AuthMiddleware, auth_token=settings.auth_token)

    app.include_router(chat_router)

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": "Internal server error",
                    "type": "internal_server_error",
                    "code": 500,
                }
            },
        )

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    @app.on_event("startup")
    async def startup():
        app.state.chat_service = ChatService(settings)

    return app


app = create_app()
```

- [ ] **Step 4: Update conftest.py to add create_app fixture**

```python
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.api.chat import get_service
from app.config import Settings
from app.main import create_app
from app.services.chat import ChatService


@pytest.fixture
def settings():
    return Settings(
        _env_file=None,
        provider_api_key="test-key-456",
        provider_base_url="https://api.deepseek.com/v1",
    )


@pytest.fixture
def mock_service(settings):
    service = ChatService(settings)
    mock_resp = MagicMock()
    mock_resp.model_dump.return_value = {
        "id": "cmpl-test",
        "object": "chat.completion",
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": "Mock reply"},
            "finish_reason": "stop",
        }],
        "usage": None,
    }
    service.client.chat.completions.create = AsyncMock(return_value=mock_resp)
    return service


@pytest.fixture
def app(settings, mock_service):
    app = create_app(settings)
    app.dependency_overrides[get_service] = lambda: mock_service
    return app
```

- [ ] **Step 5: Write integration tests for the endpoint**

File: `tests/test_api.py`
```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from starlette.testclient import TestClient

from app.main import create_app
from app.config import Settings


def test_health_returns_ok():
    settings = Settings(_env_file=None, provider_api_key="key")
    app = create_app(settings)
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_chat_completion_returns_400_on_invalid_body():
    settings = Settings(_env_file=None, provider_api_key="key")
    app = create_app(settings)
    client = TestClient(app)
    resp = client.post("/v1/chat/completions", json={})
    assert resp.status_code == 422


def test_chat_completion_integration(settings):
    from unittest.mock import AsyncMock, MagicMock
    from app.api.chat import get_service
    from app.main import create_app
    from app.services.chat import ChatService

    service = ChatService(settings)
    mock_resp = MagicMock()
    mock_resp.model_dump.return_value = {
        "id": "cmpl-mock",
        "object": "chat.completion",
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": "Hello!"},
            "finish_reason": "stop",
        }],
        "usage": None,
    }
    service.client.chat.completions.create = AsyncMock(return_value=mock_resp)

    app = create_app(settings)
    app.dependency_overrides[get_service] = lambda: service

    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}], "stream": False},
    )
    assert resp.status_code == 200


def test_chat_endpoint_rejects_missing_messages():
    settings = Settings(_env_file=None, provider_api_key="key")
    app = create_app(settings)
    client = TestClient(app)
    resp = client.post("/v1/chat/completions", json={})
    assert resp.status_code == 422
    data = resp.json()
    assert "messages" in str(data)
```

- [ ] **Step 6: Update test_middleware.py tests to use the app fixture**

Replace the existing test_middleware.py with:
```python
import pytest
from starlette.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_auth_disabled_when_no_token(app):
    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert resp.status_code != 401


def test_auth_enabled_rejects_missing_token():
    settings = Settings(
        _env_file=None,
        provider_api_key="key",
        auth_token="secret-123",
    )
    app = create_app(settings)
    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert resp.status_code == 401
    data = resp.json()
    assert data["error"]["type"] == "authentication_error"


def test_auth_enabled_accepts_valid_token():
    settings = Settings(
        _env_file=None,
        provider_api_key="key",
        auth_token="secret-123",
    )
    app = create_app(settings)
    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers={"Authorization": "Bearer secret-123"},
    )
    assert resp.status_code != 401


@pytest.mark.parametrize("method,path", [
    ("get", "/health"),
])
def test_auth_skipped_for_public_endpoints(method, path):
    settings = Settings(
        _env_file=None,
        provider_api_key="key",
        auth_token="secret-123",
    )
    app = create_app(settings)
    client = TestClient(app)
    resp = getattr(client, method)(path)
    assert resp.status_code != 401
```

- [ ] **Step 7: Run tests**

Run: `python -m pytest tests/ -v`
Expected: All tests pass (or as many as possible given mocking setup)

- [ ] **Step 8: Commit**

```bash
git add app/api/__init__.py app/api/chat.py app/main.py tests/conftest.py tests/test_api.py tests/test_middleware.py
git commit -m "feat: add API endpoint and main app factory"
```

---

### Task 6: Docker & Dev Environment

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `.env.example`

- [ ] **Step 1: Create .env.example**

```env
PROVIDER_BASE_URL=https://api.deepseek.com/v1
PROVIDER_API_KEY=your-api-key-here
PROVIDER_DEFAULT_MODEL=deepseek-chat
AUTH_TOKEN=
RATE_LIMIT_PER_MINUTE=60
LOG_LEVEL=INFO
```

- [ ] **Step 2: Create .dockerignore**

```
__pycache__
*.pyc
.env
.git
.gitignore
tests/
docs/
```

- [ ] **Step 3: Create Dockerfile**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY app/ app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 4: Verify the app starts**

Run: `python -c "from app.main import app; print('App loaded successfully')"`
Expected: "App loaded successfully"

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore .env.example
git commit -m "infra: add Docker and dev environment setup"
```

---

### Task 7: Cleanup & Verification

- [ ] **Step 1: Run full test suite**

Run: `python -m pytest tests/ -v`
Expected: All tests pass

- [ ] **Step 2: Verify app boots with uvicorn (smoke test)**

Run: `python -c "from app.main import app; assert any(r.path == '/health' for r in app.routes)"`

- [ ] **Step 3: Final commit**

```bash
git add -A
git status
git commit -m "chore: final cleanup after implementation"
```
