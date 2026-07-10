## ADDED Requirements

### Requirement: Sidebar toggle state

The UI store MUST manage sidebar visibility via Context + useReducer, accessible to any component via the useUI() hook.

#### Scenario: Sidebar is closed by default on mobile
- **GIVEN** the viewport width is less than 768px
- **WHEN** the application loads
- **THEN** sidebarOpen is false

#### Scenario: Sidebar is open by default on desktop
- **GIVEN** the viewport width is 768px or greater
- **WHEN** the application loads
- **THEN** sidebarOpen is true

#### Scenario: Toggle sidebar
- **GIVEN** the sidebar is closed
- **WHEN** a component dispatches the TOGGLE_SIDEBAR action
- **THEN** sidebarOpen becomes true
- **AND** calling TOGGLE_SIDEBAR again sets sidebarOpen back to false

#### Scenario: Close sidebar
- **GIVEN** the sidebar is open
- **WHEN** a component dispatches the CLOSE_SIDEBAR action
- **THEN** sidebarOpen becomes false

### Requirement: Modal state management

The UI store MUST track which modal dialog is currently active via the activeModal state.

#### Scenario: Open a modal
- **GIVEN** no modal is active (activeModal is null)
- **WHEN** the OPEN_MODAL action is dispatched with "settings"
- **THEN** activeModal is "settings"

#### Scenario: Close a modal
- **GIVEN** the "settings" modal is active
- **WHEN** the CLOSE_MODAL action is dispatched
- **THEN** activeModal is null
