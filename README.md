# FLowMind — ChatGPT Clone

A production-grade, full-stack AI chat application with Google OAuth authentication, persistent conversations, token-by-token streaming, a long-term vector memory system, and comprehensive analytics dashboards.

**GitHub:** https://github.com/Dharungit/FlowMind-AI.git

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **UI / Styling** | shadcn/ui (Radix-based primitives), Tailwind CSS v4, Lucide Icons |
| **State Management** | React Context + useReducer (4 stores) + TanStack React Query v5 |
| **Auth (Frontend)** | NextAuth.js v4 (Google Provider, JWT session strategy) |
| **Backend Framework** | FastAPI (async), Python 3.11+, Uvicorn |
| **Database** | PostgreSQL 16 + pgvector extension |
| **ORM / Migrations** | SQLAlchemy 2.0 (async) + Alembic |
| **LLM Client** | OpenAI-compatible SDK (provider-agnostic, defaults to **DeepSeek**) |
| **Embeddings** | OpenAI `text-embedding-3-small` via pgvector |
| **Streaming** | Native `fetch` + `ReadableStream` + `AbortController` (SSE) |
| **Validation** | Pydantic v2 |
| **Logging** | structlog |
| **Testing** | pytest + pytest-asyncio + httpx |
| **Containerization** | Docker + docker-compose |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js 16)              │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ (auth)   │  │ (chat)   │  │  (dashboard)      │  │
│  │  /login  │  │  /       │  │  /analytics        │  │
│  │          │  │  /c/[id] │  │  /admin/analytics  │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Providers: Session → QueryClient → App →     │  │
│  │  Auth → Conversation → UI → Toaster           │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  State: 4× Context+useReducer + React Query   │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / SSE
                       ▼
┌─────────────────────────────────────────────────────┐
│              Backend (FastAPI)                       │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Middleware: CORS → Logging → RateLimit → JWT │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Auth API │  │ Chat API │  │ Analytics API     │  │
│  │ /v1/auth │  │ /v1/conv │  │ /v1/analytics     │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Services: Chat, Conversation, Message,        │  │
│  │  Memory, Embedding, Usage, Analytics, Auth     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  DB: PostgreSQL 16 + pgvector                  │  │
│  │  Tables: users, sessions, conversations,        │  │
│  │  messages, usage_events, memories               │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Project Structure

```
FLowMind (ChatGPT-Clone)/
├── FlowMind-Frontend/          # Next.js 16 application
│   ├── src/
│   │   ├── app/                # App Router pages & layouts
│   │   │   ├── (auth)/         # Login page
│   │   │   ├── (chat)/         # Chat interface (catch-all [convId])
│   │   │   ├── (dashboard)/    # Analytics pages
│   │   │   └── api/auth/       # NextAuth route handler
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   ├── chat/           # Chat-specific components
│   │   │   ├── layout/         # Header, Sidebar
│   │   │   └── shared/         # Reusable UI components
│   │   ├── features/           # Domain-driven modules
│   │   │   ├── auth/           # Auth API, hooks, components
│   │   │   ├── conversations/  # CRUD, streaming, search
│   │   │   ├── analytics/      # Charts, tables, summary cards
│   │   │   └── memory/         # Memory pill, modal, list
│   │   └── store/              # Context + useReducer stores
│   └── package.json
│
├── FLowMind-Backend/           # FastAPI application
│   ├── app/
│   │   ├── api/                # Route handlers (analytics, auth, chat, memory)
│   │   ├── schemas/            # Pydantic models
│   │   ├── services/           # Business logic (10 services)
│   │   ├── models.py           # SQLAlchemy ORM models
│   │   ├── middleware.py       # JWT, rate limit, logging middleware
│   │   ├── database.py         # Async engine + session
│   │   ├── config.py           # Pydantic Settings
│   │   └── main.py             # FastAPI app factory
│   ├── alembic/                # Database migrations (5 versions)
│   ├── tests/                  # pytest suite (14 test files)
│   ├── docker-compose.yml      # PostgreSQL + API
│   └── Dockerfile
│
└── README.md                   # This file
```

---

## Features

### Core Chat
| Feature | Description |
|---|---|
| **Google OAuth Login** | Sign in with Google; JWT access tokens (15m) + refresh token rotation (7d) |
| **Conversation CRUD** | Create, list, search (full-text with highlighted snippets), rename, delete |
| **Streaming AI Responses** | SSE token-by-token streaming via native ReadableStream; cancelable with AbortController |
| **Non-Streaming Messages** | Fallback POST endpoint for simple message exchange |
| **Auto Title Generation** | LLM generates concise 5-word titles after the second user message |
| **Markdown Rendering** | GFM-compliant rendering of assistant messages (react-markdown + remark-gfm) |
| **Tool / Function Calling** | OpenAI-compatible tool definitions; model can respond with tool_calls |

### Memory System
| Feature | Description |
|---|---|
| **Vector Memory Storage** | Long-term facts stored as embeddings in PostgreSQL via pgvector |
| **LLM Fact Extraction** | Background task analyzes conversations to extract durable user facts |
| **Memory Limit Enforcement** | Configurable per-user memory cap |
| **Memory Management UI** | Header usage pill → modal with list → inline delete |
| **Similarity Search** | Cosine similarity retrieval of relevant memories per conversation |

### Analytics
| Feature | Description |
|---|---|
| **User Analytics** | Token usage summary + daily usage chart (Chart.js) |
| **Admin Analytics** | Platform-wide stats: usage/user, cost/user, feature breakdown, cache analysis, peak hours |
| **Usage Events** | Per-request token/cost tracking (provider, model, feature, cached vs non-cached) |
| **Pricing Engine** | Cost calculation for `deepseek-chat` and `text-embedding-3-small` |

### Infrastructure
| Feature | Description |
|---|---|
| **Rate Limiting** | In-memory sliding window per IP (configurable, 60 req/min default) |
| **Structured Logging** | structlog for request-scoped, machine-parseable logs |
| **Docker Compose** | One-command setup: PostgreSQL 16 (pgvector) + FastAPI with auto-migrations |
| **Responsive Design** | Desktop sidebar + mobile overlay navigation |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Health check |
| `POST` | `/v1/auth/google` | Public | Google OAuth login |
| `POST` | `/v1/auth/refresh` | Public | Rotate refresh token |
| `POST` | `/v1/auth/logout` | JWT | Invalidate session(s) |
| `GET` | `/v1/auth/me` | JWT | Current user profile |
| `POST` | `/v1/conversations` | JWT | Create conversation |
| `GET` | `/v1/conversations` | JWT | List user's conversations |
| `GET` | `/v1/conversations/search?q=` | JWT | Search conversations |
| `GET` | `/v1/conversations/{id}` | JWT | Get conversation + messages |
| `PUT` | `/v1/conversations/{id}` | JWT | Update conversation title |
| `DELETE` | `/v1/conversations/{id}` | JWT | Delete conversation |
| `POST` | `/v1/conversations/{id}/generate-title` | JWT | AI-generated title |
| `POST` | `/v1/conversations/{id}/messages` | JWT | Add message (non-streaming) |
| `DELETE` | `/v1/messages/{id}` | JWT | Delete a message |
| `POST` | `/v1/stream` | JWT | Streaming chat completion (SSE) |
| `GET` | `/v1/memories` | JWT | List user memories |
| `DELETE` | `/v1/memories/{id}` | JWT | Delete a memory |
| `GET` | `/v1/users/me/memory-usage` | JWT | Memory usage stats |
| `GET` | `/v1/analytics/user` | JWT | User token analytics |
| `GET` | `/v1/analytics/admin` | JWT + Admin | Platform analytics |

---

## Database Schema

| Table | Key Columns | Purpose |
|---|---|---|
| `users` | `id` (UUID), `google_sub`, `email`, `display_name`, `avatar_url`, `extra_data` (JSONB) | User accounts |
| `sessions` | `id`, `user_id` (FK), `refresh_token_hash`, `expires_at`, `is_invalidated` | Auth sessions with rotation |
| `conversations` | `id` (UUID), `user_id` (FK), `title`, `title_generated` | Chat threads |
| `messages` | `id`, `conversation_id` (FK), `role`, `content` (Text), `metadata` (JSONB) | Individual messages |
| `usage_events` | `id`, `user_id` (FK), `model`, `feature`, `input_tokens`, `output_tokens`, `cached_input_tokens`, `estimated_cost` | Per-request token tracking |
| `memories` | `id`, `user_id` (FK), `memory` (Text), `memory_type`, `importance`, `embedding` (vector(1536)) | Long-term vector memory |

---

## Key Design Decisions

1. **shadcn/ui over MUI/Chakra** — Full source-level customization, tree-shakable, accessible Radix primitives.
2. **Native fetch streaming** — Zero dependencies for SSE; POST support with JSON body; native AbortController support for cancellation.
3. **React Context + useReducer (not Redux/Zustand)** — Lightweight for 4 small UI stores; TanStack Query handles all server state (caching, refetching, mutations).
4. **FastAPI async throughout** — Non-blocking I/O for streaming responses and high concurrency.
5. **pgvector in PostgreSQL** — Avoids a separate vector database; enables hybrid relational + vector queries.
6. **LLM-provider-agnostic** — OpenAI-compatible client format; switch between DeepSeek, OpenAI, Anthropic, or any compatible provider via env vars.
7. **Separate frontend/backend auth** — NextAuth.js on frontend with Google provider; custom PyJWT implementation on backend; Google ID token bridge.
8. **Background memory extraction** — Runs as a background FastAPI task after streaming completes; doesn't block the response.
9. **OpenSpec methodology** — Architecture Decision Records (ADRs) in `adr/` directories; intent-driven development workflow via OpenSpec.

---

## Quick Start

### Docker (recommended)

```bash
# Backend
cd FLowMind-Backend
cp .env.example .env
# Edit .env — set PROVIDER_API_KEY, GOOGLE_CLIENT_ID, JWT_SECRET
docker compose up --build

# Frontend
cd FlowMind-Frontend
cp .env.example .env.local
# Edit .env.local with the same Google OAuth credentials
npm install
npm run dev
```

### Manual (Backend)

```bash
cd FLowMind-Backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install ".[dev]"
cp .env.example .env
# Edit .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Manual (Frontend)

```bash
cd FlowMind-Frontend
cp .env.example .env.local
# Edit .env.local
npm install
npm run dev
```

---

## Environment Variables

### Backend (`FLowMind-Backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PROVIDER_BASE_URL` | `https://api.deepseek.com/v1` | LLM provider base URL |
| `PROVIDER_API_KEY` | *(required)* | Provider API key |
| `PROVIDER_DEFAULT_MODEL` | `deepseek-chat` | Default model |
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | *(required)* | Google OAuth client ID |
| `JWT_SECRET` | *(required)* | JWT signing secret |
| `OPENAI_API_KEY` | *(empty)* | API key for embeddings |
| `ADMIN_USER_IDS` | *(empty)* | Comma-separated admin user UUIDs |
| `RATE_LIMIT_PER_MINUTE` | `60` | Max requests/min per IP |

### Frontend (`FlowMind-Frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Backend API base URL |
| `AUTH_SECRET` | Yes | NextAuth secret |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client secret |

---

## Testing

```bash
# Backend
cd FLowMind-Backend
pytest -v

# Frontend
cd FlowMind-Frontend
npm run lint
```

---

## Scripts

### Frontend (`FlowMind-Frontend/`)

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---
