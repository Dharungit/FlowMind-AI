## ADDED Requirements

### Requirement: Skip extraction when user is at memory limit
MUST: When the user has reached the per-user memory cap, the background extraction must skip saving new memories. The extraction LLM call itself should not be made. Existing memories remain accessible.
Feature: memory-extraction

#### Scenario: Extraction skips LLM call when at limit
- **GIVEN** the user has reached the memory limit
- **WHEN** the user sends a message to `POST /v1/stream`
- **THEN** the streaming response must proceed normally
- **AND** the background extraction task must check the limit before calling the LLM
- **AND** no extraction LLM call must be made
- **AND** no new memories must be created

#### Scenario: Extraction runs normally when under limit
- **GIVEN** the user is below the memory limit
- **WHEN** the user sends a message to `POST /v1/stream`
- **THEN** the background extraction must proceed as normal
- **AND** new memories may be created from the exchange

#### Scenario: Deletion reduces count and allows new extraction
- **GIVEN** the user is at the memory limit
- **WHEN** the user deletes a memory
- **AND** sends a new message to `POST /v1/stream`
- **THEN** the background extraction must run normally
- **AND** new memories may be created from the exchange
