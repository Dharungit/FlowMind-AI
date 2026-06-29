## ADDED Requirements

### Requirement: View Platform Total Usage
Feature: Admin Analytics — MUST display platform-wide token usage, per-user data, and usage breakdowns
Rule: Admin users MUST be able to view the total platform-wide token usage.

#### Scenario: View platform usage summary
- **GIVEN** I am an admin user
- **WHEN** I navigate to the admin analytics page
- **THEN** I see a prominent summary card displaying "Total Platform Tokens"
- **AND** the value is formatted (e.g., 50M)
- **AND** the value animates from 0 on first load

### Requirement: View Usage Per User
Feature: Admin Analytics — MUST display platform-wide token usage, per-user data, and usage breakdowns
Rule: Admin users MUST be able to view a table of token usage broken down by user.

#### Scenario: View usage per user table
- **GIVEN** I am an admin user
- **WHEN** I view the admin analytics page
- **THEN** I see a table with columns: User, Tokens
- **AND** rows are sorted descending by token usage
- **AND** token values are formatted (e.g., 1.2M)

#### Scenario: Usage per user table loading state
- **GIVEN** I am an admin user
- **WHEN** the usage data is loading
- **THEN** I see skeleton rows in the table

#### Scenario: Usage per user table empty state
- **GIVEN** I am an admin user
- **WHEN** there are no users with usage data
- **THEN** I see a message: "No usage data available yet"

### Requirement: View Cost Per User
Feature: Admin Analytics — MUST display platform-wide token usage, per-user data, and usage breakdowns
Rule: Admin users MUST be able to view estimated costs broken down by user.

#### Scenario: View cost per user table
- **GIVEN** I am an admin user
- **WHEN** I view the admin analytics page
- **THEN** I see a table with columns: User, Estimated Cost
- **AND** costs are formatted as USD currency (e.g., $12.50)
- **AND** rows are sorted descending by cost

#### Scenario: Cost per user table loading state
- **GIVEN** I am an admin user
- **WHEN** the cost data is loading
- **THEN** I see skeleton rows in the table

### Requirement: View Usage By Feature
Feature: Admin Analytics — MUST display platform-wide token usage, per-user data, and usage breakdowns
Rule: Admin users MUST be able to view token usage broken down by feature using a horizontal bar chart.

#### Scenario: View feature breakdown chart
- **GIVEN** I am an admin user
- **WHEN** I view the admin analytics page
- **THEN** I see a horizontal bar chart showing usage by feature
- **AND** bars are sorted descending by token usage
- **AND** each bar shows the feature name and token count
- **AND** the chart is responsive

### Requirement: View Cache Breakdown
Feature: Admin Analytics — MUST display platform-wide token usage, per-user data, and usage breakdowns
Rule: Admin users MUST be able to view cached vs non-cached token usage using a pie chart.

#### Scenario: View cache breakdown pie chart
- **GIVEN** I am an admin user
- **WHEN** I view the admin analytics page
- **THEN** I see a pie chart showing Cached Tokens vs Non-Cached Tokens
- **AND** the chart displays percentages and token totals
- **AND** the chart has clear labels

### Requirement: View Peak Usage Hours
Feature: Admin Analytics — MUST display platform-wide token usage, per-user data, and usage breakdowns
Rule: Admin users MUST be able to view peak usage hours using a bar chart.

#### Scenario: View peak hours bar chart
- **GIVEN** I am an admin user
- **WHEN** I view the admin analytics page
- **THEN** I see a bar chart showing usage by hour of day
- **AND** the X axis shows hours 0-23
- **AND** the Y axis shows tokens
- **AND** hovering over a bar shows a tooltip with the hour and token count
