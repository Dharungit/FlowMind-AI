## ADDED Requirements

### Requirement: User Profile Includes Admin Status
Feature: User Auth — MUST extend UserProfile with is_admin and add analytics navigation to UserMenu
Rule: The UserProfile type MUST include an optional is_admin field returned by the backend.

#### Scenario: User profile contains is_admin field
- **GIVEN** the UserProfile interface
- **WHEN** I inspect the type definition
- **THEN** it includes `is_admin?: boolean`
- **AND** admin users have `is_admin: true`
- **AND** non-admin users have `is_admin: false` or undefined

### Requirement: User Menu Shows Analytics Navigation
Feature: User Auth — MUST extend UserProfile with is_admin and add analytics navigation to UserMenu
Rule: The UserMenu component MUST display an "Analytics" navigation item for all authenticated users.

#### Scenario: Analytics item visible for all users
- **GIVEN** I am an authenticated user
- **WHEN** I open the UserMenu
- **THEN** I see an "Analytics" menu item
- **AND** clicking it navigates to `/dashboard/analytics`
- **AND** the item appears in a separate section between user info and sign out, separated by dividers

#### Scenario: Admin Analytics item visible only for admins
- **GIVEN** I am an admin user
- **WHEN** I open the UserMenu
- **THEN** I see an "Admin Analytics" menu item below the "Analytics" item
- **AND** clicking it navigates to `/dashboard/admin/analytics`

#### Scenario: Non-admin user does not see Admin Analytics
- **GIVEN** I am a non-admin user
- **WHEN** I open the UserMenu
- **THEN** I do not see an "Admin Analytics" menu item

### Requirement: User Menu Matches Existing Styling
Feature: User Auth — MUST extend UserProfile with is_admin and add analytics navigation to UserMenu
Rule: Analytics menu items MUST reuse existing UserMenu styling, spacing, and typography.

#### Scenario: Analytics items use consistent styling
- **GIVEN** the UserMenu is rendered
- **WHEN** I view the Analytics and Admin Analytics items
- **THEN** they use the same font size, color, and spacing as the existing menu
- **AND** they are separated from user info and sign out by dividers
