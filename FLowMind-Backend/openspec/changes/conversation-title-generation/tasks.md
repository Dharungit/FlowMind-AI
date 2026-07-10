## 1. Model and Database

- [ ] 1.1 Add `title_generated: Mapped[bool]` column to `Conversation` model in `app/models.py` (default=False, nullable=False)
- [ ] 1.2 Generate Alembic migration for the new column: `alembic revision --autogenerate -m "add_title_generated_to_conversations"`

## 2. Title Generation Background Task

- [ ] 2.1 Create `run_title_generation()` async function in `app/api/chat.py` following the `run_memory_extraction()` pattern: own DB session, fetch conversation, check `title_generated` flag, fetch first user message
- [ ] 2.2 Implement the LLM call using `ChatService.chat()` with a concise prompt to generate a short title (max 6 words) from the user's first message
- [ ] 2.3 Update conversation title and set `title_generated = True` on success; log and swallow errors on failure

## 3. Trigger Point

- [ ] 3.1 Add `background_tasks.add_task(run_title_generation, ...)` in `_stream_with_extraction()` alongside the existing memory extraction call, passing user_id, conversation_id, and first user message

## 4. Tests

- [ ] 4.1 Write unit test for `run_title_generation` verifying it generates a title and sets the flag
- [ ] 4.2 Write unit test verifying `run_title_generation` skips if `title_generated` is already True
- [ ] 4.3 Write unit test verifying LLM failure is caught and logged without raising
- [ ] 4.4 Write integration test verifying background task is scheduled on `/v1/stream` first message

## 5. Verification

- [ ] 5.1 Run `pytest` to confirm all existing + new tests pass
- [ ] 5.2 Run `openspec validate "conversation-title-generation" --type change --strict` before archive
