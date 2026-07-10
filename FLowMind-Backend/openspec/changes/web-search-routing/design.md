# Design: Web Search Routing

## Architecture Overview

```
                   POST /v1/stream  or  POST /v1/conversations/:id/messages
                                      │
                                      ▼
                              ┌───────────────┐
                              │   api/chat.py  │
                              │  (orchestrator)│
                              └───────┬───────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                  ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │DecisionEngine│  │ SearchService│  │MessageService│
            │  (routing/)  │  │ (websearch/) │  │  (existing)  │
            └──────┬───────┘  └──────┬───────┘  └──────────────┘
                   │                 │
            ┌──────┴──────┐  ┌──────┴──────┐
            │  RuleEngine │  │SearchProvider│
            │  (fast path)│  │    (ABC)     │
            └─────────────┘  └──────┬──────┘
                   │           ┌────┴────┐
            ┌──────┴──────┐   │         │
            │LLMClassifier│   ▼         ▼
            │ (fallback)  │ Tavily    Serper
            └─────────────┘
```

Routing happens **once per request**, before the LLM call. The decision is passed to MessageService (streaming metadata + prompt context) and persisted in message metadata.

## New Folder Structure

```
app/
├── schemas/
│   ├── routing.py              # CapabilityDecision, LLMClassificationResponse
│   └── websearch.py            # SearchResult, WebSearchMetadata
├── services/
│   ├── routing/
│   │   ├── __init__.py
│   │   ├── decision_engine.py  # DecisionEngine: facade over rules + LLM
│   │   ├── rule_engine.py      # Weighted keyword scorer
│   │   ├── llm_classifier.py   # LLM-based fallback classifier
│   │   ├── keywords.py         # SEARCH_KEYWORDS, NO_SEARCH_KEYWORDS with weights
│   │   └── prompts.py          # Routing classification prompt templates
│   └── websearch/
│       ├── __init__.py
│       ├── search_service.py   # Orchestrator: query → results → formatted context
│       ├── provider.py         # Abstract SearchProvider base class
│       ├── formatter.py        # SearchResult list → prompt-ready text
│       └── providers/
│           ├── __init__.py
│           ├── tavily_provider.py
│           └── serper_provider.py
```

## Component Design

### CapabilityDecision (`app/schemas/routing.py`)

```python
class CapabilityDecision(BaseModel):
    web_search: bool = False
    confidence: float = 0.0
    reason: str = ""
    source: Literal["rules", "llm"] = "llm"
    # Future-extensible fields (not used yet, reserved for later):
    # memory: bool = False
    # files: bool = False
    # tools: list[str] = []
    # image_generation: bool = False
```

### SearchResult (`app/schemas/websearch.py`)

```python
class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    content: str | None = None
    score: float = 0.0
```

### RuleEngine (`services/routing/rule_engine.py`)

- **Constructor**: Takes no dependencies (pure logic)
- **`evaluate(query: str) -> CapabilityDecision | None`**
- Uses `SEARCH_KEYWORDS` (list of `(keyword, weight)` tuples) and `NO_SEARCH_KEYWORDS`
- Calculates `search_score` = sum of weights for matching search keywords
- Calculates `no_search_score` = sum of weights for matching no-search keywords
- If `search_score >= SEARCH_THRESHOLD` → return `CapabilityDecision(web_search=True, source="rules", ...)`
- If `no_search_score >= NO_SEARCH_THRESHOLD` → return `CapabilityDecision(web_search=False, source="rules", ...)`
- Otherwise → return `None` (defer to LLM)
- Keywords sourced from `keywords.py`, configurable via Settings

### LLMClassifier (`services/routing/llm_classifier.py`)

- **Constructor**: Takes `ChatService` (same client, same model)
- **`classify(query: str) -> CapabilityDecision`**
- Sends a single-turn chat with a routing system prompt (from `prompts.py`)
- System prompt instructs: "Classify only. Return JSON. Do not answer the question."
- Validates returned JSON with Pydantic `CapabilityDecision`
- On parse failure → defaults to `CapabilityDecision(web_search=False, source="llm", confidence=0.0)`
- Configurable via `Settings.ROUTING_MODEL` (if empty, uses `ChatService.default_model`)

### DecisionEngine (`services/routing/decision_engine.py`)

- **Constructor**: Takes `RuleEngine` + `LLMClassifier`
- **`decide(query: str) -> CapabilityDecision`**
- Calls `RuleEngine.evaluate(query)` first
- If `None`, calls `LLMClassifier.classify(query)`
- Returns the decision
- **No caching at this layer** — caching is the caller's responsibility (api/chat.py stores the decision once per request and passes it downstream)

### SearchProvider (`services/websearch/provider.py`)

```python
class SearchProvider(ABC):
    @abstractmethod
    async def search(self, query: str, max_results: int = 5) -> list[SearchResult]:
        ...
```

### Provider Implementations

**TavilyProvider** — Uses `httpx` to call Tavily Search API. Normalizes response into `list[SearchResult]`. Reads `TAVILY_API_KEY` from Settings.

**SerperProvider** — Uses `httpx` to call Serper.dev API. Normalizes response into `list[SearchResult]`. Reads `SERPER_API_KEY` from Settings.

Both providers map provider-specific JSON fields (`title`, `link`/`url`, `snippet`) to the canonical `SearchResult` model. Provider-specific JSON never leaks outside the provider class.

### Formatter (`services/websearch/formatter.py`)

- **`format(results: list[SearchResult]) -> str`**
- Produces text like:
```
Source 1
Title: React v19 Released
URL: https://react.dev/blog/2024/12/05/react-19
Summary: React 19 introduces Server Components as a stable feature...

---

Source 2
...
```
- Max 5 results by default
- Truncates snippets to 300 chars

### SearchService (`services/websearch/search_service.py`)

- **Constructor**: Takes `SearchProvider`, `Formatter`
- **`search(query: str, max_results: int = 5) -> tuple[str, WebSearchMetadata]`**
- Calls `provider.search(query, max_results)`
- Formats results via `Formatter`
- Returns `(formatted_context_string, WebSearchMetadata)` where metadata includes provider name, original query, latency, result count, and source list
- Records latency via `time.perf_counter()`

### WebSearchMetadata (`app/schemas/websearch.py`)

```python
class WebSearchMetadata(BaseModel):
    provider: str
    query: str
    latency_ms: float
    result_count: int
    sources: list[SearchResult]
```

## Request Flow

### Streaming flow (`POST /v1/stream`)

```
1. api/chat.py receives request
2. Retrieve memory context (existing)
3. DecisionEngine.decide(user_query) → CapabilityDecision
4. If web_search=True:
   a. SearchService.search(user_query) → (context, metadata)
   b. Set routing_decision.web_search=True
5. MessageService.stream_add_message(
       ...,
       routing_decision=CapabilityDecision,
       search_context=str | None,
       search_metadata=WebSearchMetadata | None,
   )
6. MessageService yields:
   a. SSE event: {"type": "routing", "web_search": true/false, ...}
   b. SSE event: {"type": "meta", "conversation_id": "..."}
   c. LLM chunks...
   d. SSE event: {"done": true, "message": {...}}
7. Finally: MessageService persists routing + search metadata on assistant Message
```

### Non-streaming flow (`POST /v1/conversations/:id/messages`)

```
1. api/chat.py receives request
2. Retrieve conversation history (existing)
3. DecisionEngine.decide(user_query) → CapabilityDecision
4. If web_search=True:
   a. SearchService.search(user_query) → (context, metadata)
5. Build chat request with optional search system message prepended
6. ChatService.chat(request) → ChatResponse
7. Persist assistant Message with routing + search metadata
8. Return MessageResponse (metadata includes routing/search info)
```

## Dependency Injection Wiring

### New services in lifespan (`app/main.py`)

```python
# After existing service creation:
rule_engine = RuleEngine(settings)
llm_classifier = LLMClassifier(chat_service, settings)
app.state.decision_engine = DecisionEngine(rule_engine, llm_classifier)

search_provider = _create_search_provider(settings)
formatter = SearchResultFormatter()
app.state.search_service = SearchService(search_provider, formatter)
```

### Provider factory

```python
def _create_search_provider(settings: Settings) -> SearchProvider:
    if settings.web_search_provider == "serper":
        return SerperProvider(settings.serper_api_key)
    return TavilyProvider(settings.tavily_api_key)
```

### API dependency functions (`app/api/chat.py`)

```python
def get_decision_engine(request: Request) -> DecisionEngine:
    return request.app.state.decision_engine

def get_search_service(request: Request) -> SearchService:
    return request.app.state.search_service
```

## Settings Additions (`app/config.py`)

```python
tavily_api_key: str = ""
serper_api_key: str = ""
web_search_provider: str = "tavily"
search_threshold: float = 0.7
no_search_threshold: float = 0.7
routing_model: str = ""  # empty = use provider_default_model
```

## Metadata Schema (Message.metadata_)

When web search is performed:
```json
{
  "routing": {
    "web_search": true,
    "confidence": 0.96,
    "source": "rules",
    "reason": "Current information requested"
  },
  "web_search": {
    "provider": "tavily",
    "query": "latest React version",
    "latency_ms": 312.5,
    "result_count": 5,
    "sources": [
      {"title": "...", "url": "...", "snippet": "...", "score": 0.9}
    ]
  }
}
```

When no web search:
```json
{
  "routing": {
    "web_search": false,
    "confidence": 0.99,
    "source": "rules",
    "reason": "General knowledge request"
  }
}
```

## Error Handling

- **Search provider failure**: Log warning, fall back to direct LLM response. Set `metadata.web_search.provider = null` with error info
- **LLM classifier parse failure**: Default to `web_search=False`, log warning
- **RuleEngine keyword match failure**: Returns `None`, defers to LLM classifier
- **No provider API key configured**: Skip search, fall back to direct LLM response

## Testing Strategy

- **Unit tests**: RuleEngine keyword scoring, Formatter output, SearchResult model validation, CapabilityDecision serialization
- **Service tests**: SearchService with mocked provider, LLMClassifier with mocked ChatService, DecisionEngine with mocked sub-components
- **Integration tests**: Full streaming flow with mocked ChatService + mocked search provider, verifying SSE events include routing event, metadata persistence
- Follow existing patterns: `pytest` + `unittest.mock` + `TestClient` with dependency overrides

## Future Extensibility

The `CapabilityDecision` model has reserved fields (`memory`, `files`, `tools`, `image_generation`) that are not used yet. When new capabilities are added:

1. Add the field to `CapabilityDecision` (already present, just set defaults to `True`)
2. Extend `RuleEngine.keywords` for the new capability
3. Extend the LLM classifier prompt
4. Extend the SSE routing event with the new capability field
5. Add new specialist services (e.g., `MemoryRetrievalService`) called after `DecisionEngine.decide()`

The routing layer is designed so capabilities are additive — no redesign needed.
