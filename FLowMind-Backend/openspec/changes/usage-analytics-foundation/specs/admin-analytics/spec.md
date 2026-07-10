## ADDED Requirements

### Requirement: Platform Total Usage
Admins SHALL be able to view aggregate platform-wide token usage.

#### Scenario: Get total platform token usage
- **GIVEN** usage events exist for multiple users
- **WHEN** an admin requests platform usage via `GET /v1/analytics/admin`
- **THEN** the response SHALL include `platform_usage` with `total_tokens` summed across all users

### Requirement: Usage Per User
Admins SHALL be able to view token usage broken down by user.

#### Scenario: Get usage grouped by user
- **GIVEN** multiple users have usage events
- **WHEN** an admin requests analytics
- **THEN** the response SHALL include `usage_per_user` array with each user's total tokens

### Requirement: Cost Per User
Admins SHALL be able to view estimated cost broken down by user.

#### Scenario: Get cost grouped by user
- **GIVEN** multiple users have usage events with estimated costs
- **WHEN** an admin requests analytics
- **THEN** the response SHALL include `cost_per_user` array with each user's sum of `estimated_cost`

### Requirement: Feature Breakdown
Admins SHALL be able to view token usage broken down by feature.

#### Scenario: Get usage grouped by feature
- **GIVEN** usage events exist for `chat`, `memory_extraction`, and `embedding` features
- **WHEN** an admin requests analytics
- **THEN** the response SHALL include `feature_breakdown` array with each feature's total tokens

### Requirement: Cache Breakdown
Admins SHALL be able to view cached vs non-cached token usage.

#### Scenario: Get cache vs non-cached token breakdown
- **GIVEN** usage events have varying `cached_input_tokens` values
- **WHEN** an admin requests analytics
- **THEN** the response SHALL include `cache_breakdown` with `cached_tokens` (sum of `cached_input_tokens`) and `non_cached_tokens` (sum of `input_tokens` minus sum of `cached_input_tokens`)

### Requirement: Peak Usage Hours
Admins SHALL be able to view peak usage hours by total token load.

#### Scenario: Get peak hours by total token volume
- **GIVEN** usage events exist across different hours of the day
- **WHEN** an admin requests analytics
- **THEN** the response SHALL include `peak_usage_hours` array with entries grouped by hour of day
- **AND** each entry SHALL show the sum of `total_tokens` for that hour

#### Scenario: Peak hours ordered by hour
- **GIVEN** peak usage data is returned
- **THEN** entries SHALL be ordered by hour (0-23) ascending

### Requirement: Admin Analytics Authorization
Admin analytics endpoints SHALL require authentication and admin privileges.

#### Scenario: Unauthenticated request is rejected
- **GIVEN** no valid authentication token is provided
- **WHEN** a request is made to `GET /v1/analytics/admin`
- **THEN** a 401 Unauthorized response SHALL be returned

#### Scenario: Non-admin user is rejected
- **GIVEN** an authenticated user who is not in the admin allowlist
- **WHEN** they request `GET /v1/analytics/admin`
- **THEN** a 403 Forbidden response SHALL be returned

#### Scenario: Admin user can access analytics
- **GIVEN** an authenticated user whose ID is in the `ADMIN_USER_IDS` env var allowlist
- **WHEN** they request `GET /v1/analytics/admin`
- **THEN** the response SHALL contain platform-wide analytics data

## MODIFIED Requirements

<!-- No existing capabilities are modified -->
