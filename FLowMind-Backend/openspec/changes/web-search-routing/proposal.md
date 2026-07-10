# Proposal: Web Search Routing

## Why

FlowMind currently answers every query directly from the LLM with no awareness of what requires live information. Users asking about current events, stock prices, weather, news, or recent data get stale or hallucinated answers. Modern AI assistants (ChatGPT, Claude, Perplexity) all route queries through a decision layer before answering — enabling web search only when needed. FlowMind needs the same.

## What Changes

- **Add a routing decision layer** that classifies each user query as needing web search or a direct LLM answer, using a fast keyword-based RuleEngine backed by a lightweight LLM classifier for ambiguous cases
- **Add a search provider abstraction** with Tavily and Serper implementations to fetch live web results
- **Integrate routing into both chat endpoints** (`/v1/stream` and `/v1/conversations/:id/messages`), injecting formatted search results as context into the LLM prompt
- **Emit SSE routing events** so the frontend can display a "Searching the web..." indicator during streaming
- **Persist routing decisions and search metadata** in the existing `Message.metadata_` JSONB column for debugging, analytics, and frontend source display
- **Add Docker and env configuration** for the new web search providers and thresholds

## Capabilities

### New Capabilities

- `web-search-routing`: The decision engine that classifies user queries and determines whether web search is required. Includes a weighted keyword RuleEngine for fast classification and an LLM classifier fallback for ambiguous queries. Returns a `CapabilityDecision` object that is reused throughout the request lifecycle.

- `web-search-execution`: The search provider abstraction and its implementations. Defines a `SearchProvider` ABC with Tavily and Serper providers, a `SearchService` orchestrator for query execution, result normalization, and prompt-ready context formatting.

- `chat-streaming-routing`: Integration of the routing and search layers into existing chat endpoints. Modifies both `/v1/stream` and `/v1/conversations/:id/messages` to execute routing decisions before generating responses, inject search context into prompts, emit SSE routing events for frontend indicators, and persist routing/search metadata.

### Modified Capabilities

None. All existing capabilities (`conversation-search`, chat, memory, auth) maintain their current behavior. The routing layer is additive and does not change existing API contracts or data flows.

## Impact

- **New files**: `app/schemas/routing.py`, `app/schemas/websearch.py`, `app/services/routing/` (5 files), `app/services/websearch/` (7 files)
- **Modified files**: `app/api/chat.py` (add routing integration to both endpoints), `app/services/message.py` (accept routing decision + search results), `app/main.py` (wire new services in lifespan), `app/config.py` (new env vars), `docker-compose.yml` (new env vars), `.env.example` (new env vars)
- **Dependencies**: No new pip packages. Uses existing `httpx` (FastAPI dependency) for provider HTTP calls
- **Database**: No schema migrations. Reuses `Message.metadata_` JSONB column
- **Breaking changes**: None. Both existing chat endpoints maintain backward-compatible API contracts. New SSE event types are additive
