## ADDED Requirements

### Requirement: Enforce per-user memory limit
MUST: The system must enforce a configurable per-user cap on the number of stored memories. When the limit is reached, new memories must not be saved. Deletion and access to existing memories must remain unaffected.
Feature: memory-limit-check

#### Scenario: New memory is saved when under limit
- **GIVEN** the user has 5 memories and the max limit is 100
- **WHEN** a new memory is extracted and saved
- **THEN** the memory must be persisted
- **AND** the total count must become 6

#### Scenario: New memory is silently skipped when at limit
- **GIVEN** the user has 100 memories and the max limit is 100
- **WHEN** a new memory is extracted
- **THEN** the memory must NOT be saved
- **AND** no error must be returned or logged to the user
- **AND** the total count must remain 100

#### Scenario: Deletion works regardless of limit
- **GIVEN** the user has 100 memories and the max limit is 100
- **WHEN** the user deletes a memory
- **THEN** the memory must be removed
- **AND** the total count must become 99

#### Scenario: Existing memories remain accessible at limit
- **GIVEN** the user has 100 memories and the max limit is 100
- **WHEN** the user sends a new message to `/v1/stream`
- **THEN** the streaming response must include memory context from existing memories
- **AND** no new memory is saved from extraction

#### Scenario: Limit is configurable via env var
- **GIVEN** `MEMORY_MAX_PER_USER` is set to 50
- **WHEN** the user has 50 memories
- **THEN** no new memories can be saved

#### Scenario: Background extraction skips when at limit
- **GIVEN** the user is at the memory limit
- **WHEN** the background extraction task runs after a streaming response
- **THEN** the extraction LLM call must be skipped
- **AND** an INFO-level log must indicate the skip with current count and limit
