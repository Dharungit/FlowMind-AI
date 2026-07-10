## ADDED Requirements

### Requirement: Usage Event Recording
Every AI operation SHALL generate a usage event that is persisted in the database. Feature SHALL be one of `chat`, `memory_extraction`, `embedding`, `title_generation`, `summary`, `search`.

#### Scenario: Chat completion records token usage
- **GIVEN** a user sends a chat message
- **WHEN** the assistant responds via an LLM call
- **THEN** a usage event SHALL be created with `chat` feature, the correct provider, model, input tokens, and output tokens

#### Scenario: Streaming chat records token usage
- **GIVEN** a user sends a chat message via streaming
- **WHEN** the stream completes and the assistant response is saved
- **THEN** a usage event SHALL be created with `chat` feature, the correct provider, model, input tokens, and output tokens

#### Scenario: Memory extraction records token usage
- **GIVEN** memory extraction runs after a chat exchange
- **WHEN** the LLM is called to extract memories
- **THEN** a usage event SHALL be created with `memory_extraction` feature and the token counts from the LLM response

#### Scenario: Title generation records token usage
- **GIVEN** a user requests an auto-generated conversation title
- **WHEN** the LLM generates the title
- **THEN** a usage event SHALL be created with `title_generation` feature and the token counts from the LLM response

#### Scenario: Embedding generation records token usage
- **GIVEN** an embedding is generated for a text input
- **WHEN** the embedding API call completes
- **THEN** a usage event SHALL be created with `embedding` feature, the embedding model, input tokens, and zero output tokens

#### Scenario: Usage event contains all required fields
- **GIVEN** a usage event is created
- **THEN** it SHALL include `user_id`, `provider`, `model`, `feature`, `input_tokens`, `output_tokens`, `total_tokens`, and `estimated_cost`
- **AND** it SHALL include a non-null `created_at` timestamp

#### Scenario: Usage event includes optional conversation and message context when available
- **GIVEN** a usage event is created during a chat operation
- **THEN** it SHALL include the `conversation_id` and `message_id` of the associated conversation and assistant message

#### Scenario: Cached input tokens are tracked separately
- **GIVEN** an LLM response includes cached input tokens
- **WHEN** a usage event is created
- **THEN** `cached_input_tokens` SHALL store the cached portion
- **AND** `input_tokens` SHALL include the total (cached + non-cached)

#### Scenario: Estimated cost is calculated from configurable pricing
- **GIVEN** a usage event with known input and output tokens
- **WHEN** `estimated_cost` is computed
- **THEN** it SHALL use `calculate_cost()` from the pricing module with the event's model, input tokens, and output tokens

#### Scenario: Usage event stores arbitrary metadata
- **GIVEN** additional context is available for an AI operation
- **WHEN** a usage event is created
- **THEN** the metadata SHALL be stored in the `metadata` JSONB column

## MODIFIED Requirements

<!-- No existing capabilities are modified -->
