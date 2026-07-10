## Why

After the SSE stream completes for an existing conversation, the newly sent user message and assistant response disappear from the chat view. The `pendingMessages` and `streamingEntry` are cleared on `STREAM_DONE`, but the cached conversation data hasn't been updated with the new exchange. Additionally, the memory modal has a double scrollbar from nested scroll containers, and the sidebar New Chat / Search buttons have inconsistent styling.

## What Changes

- Seed the conversation cache with appended user + assistant messages **before** `STREAM_DONE` so the new exchange is always visible
- Invalidate single-conversation cache for existing conversations on stream completion so real server data replaces seeded placeholder IDs
- Remove redundant `max-h-[400px] overflow-y-auto` from `MemoryList` to eliminate double scrollbar
- Make New Chat and Search buttons visually consistent: plain text buttons with `hover:bg-[#F5F5F5]` only, no default background
- Change New Chat icon from `Plus` to `SquarePlus`
- Fix Search button text color to match New Chat (`text-[#171717]` instead of `text-[#737373]`)

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `title-generation`: Fix the cache seeding logic to handle existing conversations (append new messages instead of replacing)

## Impact

- `src/features/conversations/hooks/useStreamMessage.ts` — seed cache for ALL conversations, invalidate single conv for existing
- `src/features/memory/components/MemoryList.tsx` — remove inner scroll container
- `src/features/conversations/components/NewChatButton.tsx` — remove default bg, change icon
- `src/features/conversations/components/ConversationSidebar.tsx` — fix search button text color
