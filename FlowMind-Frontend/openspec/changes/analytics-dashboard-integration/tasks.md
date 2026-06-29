## 1. Install Dependencies

- [x] 1.1 Add `chart.js` and `react-chartjs-2` to package.json and run install

## 2. Update UserProfile Type

- [x] 2.1 Add `is_admin?: boolean` to the `UserProfile` interface in `src/features/auth/api/types.ts`

## 3. Create Formatting Utilities

- [x] 3.1 Create `src/lib/format.ts` with `formatTokens()` (K/M suffix) and `formatCurrency()` (USD formatting)

## 4. Create Shared UI Components

- [x] 4.1 Create `src/components/shared/Card.tsx` — reusable card with optional title, border, background
- [x] 4.2 Create `src/components/shared/Skeleton.tsx` — skeleton placeholder components (card, chart, table row variants)
- [x] 4.3 Create `src/components/shared/Table.tsx` — reusable table with headers, rows, sortable columns, empty state

## 5. Create Analytics Feature

- [x] 5.1 Create `src/features/analytics/api/analytics-client.ts` — wraps `apiClient.get()` for user and admin analytics endpoints
- [x] 5.2 Create `src/features/analytics/hooks/use-analytics.ts` — `useUserAnalytics()` and `useAdminAnalytics()` React Query hooks with 5min staleTime
- [x] 5.3 Create `src/features/analytics/components/summary-cards.tsx` — animated summary cards using Card + `motion`
- [x] 5.4 Create `src/features/analytics/components/daily-usage-chart.tsx` — line chart (chart.js) for daily token usage
- [x] 5.5 Create `src/features/analytics/components/feature-breakdown-chart.tsx` — horizontal bar chart for feature usage
- [x] 5.6 Create `src/features/analytics/components/cache-breakdown-chart.tsx` — pie chart for cached vs non-cached
- [x] 5.7 Create `src/features/analytics/components/peak-hours-chart.tsx` — bar chart for peak usage hours
- [x] 5.8 Create `src/features/analytics/components/admin-tables.tsx` — usage per user table and cost per user table

## 6. Create Dashboard Layout and Routes

- [x] 6.1 Create `src/app/(dashboard)/layout.tsx` — layout with Header, back navigation (ArrowLeft → `/`), no sidebar
- [x] 6.2 Create `src/app/(dashboard)/analytics/page.tsx` — user analytics page with summary cards and daily usage chart
- [x] 6.3 Create `src/app/(dashboard)/admin/analytics/page.tsx` — admin analytics page with 404 guard for non-admin users

## 7. Enhance UserMenu

- [x] 7.1 Add Analytics and Admin Analytics navigation items to `src/features/auth/components/user-menu.tsx` with appropriate dividers

## 8. Verify and Validate

- [x] 8.1 Build the project and verify no TypeScript errors
- [x] 8.2 Run `openspec validate analytics-dashboard-integration --type change --strict` before archive
