# web-search-routing

> Classify user queries to determine whether web search is required, using a fast keyword-based RuleEngine with an LLM classifier fallback for ambiguous cases.

## Purpose

Determine whether a user query needs live web information or can be answered directly by the LLM. The routing layer must be fast for obvious cases (keyword match) and accurate for ambiguous cases (LLM fallback). Routing decisions are made once per request and reused downstream.

## Requirements

### Requirement: RuleEngine classifies obvious search queries
Feature: web-search-routing
Rule: The RuleEngine uses weighted keyword scoring to classify queries containing time-sensitive or current-information keywords as requiring web search.

#### Scenario: Query with strong search keyword triggers web search
- **GIVEN** the user query is "what is the latest Bitcoin price today"
- **WHEN** the RuleEngine evaluates the query
- **THEN** a `CapabilityDecision` is returned with `web_search=True`, `source="rules"`, and `confidence > 0`
- **AND** the `reason` field describes why search was triggered

#### Scenario: Query with multiple search keywords scores above threshold
- **GIVEN** the user query is "breaking news about current stock market crash"
- **WHEN** the RuleEngine evaluates the query
- **THEN** the cumulative keyword score exceeds `SEARCH_THRESHOLD`
- **AND** a search decision is returned

### Requirement: RuleEngine classifies obvious non-search queries
Feature: web-search-routing
Rule: The RuleEngine uses weighted keyword scoring to classify queries containing explanation or generation keywords as not requiring web search.

#### Scenario: Query with strong no-search keyword blocks web search
- **GIVEN** the user query is "explain how recursion works in Python"
- **WHEN** the RuleEngine evaluates the query
- **THEN** a `CapabilityDecision` is returned with `web_search=False`, `source="rules"`, and `confidence > 0`
- **AND** the `reason` field describes why search was not triggered

#### Scenario: Query with multiple no-search keywords scores above threshold
- **GIVEN** the user query is "summarize and explain the concept of neural networks"
- **WHEN** the RuleEngine evaluates the query
- **THEN** the cumulative no-search keyword score exceeds `NO_SEARCH_THRESHOLD`
- **AND** a no-search decision is returned

### Requirement: RuleEngine defers ambiguous queries to LLM classifier
Feature: web-search-routing
Rule: When neither search nor no-search keywords score above their thresholds, the RuleEngine returns None, indicating the LLM classifier should decide.

#### Scenario: Ambiguous query returns None
- **GIVEN** the user query is "what do you think about remote work"
- **WHEN** the RuleEngine evaluates the query
- **THEN** `None` is returned
- **AND** the DecisionEngine falls back to the LLM classifier

#### Scenario: Query with balanced search and no-search keywords returns None
- **GIVEN** the user query is "how does the latest React update affect debugging"
- **WHEN** the RuleEngine evaluates the query
- **THEN** neither score exceeds its threshold
- **AND** `None` is returned

#### Scenario: Empty or whitespace-only query returns no-search decision
- **GIVEN** the user query is "   " (whitespace only)
- **WHEN** the RuleEngine evaluates the query
- **THEN** a `CapabilityDecision` is returned with `web_search=False` and `source="rules"`

### Requirement: LLM classifier provides structured JSON decisions
Feature: web-search-routing
Rule: The LLM classifier sends a short system prompt instructing the model to classify only (not answer) and return structured JSON validated against the CapabilityDecision schema.

#### Scenario: LLM classifier returns valid web search decision
- **GIVEN** the user query is "who won the champions league this year"
- **AND** the RuleEngine returned None
- **WHEN** the LLM classifier processes the query
- **THEN** a `CapabilityDecision` with `web_search=True` and `source="llm"` is returned
- **AND** `confidence` is a float between 0.0 and 1.0

#### Scenario: LLM classifier returns valid no-search decision
- **GIVEN** the user query is "write a haiku about autumn leaves"
- **AND** the RuleEngine returned None
- **WHEN** the LLM classifier processes the query
- **THEN** a `CapabilityDecision` with `web_search=False` and `source="llm"` is returned

#### Scenario: LLM returns malformed JSON
- **GIVEN** the LLM classifier sends a classification request
- **WHEN** the LLM response contains invalid JSON that cannot be parsed
- **THEN** a `CapabilityDecision` with `web_search=False`, `source="llm"`, and `confidence=0.0` is returned
- **AND** a warning is logged

### Requirement: DecisionEngine composes RuleEngine and LLM classifier
Feature: web-search-routing
Rule: The DecisionEngine tries the RuleEngine first; if it returns None, it falls back to the LLM classifier.

#### Scenario: DecisionEngine uses RuleEngine result directly
- **GIVEN** the RuleEngine returns a valid `CapabilityDecision`
- **WHEN** `DecisionEngine.decide(query)` is called
- **THEN** the RuleEngine's decision is returned immediately
- **AND** the LLM classifier is never called

#### Scenario: DecisionEngine falls back to LLM classifier
- **GIVEN** the RuleEngine returns `None`
- **WHEN** `DecisionEngine.decide(query)` is called
- **THEN** the LLM classifier is invoked
- **AND** the LLM classifier's decision is returned

### Requirement: Routing keywords are configurable
Feature: web-search-routing
Rule: Search and no-search keywords with their weights are defined in a centralized configuration and can be adjusted via environment variables or code changes.

#### Scenario: SEARCH_THRESHOLD is configurable via Settings
- **GIVEN** `Settings.search_threshold` is set to 0.8
- **WHEN** the RuleEngine evaluates a query with search score 0.75
- **THEN** the score does not exceed the threshold
- **AND** `None` is returned

#### Scenario: NO_SEARCH_THRESHOLD is configurable via Settings
- **GIVEN** `Settings.no_search_threshold` is set to 0.5
- **WHEN** the RuleEngine evaluates a query with no-search score 0.6
- **THEN** the score exceeds the threshold
- **AND** a no-search decision is returned
