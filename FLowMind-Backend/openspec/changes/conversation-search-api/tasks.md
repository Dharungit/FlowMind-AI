## 1. Schema

- [ ] 1.1 Add `ConversationSearchResult` and `ConversationSearchResponse` Pydantic models to `app/schemas/conversations.py`

## 2. Service

- [ ] 2.1 Add `search(user_id, query)` method to `ConversationService` in `app/services/conversation.py` using ILIKE with correlated subquery for matched_text
- [ ] 2.2 Implement `_build_snippet(content, query)` helper that extracts a ~200-char context window around the match with `...` truncation indicators

## 3. Route

- [ ] 3.1 Add `GET /v1/conversations/search` endpoint to `app/api/chat.py` with `q` query parameter, placed before the `{conversation_id}` route

## 4. Tests

- [ ] 4.1 Add test for search returning results by title match
- [ ] 4.2 Add test for search returning results by message content match
- [ ] 4.3 Add test for empty query returning empty results
- [ ] 4.4 Add test for unauthenticated search returning 401
- [ ] 4.5 Add test for no match returning empty results
