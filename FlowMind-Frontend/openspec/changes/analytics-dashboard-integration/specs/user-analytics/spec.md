## ADDED Requirements

### Requirement: View Token Usage Summary
Feature: User Analytics — SHALL display personal token usage and daily trends
Rule: Authenticated users SHALL be able to view their personal token usage summary showing total, input, and output token counts.

#### Scenario: View token usage summary cards
- **GIVEN** I am an authenticated user
- **WHEN** I navigate to the analytics dashboard
- **THEN** I see three summary cards displaying Total Tokens, Input Tokens, and Output Tokens
- **AND** each card shows a formatted number value (e.g., 1.2M, 800K, 400K)
- **AND** the values animate from 0 to their final value on first load

#### Scenario: Token usage summary shows loading state
- **GIVEN** I am an authenticated user
- **WHEN** I navigate to the analytics dashboard before data has loaded
- **THEN** I see skeleton placeholders matching the card dimensions
- **AND** the cards appear after data loads

#### Scenario: Token usage summary shows error state
- **GIVEN** I am an authenticated user
- **WHEN** the analytics API request fails
- **THEN** I see an error message with a retry button

### Requirement: View Daily Token Usage Trend
Feature: User Analytics — SHALL display personal token usage and daily trends
Rule: A line chart SHALL display daily token usage over time.

#### Scenario: View daily usage line chart
- **GIVEN** I am an authenticated user
- **WHEN** I view the analytics dashboard
- **THEN** I see a line chart showing daily token usage
- **AND** the X axis shows dates
- **AND** the Y axis shows total tokens
- **AND** hovering over a data point shows a tooltip with the date and token count

#### Scenario: Daily usage chart with no data
- **GIVEN** I am an authenticated user with no usage data
- **WHEN** I view the analytics dashboard
- **THEN** I see a message: "No usage data available yet"

#### Scenario: Daily usage chart loading state
- **GIVEN** I am an authenticated user
- **WHEN** the daily usage data is loading
- **THEN** I see a skeleton placeholder matching the chart area dimensions
