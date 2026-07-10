## Context

Currently, `<Header />` and `<Sidebar />` are rendered in `src/app/layout.tsx` (root layout), which wraps all route groups including `(auth)`. This means login pages display app chrome (conversation list, user menu, sidebar toggle) before authentication — unnecessary rendering and exposure of session-gated UI.

## Goals / Non-Goals

**Goals:**
- Header and Sidebar render only in `(chat)/*` routes
- Root layout becomes a providers-only shell
- Zero visual or behavioural change to chat pages
- Zero change to auth pages (they should remain clean)

**Non-Goals:**
- No component refactors — Header, Sidebar, and their internals stay identical
- No provider restructuring — all providers remain in root layout
- No new routes or capabilities

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Destination for Header/Sidebar | `(chat)/layout.tsx` | Only route group that needs app chrome |
| Provider placement | All stay in root layout | Auth pages need `AuthProviders`/`AuthProvider` for session-based redirect; `UIProvider` and `ConversationProvider` have no visible effect without Header/Sidebar |
| Chrome div structure | Moves with Header/Sidebar | The `flex h-full flex-col` wrapper is purely structural for the chrome layout |
| Auth layout | No change | Already a pass-through — login page has its own `min-h-dvh` centering |

## Migration Plan

1. **Root layout** (`src/app/layout.tsx`) — Remove `Header`/`Sidebar` imports and the chrome `<div>` wrapper. Keep `<main>{children}</main>` with its class.
2. **Chat layout** (`src/app/(chat)/layout.tsx`) — Import `Header` and `Sidebar`, add the chrome `<div>` structure around `<ChatProvider>{children}</ChatProvider>`.
3. Verify — login page has no chrome, chat pages render identically.

Rollback: revert both files.

## Risks / Trade-offs

- **No risk** — this is purely mechanical. Header and Sidebar consume the same providers (UIProvider, AuthProvider, ConversationProvider) that are already ancestors in the root layout.

## Open Questions

- None.
