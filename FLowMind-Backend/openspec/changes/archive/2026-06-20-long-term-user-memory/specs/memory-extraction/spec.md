## ADDED Requirements

### Requirement: Extract durable facts from assistant responses
MUST: After each assistant response in a streaming completion, the system must asynchronously extract durable user facts from the conversation exchange and save them as memories.
Feature: memory-extraction

#### Scenario: New memory is extracted and saved
- **GIVEN** a user message "I'm building FlowMind AI with React Native" and an assistant response "That's a great project!"
- **WHEN** the background memory extraction runs
- **THEN** a new memory must be created with text containing "FlowMind AI"
- **AND** the memory must be persisted to the database

#### Scenario: Multiple facts are extracted from a single exchange
- **GIVEN** a user message containing "I use React Native and I own an Apache RR310 motorcycle"
- **WHEN** the background memory extraction runs
- **THEN** multiple memories may be created, one per distinct fact

#### Scenario: Extraction skips temporary content
- **GIVEN** a user message "Hello" and assistant response "Hi there! How can I help?"
- **WHEN** the background memory extraction runs
- **THEN** no memories must be created

#### Scenario: Extraction skips duplicate memories
- **GIVEN** the user already has a memory "User is building FlowMind AI"
- **AND** the new extraction produces a memory "User builds FlowMind AI project"
- **WHEN** deduplication runs with a similarity threshold of 0.85
- **THEN** no new memory must be created for the duplicate fact

#### Scenario: Invalid JSON from extraction LLM is handled gracefully
- **GIVEN** the extraction LLM returns malformed JSON
- **WHEN** the extraction service parses the response
- **THEN** no memories must be created
- **AND** a warning must be logged

#### Scenario: Extraction completion is logged for verification
- **GIVEN** a background extraction task runs
- **WHEN** extraction completes (with or without new memories)
- **THEN** an INFO-level log must be emitted containing the number of memories created and the extracted fact text for each
- **AND** the log must appear after all DB writes are committed
- **AND** operators can tail the log to determine when extraction finishes before sending the next message in manual testing

#### Scenario: Extraction failure does not affect user experience
- **GIVEN** the extraction LLM call throws an exception
- **WHEN** the background extraction runs
- **THEN** the exception must be caught and logged
- **AND** no error must be returned to the user
- **AND** the streaming response already delivered must remain unchanged
