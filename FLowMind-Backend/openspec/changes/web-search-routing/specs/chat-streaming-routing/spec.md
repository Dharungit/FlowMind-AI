# chat-streaming-routing

> Integrate the routing decision and web search results into both chat endpoints, emitting SSE routing events for frontend indicators and persisting routing/search metadata on assistant messages.

## Purpose

Wire the routing and search layers into the existing chat endpoints (`/v1/stream` and `/v1/conversations/:id/messages`) so that routing decisions are made before LLM calls, search results are injected as prompt context, and the frontend receives real-time routing status via SSE events. All metadata is persisted for debugging, analytics, and source display.

## Requirements

### Requirement: Streaming endpoint emits routing event before content
Feature: chat-streaming-routing
Rule: `POST /v1/stream` makes a routing decision before streaming begins and emits an SSE routing event as the first event, followed by the existing meta event and LLM content.

#### Scenario: Streaming with web search emits routing event
- **GIVEN** the DecisionEngine returns `web_search=True` for the user query
- **WHEN** `POST /v1/stream` is called
- **THEN** the first SSE event has `type="routing"` with `web_search=true`, `confidence`, `source`, and `reason`
- **AND** the second SSE event is the existing `type="meta"` with `conversation_id`
- **AND** subsequent events are LLM chunks with search context included in the prompt

#### Scenario: Streaming without web search emits routing event
- **GIVEN** the DecisionEngine returns `web_search=False` for the user query
- **WHEN** `POST /v1/stream` is called
- **THEN** the first SSE event has `type="routing"` with `web_search=false`
- **AND** no search context is injected into the prompt
- **AND** the LLM answers directly

#### Scenario: Search context is injected as a system message
- **GIVEN** the DecisionEngine returns `web_search=True`
- **AND** SearchService returns formatted context "Source 1: ..."
- **WHEN** `POST /v1/stream` is called
- **THEN** the LLM prompt includes a system message containing the formatted search context
- **AND** the system message instructs the LLM to cite sources from the search results

### Requirement: Non-streaming endpoint includes search results
Feature: chat-streaming-routing
Rule: `POST /v1/conversations/:id/messages` makes a routing decision before the LLM call and injects search context into the prompt.

#### Scenario: Non-streaming with web search
- **GIVEN** the DecisionEngine returns `web_search=True`
- **WHEN** `POST /v1/conversations/:id/messages` is called
- **THEN** the LLM receives search context as a system message
- **AND** the response `metadata` field includes `routing` and `web_search` objects
- **AND** the `web_search` metadata includes provider, query, latency, result count, and sources

#### Scenario: Non-streaming without web search
- **GIVEN** the DecisionEngine returns `web_search=False`
- **WHEN** `POST /v1/conversations/:id/messages` is called
- **THEN** the LLM receives no search context system message
- **AND** the response `metadata` includes `routing` with `web_search=false`

### Requirement: Routing decision is reused throughout the request
Feature: chat-streaming-routing
Rule: The routing decision is made once per request and passed to all downstream consumers (MessageService, metadata persistence, analytics) without re-invoking the DecisionEngine.

#### Scenario: Decision is made once and passed downstream
- **GIVEN** `POST /v1/stream` is processing a request
- **WHEN** the routing decision is obtained from `DecisionEngine.decide()`
- **THEN** the same decision object is passed to `MessageService.stream_add_message()`
- **AND** the same decision is stored in `assistant_msg.metadata_`
- **AND** `DecisionEngine.decide()` is never called again for this request

### Requirement: Metadata is persisted on assistant messages
Feature: chat-streaming-routing
Rule: After streaming completes, the assistant message's `metadata_` JSONB column stores the routing decision and (if applicable) web search metadata.

#### Scenario: Streaming persists routing and search metadata
- **GIVEN** a streaming request with web search enabled
- **WHEN** the stream completes
- **THEN** `assistant_msg.metadata_` contains `routing.web_search=true`
- **AND** `assistant_msg.metadata_` contains `web_search` with provider, query, latency, result_count, and sources

#### Scenario: Streaming persists routing metadata without search
- **GIVEN** a streaming request without web search
- **WHEN** the stream completes
- **THEN** `assistant_msg.metadata_` contains `routing.web_search=false`
- **AND** `assistant_msg.metadata_` does not contain a `web_search` key

#### Scenario: Non-streaming persists routing and search metadata
- **GIVEN** a non-streaming request via `/v1/conversations/:id/messages` with web search enabled
- **WHEN** the response is returned
- **THEN** the `MessageResponse.metadata` field includes both `routing` and `web_search` objects

### Requirement: Search failures fall back gracefully
Feature: chat-streaming-routing
Rule: If the search provider fails (network error, API error, missing key), the system falls back to a direct LLM response without crashing.

#### Scenario: Search provider network error
- **GIVEN** the DecisionEngine returns `web_search=True`
- **WHEN** the SearchService call raises a network exception
- **THEN** a warning is logged
- **AND** the request proceeds as if `web_search=False` (direct LLM response)
- **AND** no routing event with `web_search=true` is emitted

#### Scenario: No provider API key configured
- **GIVEN** `TAVILY_API_KEY` and `SERPER_API_KEY` are both empty
- **WHEN** `POST /v1/stream` is called with a web search query
- **THEN** the routing decision still reports `web_search` intent
- **BUT** the search is skipped and the LLM answers directly
- **AND** a warning is logged

### Requirement: Existing API contracts are unchanged
Feature: chat-streaming-routing
Rule: Both chat endpoints maintain backward compatibility. Existing request/response schemas are not modified. The new SSE routing event is additive only.

#### Scenario: Streaming response still has meta and done events
- **GIVEN** a streaming request without web search
- **WHEN** `POST /v1/stream` is called
- **THEN** the response includes the routing event (new), meta event (existing), LLM chunks (existing), and done event (existing)
- **AND** existing client code ignoring the routing event still functions correctly

#### Scenario: Non-streaming response schema unchanged
- **GIVEN** a non-streaming request via `/v1/conversations/:id/messages`
- **WHEN** the response is returned
- **THEN** the response includes `id`, `role`, `content`, `metadata`, `created_at` (unchanged)
- **AND** `metadata` includes the new routing/search fields
