## Why

Modern AI chat interfaces are expected to stream responses token-by-token, render markdown with code blocks, and feel fast. This project needs a clean, focused chat screen as its foundation — the entry point users will interact with daily. Building it now, as a standalone first phase, avoids premature entanglement with auth, history, or settings and lets us validate the UX pattern before adding complexity.

## What Changes

- Scaffold a Next.js 15 project with App Router and TypeScript
- Install and configure Tailwind CSS v4 and shadcn/ui
- Create a full-page chat layout with scrollable message thread and pinned input area
- Implement streaming response support — assistant messages render token-by-token when `stream: true`
- Add markdown rendering for assistant messages (code blocks, bold, lists)
- Build a single `lib/chat.ts` function that POSTs to a configurable backend URL
- Handle empty state (no messages yet), loading/thinking state (waiting for first token), and input disable while streaming
- Support Enter to send, Shift+Enter for newline, and a Stop/Cancel button during generation
- Keep the design mobile-responsive

## Capabilities

### New Capabilities
- `chat-interface`: The core chat screen — message thread rendering user/assistant bubbles, text input area with keyboard shortcuts, empty state placeholder, streaming token display, loading/thinking state, stop generation control, and auto-scroll behavior
- `backend-integration`: A single `lib/chat.ts` API client that sends POST requests to `NEXT_PUBLIC_BACKEND_URL` with the specified message/stream/temperature payload and consumes a `ReadableStream` response

### Modified Capabilities

*(No existing capabilities are being modified — this is a new project.)*

## Impact

- **New dependencies**: `next`, `react`, `typescript`, `tailwindcss`, `shadcn/ui` components (`button`, `textarea`, `scroll-area`), `react-markdown` + `remark-gfm` for markdown rendering
- **Environment**: `NEXT_PUBLIC_BACKEND_URL` must be set in `.env.local`
- **Scope**: No auth, no sidebar, no chat history persistence, no database — intentionally excluded from Phase 1
- **Folders created**: `app/`, `components/ui/`, `components/chat/`, `lib/`, `hooks/`
