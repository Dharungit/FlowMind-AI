## Context

The current codebase has two completely separate HTTP client implementations:
- `features/auth/api/auth-client.ts`: `AuthApiClient` class with Bearer token injection, 401 auto-refresh, and JSON response parsing
- `lib/chat.ts`: Raw `fetch()` calls to `/v1/chat/completions` with no `Authorization` header, no 401 handling

Chat messages are state-managed via an inline `useReducer` in `app/page.tsx`, mixing API call logic with UI state. The middleware for auth route protection lives in `proxy.ts` instead of `middleware.ts`, so Next.js never auto-registers it.

ADRs in force: 0001 (shadcn/ui + Tailwind) is UI-only and non-constraining here. 0002 (native fetch for streaming) commits us to using native `fetch` + `ReadableStream` + `AbortController` — the design below preserves this by extending `AuthApiClient` with a `stream()` method that returns the raw `Response` rather than wrapping SSE parsing.

## Goals / Non-Goals

**Goals:**
- Chat/completion requests include `Authorization: Bearer <token>` from the session
- 401 responses trigger automatic token refresh (same as auth endpoints)
- SSE streaming continues to work (native `fetch` + `ReadableStream`)
- `sendMessageNonStreaming` URL bug is fixed
- API call logic is separated from UI state management
- Consistent folder structure under `features/`
- Auth route protection is active via `middleware.ts`

**Non-Goals:**
- No changes to the chat UI components themselves (message-thread, chat-input, etc.)
- No changes to the NextAuth configuration or auth provider setup
- No changes to backend API contract
- No addition of new dependencies

## Architecture

```mermaid
flowchart TD
    subgraph Browser[Browser]
        subgraph UI[UI Layer - app/page.tsx]
            ChatPage[ChatPage]
        end

        subgraph State[State Layer - features/chat/hooks/use-chat.ts]
            UseChat[useChat hook\nuseReducer]
        end

        subgraph API[API Layer]
            AuthApiClient[AuthApiClient\nfeatures/auth/api/auth-client.ts\nrequest / get / post / stream]
            ChatClient[ChatClient\nfeatures/chat/api/chat-client.ts\nsendMessage / sendMessageNonStreaming]
        end

        subgraph Auth[Auth Layer]
            Session[NextAuth Session\nJWT with accessToken]
            NextAuth[NextAuth API Route\napp/api/auth/[...nextauth]]
        end

        subgraph Middleware[Route Protection]
            MiddlewareTS[middleware.ts\nredirects unauthenticated]
        end
    end

    subgraph Server[Backend Server]
        ChatAPI[/v1/chat/completions]
        AuthAPI[/v1/auth/me]
        RefreshAPI[/v1/auth/refresh]
    end

    ChatPage --> UseChat
    ChatPage --> MiddlewareTS
    UseChat --> ChatClient
    ChatClient --> AuthApiClient
    AuthApiClient --> Session
    AuthApiClient -->|stream| ChatAPI
    AuthApiClient -->|request| AuthAPI
    AuthApiClient -->|request| RefreshAPI
    Session --> NextAuth
```

**Key flows:**

1. **Chat request (streaming)**: `ChatPage` → `useChat` hook → `ChatClient.sendMessage()` → `AuthApiClient.stream()` → injects Bearer token → `POST /v1/chat/completions` → returns `Response` → SSE parsing in `ChatClient` → token callback → `useChat` dispatch → UI update
2. **Auth refresh**: `AuthApiClient` detects 401 → calls `tryRefresh()` → updates session → retries original request or signs out
3. **Route protection**: `middleware.ts` checks session → redirects to `/auth/signin` if unauthenticated

## UI/UX Design System

This change has zero visual impact — it refactors the API calling flow, state extraction, and middleware naming. No colors, typography, spacing, or component patterns are modified. The ui-ux-pro-max and frontend-design skills are not applicable to this change.

## Decisions

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| Streaming approach | `stream()` returns `Response`, caller parses SSE | Keeps `AuthApiClient` focused on auth+transport. SSE parsing is chat-specific and belongs in `ChatClient`. Consistent with ADR 0002 (native fetch streaming). | Returning `AsyncGenerator` would couple auth client to SSE format |
| Folder structure | API in `features/chat/api/`, hooks in `features/chat/hooks/`, UI stays in `components/chat/` | Mirrors auth module structure. UI components don't need to move since they aren't changing. | Moving UI into `features/chat/components/` would be churn with no benefit |
| State extraction | `useReducer` extracted to `features/chat/hooks/use-chat.ts` | Clean separation: hook owns state, page owns rendering. The reducer actions are unchanged. | Zustand — overkill for single-page chat state |
| Middleware naming | Rename `proxy.ts` → `middleware.ts` | Next.js only auto-discovers `middleware.ts` at the project root. The proxy function was dead code. | Keeping as-is — but it doesn't work |
| Error handling | `ChatClient` catches `ApiError` from `AuthApiClient` and surfaces via callbacks | Reuses existing `ApiError` class. Consistent error shape across all API calls. | Creating a separate error type |

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| `AuthApiClient.stream()` returns raw `Response` — caller must close/consume body | Leaked connections if caller forgets | `stream()` is used only inside `ChatClient.sendMessage()` which always consumes via `ReadableStream` reader |
| `stream()` doesn't JSON-parse — error responses (non-200) come back as `Response` | ChatClient needs to handle non-200 manually | `stream()` throws `ApiError` on non-2xx (same as `request()`), establishing a consistent error path before returning the response body for 2xx |
| Middleware rename (`proxy.ts` → `middleware.ts`) may affect existing routes | Unexpected redirect behavior | Current `proxy.ts` has a `config.matcher` — will preserve same patterns |
| Chat message state in `useChat` hook uses `state.messages` snapshot inside `useCallback` | Stale closure when sending multiple messages rapidly | Existing pattern in `app/page.tsx` already has this issue — no regression, preserved as-is |

## Migration Plan

**Step 1**: Add `stream()` method to `AuthApiClient` (`features/auth/api/auth-client.ts`)
**Step 2**: Create `features/chat/api/chat-client.ts` with `sendMessage` and `sendMessageNonStreaming` using `apiClient.stream()` and `apiClient.post()`
**Step 3**: Create `features/chat/hooks/use-chat.ts` with extracted `reducer`, `initialState`, and `ChatState` / `ChatAction` types
**Step 4**: Update `app/page.tsx` to import from new locations
**Step 5**: Remove `lib/chat.ts`
**Step 6**: Rename `proxy.ts` → `middleware.ts`
**Step 7**: Verify: chat sends with Authorization header, 401 triggers refresh, abort works, streaming renders tokens

Rollback: Reverse all file changes, restore `lib/chat.ts`, rename `middleware.ts` back to `proxy.ts`.

## Open Questions

- None — all design decisions have been resolved through the grill-me process.
