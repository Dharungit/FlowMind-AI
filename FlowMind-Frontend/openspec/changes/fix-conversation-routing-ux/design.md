## Context

The conversation state management relies on `ConversationContext` (`useReducer`) for the `activeConversationId` and on local component state in `ChatPage` for optimistic `pendingMessages`. Two bugs emerge from this split:

1. **Delete**: `useDeleteConversation` clears the active ID but never navigates, leaving the user on a stale URL.
2. **New conversation first message**: When `useSendMessage` creates a conversation, dispatches `SET_ACTIVE`, and calls `router.replace`, `ChatPage` unmounts/remounts. The local `pendingMessages` state is lost. The `useConversation` query loads but may return no messages before the stream completes, causing the empty state to flash.

## Goals / Non-Goals

**Goals:**
- After deleting the active conversation, navigate to `/`
- Preserve the optimistic user message across the route change so the UI shows the user message + loading indicator, never the empty state placeholder

**Non-Goals:**
- No backend changes
- No changes to streaming or message sending logic
- No changes to other optimistic UI (rename, etc.)

## Architecture

```mermaid
flowchart TD
    subgraph "Delete Flow (fixed)"
        delUser[User deletes conversation]
        delHook[useDeleteConversation.onSuccess]
        delCheck{activeConversationId === deletedId?}
        delClear[CLEAR_ACTIVE]
        delNav[router.push /]
        delUser --> delHook
        delHook --> delCheck
        delCheck -->|yes| delClear
        delClear --> delNav
    end

    subgraph "First Message Flow (fixed)"
        send[User sends first message]
        setPending[SET_PENDING_MESSAGE stored in ConversationContext]
        createConv[create conversation]
        setActive[SET_ACTIVE]
        replaceRoute[router.replace /c/newId]
        render[ChatPage renders]
        checkPending{pendingMessage exists?}
        showMsg[Show user message + typing indicator]
        streamComplete[Stream completes, real messages arrive]
        clearPending[CLEAR_PENDING_MESSAGE]

        send --> setPending
        setPending --> createConv
        createConv --> setActive
        setActive --> replaceRoute
        replaceRoute --> render
        render --> checkPending
        checkPending -->|yes| showMsg
        showMsg --> streamComplete
        streamComplete --> clearPending
    end

    classDef fixed fill:#e8f5e9,stroke:#2e7d32
    class delNav,setPending,fixed
```

## Decisions

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| Pending message storage | `ConversationContext` (global state) | Survives component unmount/remount during route change; minimal surface area | URL query param (pollutes URL), sessionStorage (overkill for ephemeral state), keep local + guard empty state with `isSending` (fixes flash but loses user message display) |
| Delete navigation | `router.push("/")` in `useDeleteConversation.onSuccess` | Centralized in the hook alongside CLEAR_ACTIVE; no component needs to coordinate | Navigate in ConversationSidebar (separates concerns but requires the sidebar to know about conversation page state) |
| CLEAR_ACTIVE also clears pending | Extra action payload in reducer | Prevents stale pending message from appearing when starting a new chat after deleting | Leave pending as-is (would show ghost message on next chat) |

## Risks / Trade-offs

- [Pending message leaks across conversations] → `CLEAR_ACTIVE` also clears `pendingUserMessage` in the reducer
- [Multiple rapid sends] → Each send overwrites `pendingUserMessage`; should be fine since only one mutation runs at a time

## Migration Plan

No data migration. Pure client-side state refactor. Rollback: revert the three changed files.

## Open Questions

- None
