## 1. Project Scaffold

- [ ] 1.1 Initialize Next.js project with TypeScript and App Router
- [ ] 1.2 Install and configure Tailwind CSS v4
- [ ] 1.3 Install and initialize shadcn/ui
- [ ] 1.4 Add shadcn/ui components: `button`, `textarea`
- [ ] 1.5 Create folder structure: `components/chat/`, `lib/`, `hooks/`
- [ ] 1.6 Set up `.env.local` with `NEXT_PUBLIC_BACKEND_URL`

## 2. Backend Integration

- [ ] 2.1 Create `lib/chat.ts` with POST request function
- [ ] 2.2 Implement payload shape: `model`, `messages`, `stream`, `temperature`
- [ ] 2.3 Implement ReadableStream consumption for streaming responses
- [ ] 2.4 Implement AbortController support for cancellation
- [ ] 2.5 Handle non-streaming (full response) fallback
- [ ] 2.6 Handle network and HTTP error responses
- [ ] 2.7 Handle missing `NEXT_PUBLIC_BACKEND_URL` configuration error

## 3. Chat Message Components

- [ ] 3.1 Create `UserMessage` component (dark bubble, white text, right-aligned)
- [ ] 3.2 Create `AssistantMessage` component (light bubble, dark text, left-aligned)
- [ ] 3.3 Create `MessageThread` component (scrollable container, message list)
- [ ] 3.4 Implement auto-scroll to latest message on new content
- [ ] 3.5 Implement scroll-up pause with "scroll to bottom" FAB

## 4. Input Area

- [ ] 4.1 Create `ChatInput` component (auto-grow textarea + send button)
- [ ] 4.2 Implement Enter to send, Shift+Enter for newline
- [ ] 4.3 Disable input while streaming is in progress
- [ ] 4.4 Replace send button with stop button during generation
- [ ] 4.5 Implement stop button to abort the fetch request

## 5. Chat Page and State Management

- [ ] 5.1 Create `app/page.tsx` as the main chat layout
- [ ] 5.2 Implement state management with `useReducer` for messages and streaming state
- [ ] 5.3 Implement empty state (no messages — greeting/placeholder)
- [ ] 5.4 Implement loading/thinking state (waiting for first token)
- [ ] 5.5 Implement error state display for failed requests

## 6. Markdown Rendering

- [ ] 6.1 Install `react-markdown`, `remark-gfm`, and `rehype-highlight`
- [ ] 6.2 Create markdown renderer component for assistant messages
- [ ] 6.3 Style code blocks with monospace font and distinct background
- [ ] 6.4 Style bold, italic, lists, and links

## 7. Streaming Display

- [ ] 7.1 Wire `lib/chat.ts` streaming into the assistant message rendering
- [ ] 7.2 Display incoming tokens incrementally as they arrive
- [ ] 7.3 Show typing/streaming cursor animation on the last token

## 8. Mobile Responsiveness

- [ ] 8.1 Test and fix layout at 375px breakpoint
- [ ] 8.2 Test and fix layout at 768px breakpoint
- [ ] 8.3 Ensure input area fits within viewport with keyboard open on mobile

## 9. Final Verification

- [ ] 9.1 Run `npm run build` and fix any errors
- [ ] 9.2 Verify all states: empty, streaming, error, cancelled
- [ ] 9.3 Run `openspec validate minimal-chat-ui --type change --strict` before archive
