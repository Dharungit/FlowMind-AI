## ADDED Requirements

### Requirement: Retrieve relevant memories before LLM completion
MUST: Before generating each chat completion, the system must retrieve up to 5 relevant memories for the current user and inject them into the prompt context.
Feature: memory-retrieval

#### Scenario: Memories are injected when user has stored facts
- **GIVEN** the user has at least one stored memory with text "User is building FlowMind AI"
- **WHEN** the user sends a message containing "React Native" to `POST /v1/stream`
- **THEN** the LLM prompt must include a system message containing the memory "User is building FlowMind AI"

#### Scenario: No injection when user has no memories
- **GIVEN** the user has no stored memories
- **WHEN** the user sends a message to `POST /v1/stream`
- **THEN** the LLM prompt must NOT include any memory context system message

#### Scenario: Maximum memory limit is enforced
- **GIVEN** the user has 10 stored memories
- **WHEN** the memory retrieval runs for a user message
- **THEN** at most 5 memories are injected into the prompt

#### Scenario: Memories are ranked by relevance
- **GIVEN** the user has memories with different similarity scores to the current message
- **WHEN** the memories are retrieved
- **THEN** the memories returned must be ordered by combined score (similarity × 0.7 + importance/10 × 0.3), highest first

#### Scenario: Retrieval failure does not block chat
- **GIVEN** the embedding API is unavailable
- **WHEN** the user sends a message to `POST /v1/stream`
- **THEN** the streaming response must proceed without memory injection
- **AND** an error must be logged (not returned to the user)

#### Scenario: Access count is incremented on retrieval
- **GIVEN** a memory with `access_count` = 5
- **WHEN** that memory is retrieved for injection
- **THEN** its `access_count` must become 6
- **AND** its `last_accessed_at` must be updated
