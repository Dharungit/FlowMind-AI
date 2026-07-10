## ADDED Requirements

### Requirement: Memory usage display
The system SHALL show the current memory usage percentage in the application header.
Feature: memory-view
Rule: The application header shows the current memory usage percentage at all times when a user is authenticated.

#### Scenario: User sees memory usage in header pill
- **GIVEN** the user is authenticated
- **WHEN** the application header renders
- **THEN** a pill-shaped button displays "Memory" followed by the current usage percentage
- **AND** the percentage text is colored green when usage is 0%-49%
- **AND** the percentage text is colored orange when usage is 50%-79%
- **AND** the percentage text is colored red when usage is 80%-100%

#### Scenario: Memory pill opens memory modal
- **GIVEN** the user sees the memory pill in the header
- **WHEN** the user clicks the memory pill
- **THEN** a modal opens showing memory usage statistics

#### Scenario: Memory usage statistics display correctly
- **GIVEN** the user has opened the memory modal
- **WHEN** the modal loads
- **THEN** the modal shows "Max Memories", "Current Used", and "Usage" in a single row
- **AND** the usage percentage follows the same color rules as the header pill

#### Scenario: Refresh button refetches memories
- **GIVEN** the user has opened the memory modal
- **WHEN** the user clicks the refresh button in the top-right corner
- **THEN** the memories list refetches
- **AND** the global memory usage state updates
- **AND** a loading indicator is shown during the refresh

#### Scenario: Memory list shows stored memories
- **GIVEN** the user has opened the memory modal
- **WHEN** the memories are loaded
- **THEN** each memory is displayed as a single row with the memory text on the left
- **AND** a delete action button is aligned to the right of each row

#### Scenario: Empty memory list
- **GIVEN** the user has opened the memory modal
- **WHEN** no memories are stored
- **THEN** the list area displays "No memories stored yet."
- **AND** the usage stats section is still visible

#### Scenario: Memory usage syncs across the application
- **GIVEN** the memory modal displays current usage
- **WHEN** the user closes the modal and views the header pill
- **THEN** the header pill shows the same usage percentage
