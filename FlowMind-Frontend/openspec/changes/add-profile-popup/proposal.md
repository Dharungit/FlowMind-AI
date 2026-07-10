## Why

The chat page has no user-facing identification — no avatar, no profile access, and no visible logout mechanism. The existing `UserMenu` component already exists but is unused. Users need a way to see who they're logged in as and sign out without navigating away.

## What Changes

- Rewrite the existing `features/auth/components/user-menu.tsx` to show a first-letter avatar in the top-right corner
- On hover, display a `HoverCard` with user's display name, email, and a logout button
- Add a persistent header bar in `app/layout.tsx` that renders the profile popover
- Add `shadcn` `HoverCard` and `Avatar` UI components

## Capabilities

### New Capabilities
- `profile-popover`: Hover-triggered profile card in the top-right showing user info (name, email) and logout action with a first-letter initial avatar

### Modified Capabilities
- (none)

## Impact

- **`features/auth/components/user-menu.tsx`**: Rewritten — first-letter avatar, HoverCard wrapper, logout at card bottom
- **`app/layout.tsx`**: Added header bar with UserMenu in top-right
- **`components/ui/`**: New `hover-card.tsx` and `avatar.tsx` shadcn components added
- No new external dependencies
