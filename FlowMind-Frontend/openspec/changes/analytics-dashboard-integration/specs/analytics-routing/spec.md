## ADDED Requirements

### Requirement: Authenticated Dashboard Route Group
Feature: Analytics Routing — SHALL enforce auth and admin access control for dashboard routes
Rule: Analytics pages MUST be grouped under a `(dashboard)` route group that requires authentication.

#### Scenario: Authenticated user accesses analytics
- **GIVEN** I am an authenticated user
- **WHEN** I navigate to `/dashboard/analytics`
- **THEN** I see the user analytics dashboard
- **AND** the page displays within the dashboard layout with the Header visible

#### Scenario: Unauthenticated user is redirected to login
- **GIVEN** I am not authenticated
- **WHEN** I navigate to `/dashboard/analytics`
- **THEN** I am redirected to the login page
- **AND** after login I am redirected back to `/dashboard/analytics`

### Requirement: Admin Route Protection
Feature: Analytics Routing — SHALL enforce auth and admin access control for dashboard routes
Rule: Admin analytics pages SHALL only be accessible to admin users.

#### Scenario: Admin user accesses admin analytics
- **GIVEN** I am an admin user
- **WHEN** I navigate to `/dashboard/admin/analytics`
- **THEN** I see the admin analytics dashboard
- **AND** the page displays within the dashboard layout with the Header visible

#### Scenario: Non-admin user sees 404
- **GIVEN** I am an authenticated non-admin user
- **WHEN** I navigate to `/dashboard/admin/analytics`
- **THEN** I see a 404 page
- **AND** I am not shown any admin data

### Requirement: Dashboard Layout with Back Navigation
Feature: Analytics Routing — SHALL enforce auth and admin access control for dashboard routes
Rule: The dashboard layout MUST include the existing Header with UserMenu and a back navigation button.

#### Scenario: Dashboard layout renders header and back button
- **GIVEN** I am an authenticated user
- **WHEN** I view any analytics page
- **THEN** I see the app Header with my UserMenu
- **AND** I see an ArrowLeft icon to navigate back to the home chat page
- **AND** clicking the ArrowLeft icon navigates to `/`
