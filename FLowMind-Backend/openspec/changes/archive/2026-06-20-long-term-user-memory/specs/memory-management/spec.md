## ADDED Requirements

### Requirement: List user memories
MUST: Authenticated users must be able to retrieve their stored memories via a REST endpoint, with optional pagination and type filtering.
Feature: memory-management

#### Scenario: List all memories for the current user
- **GIVEN** the user has 3 stored memories
- **WHEN** the user sends `GET /v1/memories` with a valid JWT
- **THEN** the response must be a JSON array of 3 memory objects
- **AND** each object must contain `id`, `memory`, `memory_type`, `importance`, `access_count`, `last_accessed_at`, `created_at`, and `updated_at` fields

#### Scenario: List memories filtered by type
- **GIVEN** the user has memories of types "project" and "skill"
- **WHEN** the user sends `GET /v1/memories?type=project`
- **THEN** the response must only contain memories with `memory_type` = "project"

#### Scenario: List memories with pagination
- **GIVEN** the user has 25 memories
- **WHEN** the user sends `GET /v1/memories?limit=10&offset=0`
- **THEN** the response must contain at most 10 memories

#### Scenario: Unauthenticated request returns 401
- **GIVEN** no valid JWT token is provided
- **WHEN** the user sends `GET /v1/memories`
- **THEN** the response must be 401 Unauthorized

### Requirement: Delete a single memory
MUST: Authenticated users must be able to delete their own memories by ID. Deletion must be scoped to the authenticated user.

#### Scenario: Delete an existing memory
- **GIVEN** the user has a memory with id "abc-123"
- **WHEN** the user sends `DELETE /v1/memories/abc-123`
- **THEN** the response must be `{"deleted": true}`
- **AND** the memory must no longer appear in `GET /v1/memories`

#### Scenario: Delete a non-existent memory returns 404
- **GIVEN** no memory with id "nonexistent" exists for this user
- **WHEN** the user sends `DELETE /v1/memories/nonexistent`
- **THEN** the response must be 404 Not Found

#### Scenario: Delete another user's memory returns 404
- **GIVEN** another user has a memory with id "other-456"
- **WHEN** the current authenticated user sends `DELETE /v1/memories/other-456`
- **THEN** the response must be 404 Not Found (not exposed as another user's memory)
