# AGENTS.md — ChatGPT Clone (openCode Agent Instructions)

> This file is the single source of truth for the AI coding agent.
> Read this entire file before writing any code, creating any file, or running any command.
> When in doubt about a decision, refer back to the rules here — do not invent your own conventions.

---

## 1. Project Overview

**What we're building:** A ChatGPT-like web application with streaming AI responses, conversation history, multi-model support, and a clean responsive UI.

**AI Provider:** OpenRouter API (free plan)

- Base URL: `https://openrouter.ai/api/v1`
- The API is OpenAI-compatible — use the OpenAI SDK with a custom `baseURL`
- Rate limits on free plan: **20 requests/minute, 200 requests/day**
- Always handle `429` rate limit errors gracefully in both frontend and backend

---

## 2. Tech Stack


| Layer        | Technology                        | Notes                                       |
| ------------ | --------------------------------- | ------------------------------------------- |
| Frontend     | Next.js 14 (App Router)           | No Pages Router — App Router only           |
| AI Streaming | Native `fetch` + `ReadableStream` | Direct SSE consumption from FastAPI backend |
| Styling      | Tailwind CSS + shadcn/ui          | Utility classes only; modern, polished UI   |
| Auth         | NextAuth.js v5                    | Google + GitHub OAuth                       |
| State        | Zustand + SWR                     | See state hierarchy rules                   |
| Backend      | FastAPI (Python 3.11+)            | Async, Pydantic v2; owns ALL AI logic       |
| Database     | PostgreSQL + SQLAlchemy (async)   | Alembic for migrations                      |
| AI SDK (BE)  | `openai` Python SDK               | `base_url` pointed at OpenRouter            |


---

## 3. Project Structure

### Frontend (`/frontend`)

```
frontend/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (chat)/
│   │   ├── layout.tsx              ← sidebar + main shell
│   │   └── c/
│   │       └── [id]/
│   │           └── page.tsx        ← individual chat thread
├── components/
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   └── StreamingIndicator.tsx
│   ├── sidebar/
│   │   ├── ConversationList.tsx
│   │   └── NewChatButton.tsx
│   ├── settings/
│   │   └── ModelPicker.tsx
│   └── ui/                         ← shadcn/ui primitives only
├── lib/
│   ├── api.ts                      ← thin fetch helpers used by Server Actions
│   ├── auth.ts                     ← NextAuth config
│   └── hooks/
│       ├── useChat.ts              ← custom hook: manages streaming via fetch + ReadableStream
│       └── useConversations.ts     ← SWR fetch + mutations
├── actions/
│   ├── chat.ts                     ← Server Actions: sendMessage (streaming), deleteConversation
│   ├── conversations.ts            ← Server Actions: getConversations, renameConversation
│   ├── models.ts                   ← Server Action: getModels
│   └── users.ts                    ← Server Action: getMe, updateMe
├── store/
│   └── chatStore.ts                ← Zustand: activeId, model, sidebarOpen
├── types/
│   └── chat.ts                     ← Message, Conversation, Model — all types here
├── middleware.ts                   ← auth guard — the ONLY place for auth checks
├── .env.local                      ← never commit
└── .env.example                    ← commit this, list all required vars
```

> **Note:** There is NO `app/api/` folder in the Next.js app. The frontend has no API route handlers.
> Non-streaming data fetching uses **Next.js Server Actions** (`actions/`). Streaming chat is the only
> exception — it uses a client-side `fetch` call directly to FastAPI's SSE endpoint, since Server Actions
> do not support streaming responses.

### Backend (`/backend`)

```
backend/
├── app/
│   ├── api/
│   │   ├── chat.py                 ← POST /chat/stream  (SSE)
│   │   ├── conversations.py        ← CRUD: list, get, delete, rename
│   │   ├── models.py               ← GET /models  (returns hardcoded free list)
│   │   └── users.py                ← GET/PATCH /users/me
│   ├── core/
│   │   ├── config.py               ← pydantic Settings, reads .env
│   │   ├── security.py             ← JWT verify, CORS policy
│   │   └── database.py             ← SQLAlchemy async engine + session
│   ├── services/
│   │   ├── llm_service.py          ← OpenRouter client abstraction
│   │   └── stream_service.py       ← SSE generator, token counting
│   ├── models/
│   │   ├── db/
│   │   │   ├── conversation.py     ← SQLAlchemy ORM
│   │   │   └── message.py
│   │   └── schemas/
│   │       └── chat.py             ← Pydantic request/response schemas
│   └── tests/
│       ├── test_chat.py
│       └── test_conversations.py
├── alembic/                        ← DB migrations
├── main.py                         ← FastAPI app entrypoint
├── requirements.txt
├── .env                            ← never commit
└── .env.example                    ← commit this
```

---

## 4. Available Free Models (OpenRouter — as of May 2026)

**IMPORTANT:** The `/models` endpoint in FastAPI must return ONLY this hardcoded list.
Do NOT call the OpenRouter models API dynamically — the free plan list is curated below.
Model IDs must be passed exactly as shown (with `:free` suffix where listed).

```python
# app/api/models.py — use this exact list
FREE_MODELS = [
    {
        "id": "deepseek/deepseek-v4-flash:free",
        "name": "DeepSeek V4 Flash",
        "provider": "DeepSeek",
        "context_window": 1000000,
        "capabilities": ["tools", "reasoning"],
        "recommended_for": ["general", "reasoning", "coding"],
        "quality_score": 77,
    },
    {
        "id": "minimax/minimax-m2.5:free",
        "name": "MiniMax M2.5",
        "provider": "MiniMax",
        "context_window": 205000,
        "capabilities": ["tools"],
        "recommended_for": ["general"],
        "quality_score": 70,
    },
    {
        "id": "google/gemma-4-31b-it:free",
        "name": "Gemma 4 31B",
        "provider": "Google",
        "context_window": 262000,
        "capabilities": ["vision", "tools"],
        "recommended_for": ["general", "vision"],
        "quality_score": 65,
    },
    {
        "id": "nvidia/nemotron-3-super-120b-a12b:free",
        "name": "Nemotron 3 Super 120B",
        "provider": "NVIDIA",
        "context_window": 1000000,
        "capabilities": ["tools"],
        "recommended_for": ["general", "long-context"],
        "quality_score": 60,
    },
    {
        "id": "openai/gpt-oss-120b:free",
        "name": "GPT OSS 120B",
        "provider": "OpenAI",
        "context_window": 131000,
        "capabilities": ["tools"],
        "recommended_for": ["general"],
        "quality_score": 55,
    },
    {
        "id": "qwen/qwen3-coder:free",
        "name": "Qwen3 Coder",
        "provider": "Qwen",
        "context_window": 1000000,
        "capabilities": ["tools"],
        "recommended_for": ["coding"],
        "quality_score": 41,
    },
    {
        "id": "meta-llama/llama-3.3-70b-instruct:free",
        "name": "Llama 3.3 70B",
        "provider": "Meta",
        "context_window": 131000,
        "capabilities": ["tools"],
        "recommended_for": ["general", "coding"],
        "quality_score": 24,
    },
    {
        "id": "meta-llama/llama-3.2-3b-instruct:free",
        "name": "Llama 3.2 3B",
        "provider": "Meta",
        "context_window": 131000,
        "capabilities": [],
        "recommended_for": ["fast", "lightweight"],
        "quality_score": 16,
    },
]

DEFAULT_MODEL_ID = "deepseek/deepseek-v4-flash:free"
```

---

## 5. Environment Variables

### Frontend `.env.example`

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                        # generate: openssl rand -base64 32
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend `.env.example`

```bash
OPENROUTER_API_KEY=                     # from openrouter.ai dashboard
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/chatapp
JWT_SECRET=                             # generate: openssl rand -base64 32
CORS_ORIGINS=http://localhost:3000
APP_NAME=ChatApp
```

---

## 6. Architecture Rules (Non-Negotiable)

### 6.1 Routing

- **App Router ONLY.** Never create files under `pages/`. The only exception is `pages/_document.tsx` if needed for legacy libraries.
- **Server Components are the default.** Only add `"use client"` when the component uses: `useState`, `useEffect`, `useRef`, event handlers (`onClick`, `onChange`), or browser-only APIs. Never add `"use client"` to silence a TypeScript error.
- **Auth guard lives in `middleware.ts` only.** Never add session checks inside individual `page.tsx` files. The middleware matcher handles all protected routes.

### 6.2 Data Fetching

- **Fetch data in Server Components, pass down as props.** Never use `useEffect` + `fetch` in a component that could be a Server Component.
- **All fetch calls to FastAPI go through `lib/api.ts`.** No raw `fetch()` or `axios` calls inside component files. No hardcoded URLs anywhere except `lib/api.ts`.
- **Client-side mutations use SWR (`useSWRMutation`).** Do not build manual loading/error state with `useState` + `useEffect` for server data.

### 6.3 Components

- **One component per file.** Named exports only. Exception: `page.tsx` and `layout.tsx` must use default exports (Next.js requirement).
- **Max 150 lines per component file.** If a file exceeds 150 lines, split it. Extract event handlers into a custom hook, sub-UI into sub-components.
- **No inline type definitions.** All shared types live in `types/chat.ts`. Import from there.

### 6.4 State Hierarchy (Follow This Exactly)

```
Tier 1 — useState / useReducer
  → UI-only: modal open/close, input value, active tab
  → Lives and dies with the component

Tier 2 — SWR (useSWR, useSWRMutation)
  → Server data: conversations list, user profile, model list
  → Auto-revalidates, deduplicates requests, handles caching

Tier 3 — Zustand (store/chatStore.ts)
  → Cross-component client state: activeConversationId, selectedModel, sidebarOpen
  → Only for state that doesn't need to survive a hard refresh
```

**Never put server data in Zustand. Never use React Context for mutable global state.**

### 6.5 Data Access Pattern — Server Actions + Direct Fetch

- **Server Actions (`actions/`) are the default** for all non-streaming data: fetching conversations, user profile, model list, renaming, deleting. They run on the server, have direct access to `auth()`, and call FastAPI with a server-side `fetch`. Never call these APIs from the client directly.
- **Streaming chat is the only exception.** Server Actions cannot stream responses, so `useChat.ts` calls FastAPI's `/chat/stream` SSE endpoint directly from the browser using `fetch` + `ReadableStream`. Auth tokens are attached via request headers.
- **There is no `app/api/` folder.** Do not create Next.js route handlers.
- Always return typed error shapes from Server Actions: `{ error: string, code: string }`. Never throw raw `Error` objects to the client.

### 6.6 Imports & Types

- **Always use `@/` path aliases.** Never use relative `../../` imports. Configure once in `tsconfig.json`.
- **Never use the `any` type.** Use `unknown` with type narrowing. If TypeScript is fighting you, solve the type problem — do not suppress it with `any`.
- **No `// @ts-ignore` or `// @ts-nocheck`.** Fix the type error properly.

### 6.7 FastAPI Backend Rules

- All endpoints are **async**. Never use synchronous database calls.
- Use **Pydantic v2** for all request/response schemas. No raw `dict` returns.
- The LLM client is instantiated once in `services/llm_service.py` and injected via FastAPI dependency injection — never instantiated inside a route handler.
- CORS is configured in `main.py` using the `CORS_ORIGINS` env var. Never hardcode origins.
- All database sessions are managed via `Depends(get_db)`. Never create sessions manually inside route handlers.

---

## 7. OpenRouter Integration Pattern

### FastAPI — LLM Service

```python
# app/services/llm_service.py
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(
    api_key=settings.OPENROUTER_API_KEY,
    base_url=settings.OPENROUTER_BASE_URL,
    default_headers={
        "HTTP-Referer": "https://your-app-domain.com",  # required by OpenRouter
        "X-Title": settings.APP_NAME,
    }
)
```

### FastAPI — Streaming Endpoint

```python
# app/api/chat.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.post("/chat/stream")
async def stream_chat(request: ChatRequest, db=Depends(get_db)):
    async def event_generator():
        async with client.chat.completions.stream(
            model=request.model,
            messages=request.messages,
        ) as stream:
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield f"data: {chunk.choices[0].delta.content}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

### Next.js — Server Actions (non-streaming)

```typescript
// actions/conversations.ts
"use server";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Conversation } from "@/types/chat";

export async function getConversations(): Promise<Conversation[]> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return api.get("/conversations", session.accessToken);
}

export async function renameConversation(
  id: string,
  title: string,
): Promise<void> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  await api.patch(`/conversations/${id}`, { title }, session.accessToken);
}
```

### Next.js — Streaming Chat (client-side fetch, SSE)

```typescript
// lib/hooks/useChat.ts
"use client";
import { useSession } from "next-auth/react";

export function useChat() {
  const { data: session } = useSession();

  async function sendMessage(
    messages: Message[],
    model: string,
    onChunk: (text: string) => void,
  ) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.accessToken}`,
      },
      body: JSON.stringify({ messages, model }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("rate_limit");
      throw new Error("stream_error");
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          onChunk(line.slice(6));
        }
      }
    }
  }

  return { sendMessage };
}
```

---

## 8. Rate Limit Handling (Free Plan — Critical)

The free plan allows **20 req/min and 200 req/day**. The app must handle this gracefully:

```typescript
// Frontend: handle errors in useChat hook
try {
  await sendMessage(messages, model, onChunk);
} catch (err) {
  if (err instanceof Error && err.message === "rate_limit") {
    toast.error(
      "Rate limit reached. Please wait a moment before sending again.",
    );
  }
}
```

```python
# Backend: catch 429 from OpenRouter and re-raise with clear message
from openai import RateLimitError

try:
    async for chunk in stream:
        yield chunk
except RateLimitError:
    yield 'data: {"error": "rate_limit", "message": "OpenRouter rate limit reached"}\n\n'
```

---

## 9. Development Workflow

### Commands (run from project root)

```bash
# Frontend
cd frontend
pnpm install
pnpm dev                    # starts on :3000
pnpm build                  # production build
pnpm test                   # Vitest

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head        # run migrations
uvicorn main:app --reload   # starts on :8000
pytest -v                   # run tests
```

### Before Submitting Any Code — Agent Checklist

Run through this list mentally before finishing any task:

- No new `"use client"` added without a hook or event handler present
- All non-streaming data fetching uses Server Actions in `actions/` — no client-side fetch for CRUD
- All FastAPI fetch calls go through `lib/api.ts` — no raw fetch URLs in actions or components
- All new types added to `types/chat.ts` — no inline type definitions
- `@/` aliases used for all imports — no `../../` relative paths
- No `any` type used — `unknown` + type guards only
- No `// @ts-ignore` comments
- No `app/api/` route handlers created
- No hardcoded URLs or API keys — always use env vars via `process.env`
- Server Actions return typed error shapes: `{ error: string, code: string }`
- New FastAPI endpoints are async and use `Depends(get_db)`
- New components are under 150 lines
- Tests written for any new FastAPI endpoint
- Write in-line comments for places need explanation

---

## 10. Build Phases

### Phase 1 — Core (Weeks 1–4) — Build in This Order

1. **Project scaffold** — Next.js app, FastAPI app, PostgreSQL, env vars wired up
2. **Auth** — NextAuth with Google + GitHub, middleware.ts guard, JWT relay to FastAPI
3. **Streaming chat** — Client `fetch` → FastAPI `/chat/stream` (SSE) → OpenRouter
4. **Chat history** — DB schema (conversations + messages), CRUD endpoints, sidebar list
5. **Markdown rendering** — `react-markdown` + `rehype-highlight` for code blocks
6. **Model picker** — hardcoded free model list from Section 4, saved to Zustand
7. **Responsive layout** — mobile sidebar collapse, auto-scroll on stream

---

## 11. What NOT to Do (Hard Prohibitions)

- **Never push directly to `main`.** All changes via PRs.
- **Never commit `.env` or `.env.local` files.**
- **Never install a library without checking if a lighter alternative exists** (`date-fns` not `moment`, `zustand` not `redux`).
- **Never use `console.log` in production code** — use a proper logger (`pino` on backend, structured logging).
- **Never generate placeholder / lorem ipsum data** — use realistic chat-like seed data in tests.
- **Never mock the OpenRouter API in integration tests** — use a dedicated test API key with a real `:free` model.
- **Never add a database call inside the Next.js frontend** — FastAPI owns the database entirely.
- **Never create `app/api/` route handlers** — use Server Actions for non-streaming calls instead.

