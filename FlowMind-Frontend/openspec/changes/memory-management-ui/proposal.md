## Why

Users have no visibility into how much memory the AI assistant has stored about them. As memory usage grows, users need to understand their storage limits, view stored memories, and manage (delete) unwanted memories. This adds transparency and control to the AI's personalization features.

## What Changes

- Add global memory usage state (`count`, `max`, `percentage`) to a new Memory store via React Context + useReducer
- Add a Memory pill button to the application header showing current usage percentage
- Create a modal displaying memory usage stats and the full list of stored memories
- Add memory list with single-line text display and delete action per row
- Add confirmation dialog before memory deletion
- Add refresh capability for the memory list
- Install `sonner` for toast notifications on success/error
- Build TanStack Query hooks (`useMemoryUsageQuery`, `useMemoriesQuery`, `useDeleteMemoryMutation`) for data fetching and cache management
- Create TypeScript types for `Memory`, `MemoryUsage`, `MemoryListResponse`
- Keep memory usage in sync across the app — query hooks auto-update the global Memory store on fetch success
- Build a reusable `ConfirmDialog` shared component

## Capabilities

### New Capabilities
- `memory-view`: Display memory usage stats and list stored memories
- `memory-delete`: Delete stored memories with confirmation and feedback

### Modified Capabilities

- None

## Impact

- **New dependency**: `sonner` for toast notifications
- **New components**: MemoryPill, MemoryModal, MemoryList, ConfirmDialog
- **New hooks**: `useMemoryUsageQuery`, `useMemoriesQuery`, `useDeleteMemoryMutation`
- **New store**: MemoryContext with reducer for global memory usage state
- **Modified**: `Header.tsx` — add MemoryPill before UserMenu, `layout.tsx` — wrap with MemoryProvider
- **Types added**: `Memory`, `MemoryUsage`, `MemoryListResponse` in `features/memory/types.ts`
- **No breaking changes** — purely additive feature
