## 1. Move chrome from root layout to chat layout

- [ ] 1.1 Update `src/app/layout.tsx` — remove Header/Sidebar imports and chrome div, keep providers and `<main>`
- [ ] 1.2 Update `src/app/(chat)/layout.tsx` — import Header/Sidebar, add chrome div structure around children

## 2. Verify

- [ ] 2.1 Confirm login page renders without Header/Sidebar
- [ ] 2.2 Confirm chat pages render with Header/Sidebar identically to before
