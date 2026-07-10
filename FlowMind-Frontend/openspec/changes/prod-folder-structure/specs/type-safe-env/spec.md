## ADDED Requirements

### Requirement: Typed environment variable access

All environment variable access MUST use typed exports from `src/config/env.ts`, preventing runtime errors from misspelled variable names.

#### Scenario: Access a public environment variable
- **GIVEN** the environment variable `NEXT_PUBLIC_BACKEND_URL` is set to "http://localhost:8000"
- **WHEN** code imports and accesses `env.backendUrl`
- **THEN** it returns "http://localhost:8000"

#### Scenario: Missing required variable throws clear error
- **GIVEN** a required environment variable is not set
- **WHEN** the `env` module is first imported
- **THEN** it throws an error with a message naming the missing variable
- **AND** the error message includes the expected variable name (e.g., "Missing required environment variable: NEXT_PUBLIC_BACKEND_URL")

#### Scenario: Optional variable with default
- **GIVEN** an optional environment variable is not set
- **WHEN** code accesses the corresponding env property
- **THEN** it returns the configured default value without throwing

### Requirement: Environment variable documentation

A `.env.example` file at the project root MUST list all required environment variables with placeholder values and descriptions.

#### Scenario: Developer onboarding
- **GIVEN** a developer clones the repository for the first time
- **WHEN** they copy `.env.example` to `.env.local`
- **THEN** all required variable names are present with placeholder values
- **AND** each variable has a comment explaining its purpose
