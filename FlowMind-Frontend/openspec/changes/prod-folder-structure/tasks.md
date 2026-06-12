## 1. Scaffold src/ directory structure

- [ ] 1.1 Create `src/` directory at project root
- [ ] 1.2 Create empty directories: `src/app/`, `src/components/`, `src/features/`, `src/store/`, `src/lib/`, `src/hooks/`, `src/config/`
- [ ] 1.3 Create store subdirectories: `src/store/app/`, `src/store/chat/`, `src/store/auth/`, `src/store/ui/`
- [ ] 1.4 Create component subdirectories: `src/components/layout/`, `src/components/shared/`
- [ ] 1.5 Create `src/app/(auth)/` and `src/app/(chat)/` route group directories

## 2. Create new files (no existing import dependencies)

- [ ] 2.1 Create `src/config/env.ts` with typed env var exports and missing-variable validation
- [ ] 2.2 Create `.env.example` at project root with documented placeholder values
- [ ] 2.3 Create `src/app/loading.tsx` stub (centered Spinner with "Loading..." text)
- [ ] 2.4 Create `src/app/error.tsx` stub ("use client", error message display, "Try Again" button)
- [ ] 2.5 Create `src/components/shared/Spinner.tsx` (SVG spinner, 24px, accepts className prop)
- [ ] 2.6 Create `src/components/shared/ErrorBoundary.tsx` (class component, catches render errors, fallback UI)
- [ ] 2.7 Create `src/components/layout/Header.tsx` extracted from current root layout header markup

## 3. Create store files

- [ ] 3.1 Create `src/store/app/appTypes.ts` with AppState, AppAction, and initialState
- [ ] 3.2 Create `src/store/app/appReducer.ts` handling SET_THEME action
- [ ] 3.3 Create `src/store/app/AppContext.tsx` with AppProvider and useApp() hook
- [ ] 3.4 Create `src/store/chat/chatTypes.ts` with ChatState, ChatAction, initialState (extracted from use-chat.ts)
- [ ] 3.5 Create `src/store/chat/chatReducer.ts` handling SEND_MESSAGE, RECEIVE_CHUNK, STOP_STREAMING, SET_ERROR, CLEAR_ERROR actions
- [ ] 3.6 Create `src/store/chat/chatActions.ts` with action creator helpers
- [ ] 3.7 Create `src/store/chat/ChatContext.tsx` with ChatProvider and useChat() hook
- [ ] 3.8 Create `src/store/auth/authTypes.ts` with AuthState and useAuth() return type
- [ ] 3.9 Create `src/store/auth/AuthContext.tsx` wrapping existing React Query hooks from features/auth/
- [ ] 3.10 Create `src/store/ui/uiReducer.ts` handling TOGGLE_SIDEBAR, OPEN_MODAL, CLOSE_MODAL
- [ ] 3.11 Create `src/store/ui/UIContext.tsx` with UIProvider and useUI() hook

## 4. Move existing files to src/

- [ ] 4.1 Move `lib/utils.ts` to `src/lib/utils.ts` and verify no imports reference the old path
- [ ] 4.2 Move `components/ui/` to `src/components/ui/` (button.tsx, textarea.tsx, popover.tsx, hover-card.tsx, animated-grid-pattern.tsx)
- [ ] 4.3 Move `components/chat/` to `src/components/chat/` (assistant-message.tsx, chat-input.tsx, markdown-renderer.tsx, message-thread.tsx, user-message.tsx)
- [ ] 4.4 Move `features/` to `src/features/` (auth/, chat/ with all nested files)
- [ ] 4.5 Move `hooks/` to `src/hooks/` (empty directory, shadcn alias target)

## 5. Reorganize and update app/ routes

- [ ] 5.1 Move `components/ui/avatar.tsx` to `src/components/shared/Avatar.tsx` and update all imports
- [ ] 5.2 Create route group layouts: `src/app/(auth)/layout.tsx` (auth-specific UI), `src/app/(chat)/layout.tsx` (wraps children with ChatProvider)
- [ ] 5.3 Move `app/auth/signin/page.tsx` to `src/app/(auth)/login/page.tsx` and update any relative imports
- [ ] 5.4 Move `app/page.tsx` to `src/app/(chat)/page.tsx`
- [ ] 5.5 Move `app/api/auth/[...nextauth]/route.ts` to `src/app/api/auth/[...nextauth]/route.ts`
- [ ] 5.6 Move `app/globals.css` to `src/app/globals.css`
- [ ] 5.7 Move `app/favicon.ico` to `src/app/favicon.ico`
- [ ] 5.8 Move `app/layout.tsx` to `src/app/layout.tsx` and update it to compose AppProvider > AuthProvider > children

## 6. Wire up extract chat useReducer into ChatContext

- [ ] 6.1 Update `src/features/chat/hooks/use-chat.ts` to consume ChatContext via useChat() instead of owning its own useReducer
- [ ] 6.2 Remove inline useReducer, ChatState, ChatAction types, and initialState from use-chat.ts
- [ ] 6.3 Update `src/features/chat/api/chat-client.ts` imports if they reference moved types

## 7. Update imports and references

- [ ] 7.1 Run `rg "from ['\"]\.\./" --include "*.ts" --include "*.tsx"` to find all relative imports and update them to use `@/` alias where possible
- [ ] 7.2 Update all `@/components/` imports to `@/src/components/` or adjust tsconfig if `@/` stays at root
- [ ] 7.3 Verify `@/lib/utils` cn import works from new `src/lib/utils.ts` location
- [ ] 7.4 Update shadcn `components.json` aliases if hooks/utils dirs moved

## 8. Update root config files

- [ ] 8.1 Verify `tsconfig.json` paths still resolve correctly after src/ move — adjust if needed
- [ ] 8.2 Verify `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs` need no changes
- [ ] 8.3 Verify `tailwind.config.ts` content paths include `src/` directory
- [ ] 8.4 Verify `components.json` tailwind config/content paths include `src/`

## 9. Build verification

- [ ] 9.1 Run `npm run build` and fix any TypeScript or module resolution errors
- [ ] 9.2 Run `npm run dev` and verify the app loads at `http://localhost:3000`
- [ ] 9.3 Verify auth flow works: navigate to /login, sign in with Google, redirect to /
- [ ] 9.4 Verify chat flow works: send a message, see streaming response
- [ ] 9.5 Verify loading.tsx appears during page transitions

## 10. Documentation and cleanup

- [ ] 10.1 Rewrite `README.md` with project overview, folder structure diagram, setup instructions, and available scripts
- [ ] 10.2 Delete `INSTALL_TEMPLATE.md`
- [ ] 10.3 Remove empty root `app/`, `components/`, `features/`, `lib/`, `hooks/` directories after confirming all files moved
- [ ] 10.4 Run `openspec validate prod-folder-structure --type change --strict`
