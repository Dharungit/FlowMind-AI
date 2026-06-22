## ADDED Requirements

### Requirement: Trigger title generation after stream completion
After the SSE stream emits a `done` event for a conversation's first assistant response, the frontend must call the title generation endpoint to retrieve the final title.

Feature: Title Generation
Rule: Title generation is triggered only for new conversations (no `activeConversationId` at stream start), not for subsequent messages in existing conversations.

#### Scenario: Title generation triggered on first message of new conversation
- **GIVEN** the SSE stream was started without an `activeConversationId` (new conversation)
- **AND** the stream has emitted a `done` event with a valid `conversation_id`
- **WHEN** the `"done"` handler runs
- **THEN** the frontend calls `POST /v1/conversations/:id/generate-title` with that conversation ID
- **AND** the existing eager `invalidateQueries` for the conversation list is NOT called immediately

#### Scenario: Title generation skipped for subsequent messages
- **GIVEN** the SSE stream was started with an existing `activeConversationId`
- **AND** the stream has emitted a `done` event
- **WHEN** the `"done"` handler runs
- **THEN** no `generate-title` API call is made

#### Scenario: Title generation skipped when conversation_id is missing
- **GIVEN** the SSE stream has emitted a `done` event without a `conversation_id`
- **WHEN** the `"done"` handler runs
- **THEN** no `generate-title` API call is made
- **AND** no invalidation of the conversation list occurs

### Requirement: Retry on transient failure
The title generation API call must be retried up to 3 times with exponential backoff if it fails.

Feature: Title Generation
Rule: Transient errors should not immediately surface to the user; the system retries with backoff.

#### Scenario: Successful retry after transient failure
- **GIVEN** the `generate-title` API call fails on the first attempt
- **WHEN** 2 seconds have elapsed
- **AND** the second attempt succeeds
- **THEN** the mutation proceeds to `onSuccess`
- **AND** no error toast is shown

#### Scenario: All retries exhausted
- **GIVEN** the `generate-title` API call fails on the first attempt
- **WHEN** three retry attempts (2s, 4s, 8s delays) have all failed
- **THEN** a Sonner error toast is shown with the message "Failed to generate conversation title"
- **AND** fallback `invalidateQueries` is called on the conversation list

### Requirement: Update cache on successful title generation
When title generation succeeds, the frontend must invalidate stale cache data to pick up the new title.

Feature: Title Generation
Rule: Successful title generation invalidates the single-conversation and list caches so the next query resolves with real server data.

#### Scenario: Caches invalidated on success
- **GIVEN** the `generate-title` API call succeeds
- **WHEN** the mutation's `onSuccess` callback runs
- **THEN** the conversation list query (`["conversations"]`) is invalidated
- **AND** the single-conversation query (`["conversations", id]`) is invalidated

### Requirement: Seed conversation cache on stream completion
To prevent the chat page from flashing an empty state, the accumulated streaming messages must be seeded into the conversation cache before `STREAM_DONE` is dispatched.

Feature: Title Generation
Rule: The conversation detail cache is pre-populated with streaming content so the UI never sees an empty messages array after a stream completes.

#### Scenario: Cache seeded before STREAM_DONE
- **GIVEN** the SSE stream has accumulated content responses
- **WHEN** a `done` event is received
- **THEN** `setQueryData` is called on `["conversations", id]` with the user message and accumulated assistant content
- **AND** `dispatch(STREAM_DONE)` runs afterward
- **AND** `hasMessages` remains true throughout the transition

#### Scenario: Cache seeded even for existing conversations
- **GIVEN** the SSE stream was started with an existing `activeConversationId`
- **WHEN** a `done` event is received with accumulated content
- **THEN** the cache is still seeded with accumulated messages to prevent re-render glitches

### Requirement: Fallback invalidation on failure
Even when title generation ultimately fails, the conversation list should be refetched to show whatever title the backend currently has.

Feature: Title Generation
Rule: Failures should not leave the UI permanently stale.

#### Scenario: List invalidated on failure
- **GIVEN** the `generate-title` API call has failed after 3 retries
- **WHEN** the mutation's `onError` callback runs
- **THEN** `toast.error("Failed to generate conversation title")` is called
- **AND** `invalidateQueries({ queryKey: ["conversations"] })` is called
