## ADDED Requirements

### Requirement: App-level theme and config state

Feature: AppStateStore
Rule: The app store provides theme preference and application configuration to all descendant components via a Context + useReducer pattern.

#### Scenario: Theme preference is available app-wide
- **GIVEN** the AppProvider wraps the application root
- **WHEN** any component calls useApp() hook
- **THEN** it receives the current theme value ("light", "dark", or "system")
- **AND** a dispatch function to change the theme

#### Scenario: Default theme is system
- **GIVEN** the application loads for the first time
- **WHEN** no theme preference has been stored
- **THEN** the initial state has theme set to "system"

#### Scenario: Theme change persists
- **GIVEN** the current theme is "light"
- **WHEN** a component dispatches `SET_THEME` action with value "dark"
- **THEN** all subscribed components re-render with theme "dark"

### Requirement: App provider is the outermost wrapper

Feature: AppStateStore
Rule: AppProvider must wrap all other providers to ensure config and theme are available everywhere.

#### Scenario: AppProvider wraps other providers
- **GIVEN** the root layout renders
- **WHEN** the component tree is mounted
- **THEN** AppProvider is the outermost context provider
- **AND** AuthProvider and ChatProvider are nested inside it
