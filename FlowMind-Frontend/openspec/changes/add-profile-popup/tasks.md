## 1. Add shadcn UI components

- [x] 1.1 Add `HoverCard` and `Avatar` shadcn components via `npx shadcn@latest add hover-card avatar`

## 2. Rewrite UserMenu component

- [x] 2.1 Rewrite `features/auth/components/user-menu.tsx` — use `Avatar` + `AvatarFallback` with first-letter initial, wrap in `HoverCardTrigger`/`HoverCardContent` with user info (name, email) and logout button

## 3. Add header to root layout

- [x] 3.1 Update `app/layout.tsx` to render a sticky header bar with `<UserMenu />` in the top-right corner

## 4. Verify

- [x] 4.1 Run type check and build — confirmed no TypeScript errors and the app compiles
- [x] 4.2 Verified by code review — `AvatarFallback` renders first letter, `HoverCardContent` shows name/email/logout, `useLogout` handles sign-out
