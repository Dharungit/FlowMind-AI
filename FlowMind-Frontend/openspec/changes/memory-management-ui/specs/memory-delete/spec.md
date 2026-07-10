## ADDED Requirements

### Requirement: Memory deletion
The system SHALL confirm before removing a memory.
Feature: memory-delete
Rule: Users can delete individual memories with a confirmation step and receive feedback on the result.

#### Scenario: User deletes a memory with confirmation
- **GIVEN** a memory is displayed in the memory list
- **WHEN** the user clicks the delete button on that memory row
- **THEN** a confirmation dialog appears with the title "Delete this memory?"
- **AND** the dialog description reads "This action cannot be undone."
- **WHEN** the user clicks "Delete" in the confirmation dialog
- **THEN** the memory is deleted
- **AND** a success toast notification appears
- **AND** the memory list refreshes
- **AND** the memory usage state updates

#### Scenario: User cancels memory deletion
- **GIVEN** a confirmation dialog is open for deleting a memory
- **WHEN** the user clicks "Cancel" in the confirmation dialog
- **THEN** the dialog closes
- **AND** the memory is not deleted
- **AND** no toast notification appears

#### Scenario: Delete error is handled gracefully
- **GIVEN** the user confirms deletion of a memory
- **WHEN** the delete request fails
- **THEN** an error toast notification appears with "Failed to delete memory"
- **AND** the memory list remains unchanged
- **AND** the memory usage state remains unchanged
