## Context

This is a greenfield Phase 1 of an AI chat SaaS. The entire user-facing surface is a single chat screen — no sidebar, no auth, no persistence. The app is a Next.js frontend that talks to an existing backend API over HTTPS. No backend work is in scope; the backend URL is configured via `NEXT_PUBLIC_BACKEND_URL`. The target is a fast, mobile-responsive chat experience with streaming token output and markdown-rendered assistant messages.

## Goals / Non-Goals

**Goals:**
- Scaffold a Next.js 15 project with App Router and TypeScript
- Implement a full-page chat layout with scrollable message thread and pinned input
- Support streaming responses (token-by-token rendering when `stream: true`)
- Render assistant messages as markdown (code blocks, bold, lists)
- Provide a `lib/chat.ts` function that POSTs the defined payload shape and consumes a ReadableStream
- Handle all states: empty (no messages), loading/thinking (waiting for first token), streaming, error
- Allow the user to stop/cancel an in-flight generation
- Support Enter to send, Shift+Enter for newline
- Be mobile-responsive down to 375px

**Non-Goals:**
- No auth, login, or user management
- No sidebar, history panel, or chat list
- No chat persistence or database
- No settings or configuration screens
- No backend implementation — frontend only
- No i18n, no theming system beyond dark/light via Tailwind

## Architecture

### System Context (C4 Level 1 — lightweight ASCII)

```
+-----------+      HTTPS       +---------------------+      HTTPS       +--------------+
|  User     | ---------------> |   Next.js App       | ---------------> |  Backend     |
| (Browser) | <--------------- | (FlowMind Chat)     | <--------------- |  API         |
+-----------+   streamed SSE   +---------------------+    SSE chunks    +--------------+
                                                   |
                                                   | env: NEXT_PUBLIC_BACKEND_URL
                                                   v
                                           +-------------------+
                                           | .env.local        |
                                           +-------------------+
```

**Boundaries:** The browser runs the Next.js SPA. The SPA calls a single backend endpoint at `NEXT_PUBLIC_BACKEND_URL/api/chat` for all conversation requests. The backend streams responses back as SSE/ReadableStream.

### Container View

```
+-------------------------------------------------------+
|                  Next.js App (Container)               |
|                                                       |
|  +----------+   +-----------+   +------------------+  |
|  | App      |-->| Chat      |-->| lib/chat.ts      |  |
|  | Page     |   | Components|   | (API client)      |  |
|  | (layout) |   +-----------+   +------------------+  |
|  +----------+        |                                 |
|                      v                                 |
|               +------------+                           |
|               | Markdown   |                           |
|               | Renderer   |                           |
|               +------------+                           |
+-------------------------------------------------------+
```

**Assumptions:** The backend is already deployed and reachable. No reverse proxy, CDN, or middleware is in scope for Phase 1.

## UI/UX Design System

### Design Direction

The chat interface follows a **minimal single-column** layout — no chrome, no sidebar, no top navigation. The visual identity is built around clarity and speed: high-contrast text on a clean background, generous whitespace, and subtle transitions that make the interaction feel immediate. The chat feels like a blank page you fill with conversation, not a dashboard. The one memorable element is the streaming cursor — a gentle blinking pulse on the last token as it arrives, signaling "I'm still thinking" without a spinner.

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#FFFFFF` | Page and message area |
| Surface | `#F5F5F5` | Input bar, code block bg, message bubble (assistant) |
| User bubble | `#171717` | User message background |
| User text | `#FFFFFF` | User message text |
| Primary text | `#171717` | Body text, headings |
| Secondary text | `#737373` | Timestamps, subtle labels |
| Accent | `#2563EB` | Send button, stop button, links, focus rings |
| Border | `#E5E5E5` | Input area border, dividers |
| Error | `#DC2626` | Error states |

### Typography

- **Display/UI:** Plus Jakarta Sans (weights 400, 500, 600, 700) — friendly and modern without being playful
- **Monospace:** JetBrains Mono (code blocks in messages)
- **Scale:** `text-xs` (timestamps), `text-sm` (body), `text-base` (input), `text-lg` (headings)

### Spacing & Layout

- Full viewport height (`h-dvh`), full width
- Message thread: flex column, `overflow-y-auto`, padding `p-4` on mobile, `p-6` on desktop
- Input area: pinned to bottom, `max-w-3xl` centered, `mx-auto`
- Chat bubbles: `max-w-[85%]` on mobile, `max-w-[70%]` on desktop
- Breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)

### Component Patterns

- **Message bubble (user):** Dark surface (`bg-[#171717]`), white text, rounded-2xl, float right
- **Message bubble (assistant):** Light surface (`bg-[#F5F5F5]`), dark text, rounded-2xl, float left
- **Code block inside messages:** `bg-neutral-900` bg, JetBrains Mono, syntax-highlighted via rehype
- **Input area:** Rounded-xl border, auto-grow textarea, send button (accent icon button)
- **Stop button:** Red accent, appears only during streaming, replaces send button

### UX Guidelines

- **Auto-scroll:** Scroll to bottom when new tokens arrive; user scroll-up pauses auto-scroll, a "scroll to bottom" FAB appears
- **Input state:** Disabled while streaming; show a subtle "Generating..." indicator in the input area
- **Empty state:** Centered illustration or greeting text — "Start a conversation" — nothing busy
- **Error state:** Toast or inline error message; do not clear the input so the user can retry
- **Stop generation:** Replace send button with a stop icon button during streaming; clicking it aborts the `fetch` AbortController
- **Transitions:** 150-200ms for hover/active states on interactive elements
- **Reduced motion:** Respect `prefers-reduced-motion` — disable transition/animation

## Decisions

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| State management | React `useReducer` + context | No external deps needed for a single-page chat. Keeps bundle small. | Redux (overkill), Zustand (adds dep) |
| Streaming approach | `fetch` + `ReadableStream` + `AbortController` | Native browser APIs, no extra deps. | SSE library, Server-Sent Events polyfill |
| Markdown rendering | `react-markdown` + `remark-gfm` + `rehype-highlight` | Mature, extensible, tree-shakeable. | `marked` (less React-friendly) |
| Styling | Tailwind CSS v4 | Project already uses it, utility-first. | CSS Modules, styled-components |
| UI components | shadcn/ui | Accessible, composable, tree-shakeable. | Headless UI, Radix primitives |
| Icon set | Lucide React | Consistent, lightweight, works with shadcn. | Heroicons (also fine) |
| Textarea | Native textarea + auto-resize | No rich text needed. Simple, no deps. | TipTap, Lexical (overkill) |

## Risks / Trade-offs

- **[No persistence] -> Mitigation:** Phase 1 explicitly excludes persistence. If the backend is unreliable, the user loses their conversation. Acceptable for now.
- **[Streaming on slow networks] -> Mitigation:** Show a "Connecting..." state before the first token. Use a generous timeout. The stop button lets the user cancel.
- **[Backend URL misconfiguration] -> Mitigation:** Validate on first render — if `NEXT_PUBLIC_BACKEND_URL` is missing, show a clear configuration error inline.
- **[Large messages cause layout shift] -> Mitigation:** Code blocks get a max-height with scroll; long messages word-break.

## Migration Plan

1. `npx create-next-app@latest` with TypeScript and App Router
2. `npm install tailwindcss @tailwindcss/postcss` and configure
3. `npx shadcn@latest init` and add `button`, `textarea`
4. Create folder structure: `components/chat/`, `lib/`, `hooks/`
5. Implement `lib/chat.ts` — the API client
6. Implement `components/chat/` — message thread, input, bubbles
7. Implement `app/page.tsx` — compose all components
8. Set `.env.local` with `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080`

No rollback strategy needed — this is additive, greenfield code. If something breaks, `git revert`.

## Open Questions

- What is the exact backend endpoint path? (e.g., `/api/chat`, `/v1/chat/completions`) — update `lib/chat.ts` accordingly.
- What is the backend's streaming format? (NDJSON lines, SSE events, plain text chunks?) — determines how we parse the ReadableStream.
- Should error responses from the backend follow a standard shape? — affects error display in the UI.
