## Why

The current project has an ad-hoc flat folder structure with no `src/` wrapper, no route groups for scoped layouts, no centralized state management Context providers, and no type-safe environment config. This makes it harder to onboard developers, scale the app, and follow Next.js conventions.

## What Changes

- **Introduce `src/` directory** — move all source code (`app/`, `components/`, `features/`, `lib/`, `hooks/`) under `src/` for a cleaner project root and conventional Next.js layout
- **Add Next.js route groups** — create `(auth)/` and `(chat)/` route groups, each with their own `layout.tsx` for scoped provider wrapping and route organization
- **Add centralized state management stores** — create `src/store/` with Context + useReducer providers for `app`, `chat`, `auth`, and `ui` state domains, extracting the existing chat `useReducer` into a proper `ChatContext` with provider
- **Reorganize components** — add `components/layout/Header.tsx` (extracted from root layout) and `components/shared/` (Spinner, ErrorBoundary stubs). Move `Avatar` from `ui/` to `shared/`
- **Add type-safe env config** — create `src/config/env.ts` for typed environment variable access and `.env.example` for onboarding
- **Add loading/error boundaries** — create `src/app/loading.tsx` and `src/app/error.tsx` stubs (Next.js conventions)
- **Move `features/` into `src/`** — relocate `features/` to `src/features/` with all import paths updated
- **Update README** — document the new folder structure
- **Remove `INSTALL_TEMPLATE.md`** — dead template file not part of the application

## Capabilities

### New Capabilities
- `app-state-store`: Centralized app-level state (theme, config) via Context + useReducer provider
- `chat-state-store`: Chat state management via ChatContext provider, extracted from inline useReducer in use-chat.ts
- `auth-state-store`: Auth state Context provider wrapping existing React Query hooks
- `ui-state-store`: UI state (sidebar toggle, modals) via Context + useReducer
- `route-groups`: Next.js route groups `(auth)` and `(chat)` with scoped layouts for provider wrapping
- `type-safe-env`: Typed environment variable access preventing misspelled env key bugs

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **File moves**: Nearly all source files move from root-level directories into `src/`
- **Import paths**: All `@/` imports remain valid (tsconfig alias unchanged), but relative imports across moved files need updating
- **New dependencies**: None — uses existing `react` Context/useReducer patterns, no new packages
- **Breaking**: Module resolution changes if any code uses non-aliased relative imports that cross directory boundaries
- **`proxy.ts`**: Remains at project root as-is (not renamed to `middleware.ts`)
- **`features/` API and hooks**: Stay within `src/features/{domain}/` — not flattened to `src/lib/api/` or `src/hooks/`
