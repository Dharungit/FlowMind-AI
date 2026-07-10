## 1. Project Scaffold

- [x] 1.1 Initialize Next.js project with TypeScript and App Router
- [x] 1.2 Install and configure Tailwind CSS v4
- [x] 1.3 Install and initialize shadcn/ui
- [x] 1.4 Add shadcn/ui components: `button`, `textarea`
- [x] 1.5 Create folder structure: `components/chat/`, `lib/`, `hooks/`
- [x] 1.6 Set up `.env.local` with `NEXT_PUBLIC_BACKEND_URL`

## 2. Backend Integration

- [x] 2.1 Create `lib/chat.ts` with POST request function
- [x] 2.2 Implement payload shape: `model`, `messages`, `stream`, `temperature`
- [x] 2.3 Implement ReadableStream consumption for streaming responses
- [x] 2.4 Implement AbortController support for cancellation
- [x] 2.5 Handle non-streaming (full response) fallback
- [x] 2.6 Handle network and HTTP error responses
- [x] 2.7 Handle missing `NEXT_PUBLIC_BACKEND_URL` configuration error

## 3. Chat Message Components

- [x] 3.1 Create `UserMessage` component (dark bubble, white text, right-aligned)
- [x] 3.2 Create `AssistantMessage` component (light bubble, dark text, left-aligned)
- [x] 3.3 Create `MessageThread` component (scrollable container, message list)
- [x] 3.4 Implement auto-scroll to latest message on new content
- [x] 3.5 Implement scroll-up pause with "scroll to bottom" FAB

## 4. Input Area

- [x] 4.1 Create `ChatInput` component (auto-grow textarea + send button)
- [x] 4.2 Implement Enter to send, Shift+Enter for newline
- [x] 4.3 Disable input while streaming is in progress
- [x] 4.4 Replace send button with stop button during generation
- [x] 4.5 Implement stop button to abort the fetch request

## 5. Chat Page and State Management

- [x] 5.1 Create `app/page.tsx` as the main chat layout
- [x] 5.2 Implement state management with `useReducer` for messages and streaming state
- [x] 5.3 Implement empty state (no messages — greeting/placeholder)
- [x] 5.4 Implement loading/thinking state (waiting for first token)
- [x] 5.5 Implement error state display for failed requests

## 6. Markdown Rendering

- [x] 6.1 Install `react-markdown`, `remark-gfm`, and `rehype-highlight`
- [x] 6.2 Create markdown renderer component for assistant messages
- [x] 6.3 Style code blocks with monospace font and distinct background
- [x] 6.4 Style bold, italic, lists, and links

## 7. Streaming Display

- [x] 7.1 Wire `lib/chat.ts` streaming into the assistant message rendering
- [x] 7.2 Display incoming tokens incrementally as they arrive
- [x] 7.3 Show typing/streaming cursor animation on the last token

## 8. Mobile Responsiveness

- [x] 8.1 Test and fix layout at 375px breakpoint
- [x] 8.2 Test and fix layout at 768px breakpoint
- [x] 8.3 Ensure input area fits within viewport with keyboard open on mobile

## 9. Final Verification

- [x] 9.1 Run `npm run build` and fix any errors
- [x] 9.2 Verify all states: empty, streaming, error, cancelled
- [x] 9.3 Run `openspec validate minimal-chat-ui --type change --strict` before archive
