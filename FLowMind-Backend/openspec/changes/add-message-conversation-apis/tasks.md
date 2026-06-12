## 1. Database Migration

- [ ] 1.1 Generate Alembic migration for `conversations` and `messages` tables with proper foreign keys, indexes, and cascade deletes
- [ ] 1.2 Run migration and verify tables exist in the database

## 2. Models

- [ ] 2.1 Add `Conversation` model to `app/models.py` (id, user_id FK → users.id, title, created_at, updated_at)
- [ ] 2.2 Add `Message` model to `app/models.py` (id, conversation_id FK → conversations.id ON DELETE CASCADE, role, content, metadata JSONB, created_at)
- [ ] 2.3 Add relationships between User ↔ Conversation (one-to-many) and Conversation ↔ Message (one-to-many)

## 3. Schemas

- [ ] 3.1 Add Pydantic schemas for conversation CRUD: `ConversationCreate`, `ConversationUpdate`, `ConversationResponse`, `ConversationListResponse`
- [ ] 3.2 Add Pydantic schemas for message operations: `MessageAddRequest`, `MessageResponse`, `MessageDeleteResponse`
- [ ] 3.3 Update `ChatRequest` schema if needed for internal use

## 4. Services

- [ ] 4.1 Create `ConversationService` with methods: `create`, `list_by_user`, `get_by_id`, `update_title`, `delete`
- [ ] 4.2 Create `MessageService` with methods: `add_message_to_conversation`, `delete_message`
- [ ] 4.3 Refactor `ChatService.chat()` and `ChatService.stream_chat()` to be internal methods (no longer exposed via router)
- [ ] 4.4 Wire `MessageService.add_message_to_conversation` to call `ChatService.chat()` internally with full history from DB

## 5. API Endpoints

- [ ] 5.1 Add new conversation routes to `app/api/chat.py` or new `app/api/conversations.py`: `POST /v1/conversations`, `GET /v1/conversations`, `GET /v1/conversations/{id}`, `PUT /v1/conversations/{id}`, `DELETE /v1/conversations/{id}`
- [ ] 5.2 Add message routes: `POST /v1/conversations/{id}/messages`, `DELETE /v1/messages/{id}`
- [ ] 5.3 Remove public `POST /v1/chat/completions` route from router
- [ ] 5.4 Update PUBLIC_PATHS in middleware if needed (new endpoints require auth)

## 6. Wiring in main.py

- [ ] 6.1 Create and attach `ConversationService` and `MessageService` to app state in lifespan
- [ ] 6.2 Pass database session dependency to new services

## 7. Validation

- [ ] 7.1 Run `openspec validate add-message-conversation-apis --type change --strict` to validate artifact coherence
- [ ] 7.2 Run application tests to confirm nothing is broken
