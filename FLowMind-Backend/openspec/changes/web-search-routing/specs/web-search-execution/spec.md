# web-search-execution

> Execute web searches through an abstract provider interface, normalizing results from Tavily and Serper into a canonical format, with context formatting for LLM prompt injection.

## Purpose

Provide a pluggable search architecture where the rest of the application interacts only with a `SearchProvider` ABC and `SearchService` orchestrator. Provider-specific details are fully encapsulated. Results are normalized and formatted for LLM context without leaking provider internals.

## Requirements

### Requirement: SearchProvider defines a common interface
Feature: web-search-execution
Rule: All search providers implement the `SearchProvider` abstract base class with a single `search(query, max_results)` async method returning `list[SearchResult]`.

#### Scenario: TavilyProvider implements SearchProvider interface
- **GIVEN** a `TavilyProvider` instance
- **WHEN** `search("latest AI news", max_results=5)` is called
- **THEN** a `list[SearchResult]` is returned
- **AND** each result has `title`, `url`, `snippet`, and `score` fields populated

#### Scenario: SerperProvider implements SearchProvider interface
- **GIVEN** a `SerperProvider` instance
- **WHEN** `search("Python async patterns", max_results=3)` is called
- **THEN** a `list[SearchResult]` is returned
- **AND** each result has `title`, `url`, `snippet`, and `score` fields populated

### Requirement: Provider responses are normalized to SearchResult
Feature: web-search-execution
Rule: Each provider converts its API-specific JSON response into the canonical `SearchResult` Pydantic model. Provider-specific data structures never leave the provider class.

#### Scenario: Tavily response normalization
- **GIVEN** the Tavily API returns results with fields `title`, `url`, `content`, `score`
- **WHEN** `TavilyProvider` processes the response
- **THEN** the results are converted to `SearchResult` objects with matching fields
- **AND** `SearchResult.content` is populated from Tavily's raw `content` field

#### Scenario: Serper response normalization
- **GIVEN** the Serper API returns results with fields `title`, `link`, `snippet`
- **WHEN** `SerperProvider` processes the response
- **THEN** the results are converted to `SearchResult` objects
- **AND** `SearchResult.url` is populated from Serper's `link` field
- **AND** `SearchResult.snippet` is populated from Serper's `snippet` field

### Requirement: SearchService orchestrates search and formatting
Feature: web-search-execution
Rule: SearchService calls the provider, normalizes results, formats context, and returns both formatted text and metadata (provider, latency, sources).

#### Scenario: SearchService returns formatted context and metadata
- **GIVEN** a `SearchService` with a mock provider returning 2 results
- **WHEN** `search("React 19 features", max_results=5)` is called
- **THEN** the returned tuple contains a formatted context string and a `WebSearchMetadata` object
- **AND** `WebSearchMetadata.provider` matches the injected provider name
- **AND** `WebSearchMetadata.sources` contains the 2 `SearchResult` objects
- **AND** `WebSearchMetadata.latency_ms` is a positive float

#### Scenario: SearchService respects max_results limit
- **GIVEN** a `SearchService` with a provider that could return 10 results
- **WHEN** `search("query", max_results=3)` is called
- **THEN** at most 3 results are returned
- **AND** `WebSearchMetadata.result_count` is 3

#### Scenario: Provider returns zero results
- **GIVEN** a provider returns an empty list
- **WHEN** `SearchService.search("nonexistent query")` is called
- **THEN** the formatted context string is empty
- **AND** `WebSearchMetadata.result_count` is 0

### Requirement: Formatter produces prompt-ready context
Feature: web-search-execution
Rule: The formatter converts a list of SearchResult objects into a structured text block suitable for injection as a system message in the LLM prompt.

#### Scenario: Formatter produces numbered source blocks
- **GIVEN** 2 search results with titles, URLs, and snippets
- **WHEN** the formatter processes the results
- **THEN** the output contains "Source 1" and "Source 2" headers
- **AND** each source includes "Title:", "URL:", and "Summary:" lines
- **AND** sources are separated by a delimiter (e.g., "---")

#### Scenario: Formatter handles empty results
- **GIVEN** an empty list of search results
- **WHEN** the formatter processes the results
- **THEN** an empty string is returned

#### Scenario: Formatter truncates long snippets
- **GIVEN** a search result with a snippet exceeding 300 characters
- **WHEN** the formatter processes the result
- **THEN** the snippet in the output is truncated to approximately 300 characters
- **AND** an ellipsis is appended

### Requirement: Provider is injectable via Settings
Feature: web-search-execution
Rule: The active search provider is selected based on the `WEB_SEARCH_PROVIDER` environment variable. No provider-specific code exists outside its implementation class.

#### Scenario: Provider selected from Settings
- **GIVEN** `Settings.web_search_provider` is `"tavily"`
- **WHEN** the provider factory creates a provider instance
- **THEN** a `TavilyProvider` is returned

#### Scenario: Unknown provider falls back to Tavily
- **GIVEN** `Settings.web_search_provider` is `"unknown"`
- **WHEN** the provider factory creates a provider instance
- **THEN** a `TavilyProvider` is returned (default)

### Requirement: No new pip dependencies
Feature: web-search-execution
Rule: Provider implementations use `httpx` (already available as a FastAPI dependency) for HTTP calls. No additional Python packages are required.

#### Scenario: Providers use httpx for API calls
- **GIVEN** a provider implementation
- **WHEN** `search(query, max_results)` is called
- **THEN** the HTTP request is made via `httpx.AsyncClient`
- **AND** no third-party SDK (e.g., `tavily-python`) is imported
