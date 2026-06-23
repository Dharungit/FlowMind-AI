## ADDED Requirements

### Requirement: User Total Usage
A user SHALL be able to query their aggregate token usage across all features.

#### Scenario: Get total token usage for authenticated user
- **GIVEN** a user has generated usage events across multiple conversations
- **WHEN** the user requests their total usage via `GET /v1/analytics/user`
- **THEN** the response SHALL include `total_tokens`, `input_tokens`, and `output_tokens` summed across all their events

#### Scenario: Total usage for user with no AI activity
- **GIVEN** a user has never performed any AI operation
- **WHEN** the user requests their total usage
- **THEN** the response SHALL show zero for all token counts

### Requirement: User Daily Usage
A user SHALL be able to view their token usage broken down by day.

#### Scenario: Get daily token usage for authenticated user
- **GIVEN** a user has usage events on multiple dates
- **WHEN** the user requests their daily usage via `GET /v1/analytics/user`
- **THEN** the response SHALL include a `daily_usage` array with entries grouped by `date`
- **AND** each entry SHALL contain `total_tokens` for that day

#### Scenario: Daily usage is ordered chronologically
- **GIVEN** a user has usage events across several days
- **WHEN** the daily usage is returned
- **THEN** entries SHALL be ordered by date ascending

### Requirement: User Analytics Authorization
User analytics endpoints SHALL require authentication.

#### Scenario: Unauthenticated request is rejected
- **GIVEN** no valid authentication token is provided
- **WHEN** a request is made to `GET /v1/analytics/user`
- **THEN** a 401 Unauthorized response SHALL be returned

#### Scenario: User sees only their own data
- **GIVEN** two users have usage events
- **WHEN** user A requests their analytics
- **THEN** the response SHALL contain only user A's usage data, not user B's

## MODIFIED Requirements

<!-- No existing capabilities are modified -->
