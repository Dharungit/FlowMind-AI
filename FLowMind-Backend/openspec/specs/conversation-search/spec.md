# conversation-search

> Search user conversations by title and message content, returning ranked results with matching snippets.

## Purpose

Allow authenticated users to search their own conversations by title or message content using a simple query string. Results are limited to the top 5 most recently updated conversations, with a contextual snippet showing where the match was found.

## Requirements

### Requirement: Search conversations by query
Feature: conversation-search
Rule: Authenticated users can search their own conversations by title or message content.

#### Scenario: Search matches conversation title
- **GIVEN** the user has a conversation titled "Prisma Transaction Issues"
- **WHEN** the user searches with query "prisma"
- **THEN** the response includes that conversation in the results
- **AND** the result's `matched_text` is a snippet from the first matching user or assistant message (or title if no message matches)

#### Scenario: Search matches user message content
- **GIVEN** the user has a conversation with a message "How do I use Prisma transactions in production?"
- **WHEN** the user searches with query "prisma"
- **THEN** the response includes that conversation in the results
- **AND** `matched_text` contains a contextual snippet around "prisma"

#### Scenario: Search matches assistant message content
- **GIVEN** the user has a conversation where the assistant replied "...Prisma transactions start failing intermittently..."
- **WHEN** the user searches with query "prisma"
- **THEN** the response includes that conversation in the results

#### Scenario: Results limited to top 5 ordered by updated_at desc
- **GIVEN** the user has 10 conversations matching the query
- **WHEN** the user searches
- **THEN** the response contains at most 5 results
- **AND** results are ordered by `updated_at` descending

#### Scenario: Each result contains full metadata
- **GIVEN** the user searches with a matching query
- **WHEN** the response is returned
- **THEN** each result includes `conversation_id`, `title`, `matched_text`, `created_at`, and `updated_at`

#### Scenario: No match returns empty results
- **GIVEN** the user has conversations but none match the query "zzzznothing"
- **WHEN** the user searches with query "zzzznothing"
- **THEN** the response contains an empty results list

#### Scenario: Empty query returns empty results
- **GIVEN** the user has conversations
- **WHEN** the user searches with an empty query
- **THEN** the response contains an empty results list

#### Scenario: Snippet truncation with context
- **GIVEN** a message content "I am trying to figure out how Prisma transactions work in a production environment"
- **WHEN** the user searches with query "Prisma"
- **THEN** `matched_text` shows a window around "Prisma" with leading or trailing "..." if the match is not at the start or end of the content

#### Scenario: Query word is wrapped in bold tags for frontend highlighting
- **GIVEN** a matching message content "How do I use Prisma transactions in production?"
- **WHEN** the user searches with query "prisma"
- **THEN** `matched_text` contains the query word wrapped in `<strong>` tags: "<strong>Prisma</strong>"
- **AND** the original casing of the matched word is preserved

#### Scenario: Unauthenticated request returns 401
- **GIVEN** the user is not authenticated
- **WHEN** the user sends a search request
- **THEN** the response status is 401
