## Why

Header and Sidebar components render on the login/auth page because they're in the root layout. This exposes app chrome (conversation list, user menu, sidebar state) to unauthenticated users and wastes rendering. Moving them to the private chat layout only keeps them where they're actually used.

## What Changes

- Move `<Header />` and `<Sidebar />` from `src/app/layout.tsx` (root layout) to `src/app/(chat)/layout.tsx` (private chat layout)
- Convert root layout to a providers-only shell
- `(chat)/layout.tsx` wraps children in the chrome div structure currently in root layout
- No changes to `(auth)/layout.tsx` — login page is self-contained

## Capabilities

### New Capabilities

- _(none — this is a structural refactor, no new behaviour)_

### Modified Capabilities

- _(no spec-level behaviour changes — layout structure only)_

## Impact

- **`src/app/layout.tsx`** — remove `<Header />`, `<Sidebar />`, and the wrapping chrome `<div>`; keep only providers
- **`src/app/(chat)/layout.tsx`** — add `<Header />`, `<Sidebar />`, and the chrome div structure around `<ChatProvider>`
- **No effect on** — auth routes, API routes, providers, component internals, or any feature code
