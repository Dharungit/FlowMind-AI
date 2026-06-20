## 1. Dependency Setup

- [x] 1.1 Install `sonner` via npm
- [x] 1.2 Add `<Toaster />` to the root layout in `src/app/layout.tsx`

## 2. Types and API Client

- [x] 2.1 Create `src/features/memory/types.ts` with `Memory`, `MemoryUsage`, `MemoryListResponse` interfaces
- [x] 2.2 Create `src/features/memory/api/memory-client.ts` using `apiClient` with `getUsage()`, `list()`, `delete()` methods

## 3. Memory State Store

- [x] 3.1 Create `src/features/memory/store/memoryTypes.ts` with `MemoryState` and `MemoryAction` types
- [x] 3.2 Create `src/features/memory/store/memoryReducer.ts` with `SET_MEMORY_USAGE` and `RESET_MEMORY_USAGE` actions
- [x] 3.3 Create `src/features/memory/store/MemoryContext.tsx` with `MemoryProvider`, `useMemoryContext`, and initial state
- [x] 3.4 Integrate `MemoryProvider` into the chat layout or root layout

## 4. TanStack Query Hooks

- [x] 4.1 Create `src/features/memory/hooks/use-memory.ts` with `useMemoryUsageQuery()` — fetches GET /v1/users/me/memory-usage, dispatches to store on success
- [x] 4.2 Add `useMemoriesQuery()` — fetches GET /v1/memories, syncs response.usage to store on success
- [x] 4.3 Add `useDeleteMemoryMutation()` — deletes via DELETE /v1/memories/{memoryId}, invalidates both queries on success, shows toast

## 5. Shared Components

- [x] 5.1 Create `src/components/shared/ConfirmDialog.tsx` — reusable `@base-ui/react/dialog` with configurable title, description, confirm/cancel labels, destructive styling

## 6. Memory UI Components

- [x] 6.1 Create `src/features/memory/components/MemoryPill.tsx` — fully rounded pill button reading from MemoryContext, colored percentage text
- [x] 6.2 Create `src/features/memory/components/MemoryList.tsx` — scrollable list with auto-wrap text rows, delete button per item, empty state
- [x] 6.3 Create `src/features/memory/components/MemoryModal.tsx` — `@base-ui/react/dialog` with usage stats row, refresh button (RotateCw), embedded MemoryList
- [x] 6.4 Integrate MemoryPill into `src/components/layout/Header.tsx` (right side, before UserMenu)

## 7. Delete Flow

- [x] 7.1 Wire delete button in MemoryList to open ConfirmDialog
- [x] 7.2 Wire ConfirmDialog confirm action to call `useDeleteMemoryMutation().mutate(memoryId)`
- [x] 7.3 Handle success: refresh list + usage + show success toast
- [x] 7.4 Handle error: show error toast, keep list unchanged

## 8. Verification

- [x] 8.1 Run lint to verify no TypeScript or style errors
- [x] 8.2 Build the application to verify no build errors
- [x] 8.3 Run `openspec validate memory-management-ui --type change --strict` before archive
