## Why

FlowMind currently has no visibility into token usage or platform analytics. Users and admins cannot track consumption patterns, costs, or usage trends. Adding analytics dashboards enables users to monitor their token spend and admins to understand platform-wide usage for capacity planning and cost management.

## What Changes

- **New API integration**: Analytics client for user and admin endpoints
- **New analytics hooks**: `useUserAnalytics()`, `useAdminAnalytics()` with React Query caching
- **New routes**: `(dashboard)` route group with `/dashboard/analytics` (user) and `/dashboard/admin/analytics` (admin)
- **New components**: Card, Table, Skeleton, and chart wrappers for chart.js
- **UserMenu enhancement**: Add "Analytics" (all users) and "Admin Analytics" (admins only) navigation items
- **UserProfile type update**: Add `is_admin?: boolean` field
- **New dependencies**: `chart.js`, `react-chartjs-2`
- **Reusable utilities**: `formatTokens()`, `formatCurrency()`
- **Number animation**: Animate summary cards from 0 to final value using `motion` (Framer Motion)

## Capabilities

### New Capabilities

- `user-analytics`: View personal token usage — total, input, output tokens, and daily usage trends via a line chart
- `admin-analytics`: View platform-wide analytics — usage per user, cost per user, feature breakdown, cache breakdown, and peak hours
- `analytics-routing`: Authenticated route group with dashboard layout, back navigation, and admin route protection (404 for non-admins)
- `analytics-ui`: Reusable Card, Table, and chart components for analytics display

### Modified Capabilities

- `user-auth`: UserMenu updated with analytics navigation items; `UserProfile` interface extended with `is_admin`

## Impact

- **Dependencies**: Add `chart.js`, `react-chartjs-2`
- **API**: New analytics API client consuming `GET /v1/analytics/user` and `GET /v1/analytics/admin`
- **Types**: `UserProfile` gains optional `is_admin` field in `src/features/auth/api/types.ts`
- **Routes**: New `src/app/(dashboard)/` route group with layout, analytics page, and admin/analytics page
- **Components**: New Card, Table, Skeleton components in `src/components/shared/`; chart wrappers in `src/features/analytics/`
- **UserMenu**: Extended in `src/features/auth/components/user-menu.tsx`
- **Auth middleware**: Existing `proxy.ts` middleware already protects all non-auth routes — no changes needed for auth; admin route protection handled client-side
