## ADDED Requirements

### Requirement: Expose memory usage stats via dedicated endpoint
MUST: The system must expose a `GET /v1/users/me/memory-usage` endpoint that returns the current memory count, the per-user limit, and the usage percentage. All values must be computed on-the-fly.
Feature: memory-usage

#### Scenario: Returns correct usage when user has memories
- **GIVEN** the user has 50 stored memories and the max limit is 100
- **WHEN** the user sends `GET /v1/users/me/memory-usage` with a valid JWT
- **THEN** the response must be `{"count": 50, "max": 100, "percentage": 0.5}`

#### Scenario: Returns zero count when user has no memories
- **GIVEN** the user has no stored memories
- **WHEN** the user sends `GET /v1/users/me/memory-usage`
- **THEN** the response must be `{"count": 0, "max": 100, "percentage": 0.0}`

#### Scenario: Returns 100% when at limit
- **GIVEN** the user has 100 memories and the max limit is 100
- **WHEN** the user sends `GET /v1/users/me/memory-usage`
- **THEN** the response must be `{"count": 100, "max": 100, "percentage": 1.0}`

#### Scenario: Unauthenticated request returns 401
- **GIVEN** no valid JWT token is provided
- **WHEN** the user sends `GET /v1/users/me/memory-usage`
- **THEN** the response must be 401 Unauthorized

### Requirement: Include memory stats in list memories response body
MUST: The `GET /v1/memories` response body must include a `usage` object with `count`, `max`, and `percentage` fields alongside the memories array.

#### Scenario: List memories includes usage in body
- **GIVEN** the user has 25 memories and the max limit is 100
- **WHEN** the user sends `GET /v1/memories` with a valid JWT
- **THEN** the response body must contain `{"memories": [...], "usage": {"count": 25, "max": 100, "percentage": 0.25}}`

#### Scenario: Empty list includes zero usage
- **GIVEN** the user has no memories
- **WHEN** the user sends `GET /v1/memories`
- **THEN** the response must contain `{"memories": [], "usage": {"count": 0, "max": 100, "percentage": 0.0}}`
