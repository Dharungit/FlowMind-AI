# Tasks: Web Search Routing

## Phase 1: Foundation (config + schemas)

- [ ] Add env vars to `app/config.py`: `tavily_api_key`, `serper_api_key`, `web_search_provider`, `search_threshold`, `no_search_threshold`, `routing_model`
- [ ] Create `app/schemas/routing.py` with `CapabilityDecision` model
- [ ] Create `app/schemas/websearch.py` with `SearchResult` and `WebSearchMetadata` models

## Phase 2: Routing layer

- [ ] Create `app/services/routing/__init__.py`
- [ ] Create `app/services/routing/keywords.py` with `SEARCH_KEYWORDS` and `NO_SEARCH_KEYWORDS` weighted lists
- [ ] Create `app/services/routing/prompts.py` with classification system prompt template
- [ ] Implement `app/services/routing/rule_engine.py` — `RuleEngine` with weighted keyword scoring, thresholds, `evaluate()` method
- [ ] Implement `app/services/routing/llm_classifier.py` — `LLMClassifier` using `ChatService` for structured JSON classification, Pydantic validation, fallback on parse error
- [ ] Implement `app/services/routing/decision_engine.py` — `DecisionEngine` composing `RuleEngine` + `LLMClassifier`, single `decide()` method

## Phase 3: Web search layer

- [ ] Create `app/services/websearch/__init__.py`
- [ ] Create `app/services/websearch/providers/__init__.py`
- [ ] Create `app/services/websearch/provider.py` — `SearchProvider` ABC with `search(query, max_results) -> list[SearchResult]`
- [ ] Implement `app/services/websearch/providers/tavily_provider.py` — `TavilyProvider` using `httpx.AsyncClient`, normalizes Tavily response to `SearchResult`
- [ ] Implement `app/services/websearch/providers/serper_provider.py` — `SerperProvider` using `httpx.AsyncClient`, normalizes Serper response to `SearchResult`
- [ ] Create `app/services/websearch/formatter.py` — `SearchResultFormatter` converting `list[SearchResult]` to prompt-ready text with numbered sources
- [ ] Implement `app/services/websearch/search_service.py` — `SearchService` orchestrating provider.search() + formatter, returning `(context_str, metadata)`, recording latency

## Phase 4: Dependency Injection wiring

- [ ] Update `app/main.py` lifespan: create `RuleEngine`, `LLMClassifier`, `DecisionEngine`, provider factory, `SearchService`, store on `app.state`
- [ ] Add provider factory helper: selects provider based on `Settings.web_search_provider`
- [ ] Add API dependency functions in `app/api/chat.py`: `get_decision_engine()`, `get_search_service()`

## Phase 5: Chat integration

- [ ] Update `app/services/message.py` `stream_add_message()` signature: add `routing_decision` and `search_context`/`search_metadata` parameters
- [ ] Emit SSE routing event `{"type": "routing", ...}` as first event in streaming
- [ ] Prepend search context as system message when web search is performed
- [ ] Persist routing + search metadata on `assistant_msg.metadata_` after streaming completes
- [ ] Update `POST /v1/stream` in `app/api/chat.py`: call `DecisionEngine.decide()`, conditionally call `SearchService.search()`, pass results to `stream_add_message()`
- [ ] Update `POST /v1/conversations/:id/messages` in `app/api/chat.py`: call `DecisionEngine.decide()`, conditionally call `SearchService.search()`, inject search context into chat request, persist metadata
- [ ] Update `add_message()` in `MessageService` to accept and persist routing/search parameters for non-streaming path

## Phase 6: Configuration + deployment

- [ ] Add new env vars to `docker-compose.yml`: `TAVILY_API_KEY`, `SERPER_API_KEY`, `WEB_SEARCH_PROVIDER`, `SEARCH_THRESHOLD`, `NO_SEARCH_THRESHOLD`
- [ ] Add new env vars to `.env.example` with empty defaults

## Phase 7: Tests

- [ ] Create `tests/test_rule_engine.py` — test keyword scoring, thresholds, empty/whitespace input, None return for ambiguous
- [ ] Create `tests/test_decision_engine.py` — test RuleEngine takes priority, LLM fallback when RuleEngine returns None
- [ ] Create `tests/test_search_service.py` — test with mocked provider, verify formatting, metadata, latency measurement
- [ ] Create `tests/test_web_search_streaming.py` — integration test: verify routing SSE event, search context injection, metadata persistence
- [ ] Create `tests/test_web_search_non_streaming.py` — integration test: verify metadata in non-streaming response

## Verification

- [ ] Run `pytest` — all tests pass
- [ ] Manual test: send a query with "latest news" → verify SSE routing event shows `web_search=true`
- [ ] Manual test: send a query with "explain recursion" → verify SSE routing event shows `web_search=false`
- [ ] Verify metadata persisted correctly on assistant messages in both streaming and non-streaming flows
