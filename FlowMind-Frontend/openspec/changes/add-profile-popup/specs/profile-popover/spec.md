## ADDED Requirements

### Requirement: Profile popover with first-letter avatar
Feature: Profile Popover
Rule: A first-letter initial avatar in the top-right header shows user information in a hover card and provides a sign-out action.

#### Scenario: Authenticated user sees first-letter avatar in header
- **GIVEN** the user is authenticated with a display name
- **WHEN** the page loads
- **THEN** a circular avatar is displayed in the top-right corner of the header
- **AND** the avatar shows the first character of the user's display name

#### Scenario: User hovers over avatar to view profile card
- **GIVEN** the user is authenticated
- **WHEN** they hover over the avatar in the header
- **THEN** a card appears containing the user's full display name
- **AND** the card shows the user's email address
- **AND** the card shows a logout button at the bottom

#### Scenario: User clicks logout from profile card
- **GIVEN** the profile card is visible
- **WHEN** the user clicks the logout button
- **THEN** the user is signed out
- **AND** they are redirected to the sign-in page

#### Scenario: User has no display name set
- **GIVEN** the user is authenticated but `display_name` is null or empty
- **WHEN** the page loads
- **THEN** the avatar shows the first character of the user's email as fallback
- **AND** the profile card displays the email address

#### Scenario: Unauthenticated user sees no avatar
- **GIVEN** the user is not authenticated
- **WHEN** the page loads
- **THEN** no avatar or profile popover is rendered in the header
