## ADDED Requirements

### Requirement: Card Component
Feature: Analytics UI — SHALL provide reusable Card, Table, and Skeleton components
Rule: A reusable Card component MUST provide a consistent container for content sections.

#### Scenario: Card renders with default styling
- **GIVEN** a Card component is rendered
- **WHEN** it contains children
- **THEN** it displays with rounded corners, a border, a subtle background, and padding
- **AND** it can optionally display a title

#### Scenario: Card is responsive
- **GIVEN** a Card component
- **WHEN** viewed on different screen sizes
- **THEN** the card scales appropriately to its container width

### Requirement: Summary Card with Number Animation
Feature: Analytics UI — SHALL provide reusable Card, Table, and Skeleton components
Rule: Summary cards MUST display large metric values that animate from 0 to their final value.

#### Scenario: Number animates on load
- **GIVEN** a SummaryCard with a value of 1200000
- **WHEN** it first renders
- **THEN** the displayed number animates from 0 to 1.2M over a short duration
- **AND** the animation is smooth

#### Scenario: Number respects reduced motion
- **GIVEN** a SummaryCard
- **WHEN** the user has `prefers-reduced-motion` enabled
- **THEN** the number displays immediately at its final value without animation

### Requirement: Table Component
Feature: Analytics UI — SHALL provide reusable Card, Table, and Skeleton components
Rule: A reusable Table component MUST display tabular data with headers and rows.

#### Scenario: Table renders with headers and rows
- **GIVEN** a Table component with column definitions and row data
- **WHEN** it is rendered
- **THEN** column headers are displayed in a header row
- **AND** data rows are displayed below the header
- **AND** the table is horizontally scrollable on small screens

#### Scenario: Table shows empty state
- **GIVEN** a Table component with no data
- **WHEN** it is rendered
- **THEN** it displays "No usage data available yet"

### Requirement: Skeleton Component
Feature: Analytics UI — SHALL provide reusable Card, Table, and Skeleton components
Rule: A reusable Skeleton component MUST show loading placeholders matching expected content dimensions.

#### Scenario: Skeleton card renders
- **GIVEN** a SkeletonCard component
- **WHEN** it is rendered
- **THEN** it shows a gray pulsing placeholder with card-like dimensions

#### Scenario: Skeleton chart renders
- **GIVEN** a SkeletonChart component
- **WHEN** it is rendered
- **THEN** it shows a gray pulsing placeholder with chart-area dimensions

#### Scenario: Skeleton table row renders
- **GIVEN** a SkeletonTable component with a row count
- **WHEN** it is rendered
- **THEN** it shows the specified number of pulsing placeholder rows
