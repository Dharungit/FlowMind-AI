## ADDED Requirements

### Requirement: Stream assistant response tokens
The frontend SHALL display assistant response tokens incrementally as SSE events arrive from POST /v1/stream, without waiting for the full response.

#### Scenario: Stream returns full response
- **GIVEN** a conversation exists with conversation_id "conv-123"
- **WHEN** the user sends a message with content "Hello"
- **AND** the frontend calls POST /v1/stream with body `{"conversation_id": "conv-123", "messages": [{"role": "user", "content": "Hello"}]}`
- **THEN** the response must be a text/event-stream
- **AND** the frontend must parse each SSE data line as a JSON event
- **AND** delta content from `choices[0].delta.content` must be appended to the displayed message incrementally
- **AND** the final `{"done": true, "message": {...}}` event must replace the streaming message with the final persisted message

#### Scenario: Stream supports cancellation mid-generation
- **GIVEN** a stream is in progress and the assistant is still generating tokens
- **WHEN** the user clicks "Stop" or navigates away
- **THEN** the frontend must call `AbortController.abort()`
- **AND** any tokens already received must remain visible in the UI
- **AND** no further SSE events should be processed

#### Scenario: Stream handles network error mid-way
- **GIVEN** a stream is in progress
- **WHEN** the network connection drops before the done event
- **THEN** the frontend must catch the fetch error
- **AND** dispatch a STREAM_ERROR action with the error message
- **AND** display an error banner above the input
- **AND** the partial tokens received so far must remain visible

#### Scenario: Stream handles auth token expiry
- **GIVEN** the access token expires during a stream
- **WHEN** the backend returns a 401 response
- **THEN** `apiClient.stream()` must attempt a token refresh
- **AND** if refresh succeeds, retry the stream request
- **AND** if refresh fails, sign out the user

### Requirement: SSE parsing produces typed events
The SSE parser SHALL transform raw ReadableStream bytes into structured event objects for the rest of the application to consume.

#### Scenario: Parser identifies meta event
- **GIVEN** a ReadableStream yielding the line `data: {"type": "meta", "conversation_id": "conv-123"}\n\n`
- **WHEN** the parser reads the next event
- **THEN** it must yield `{type: "meta", conversation_id: "conv-123"}`

#### Scenario: Parser identifies delta chunk event
- **GIVEN** a ReadableStream yielding the line `data: {"id":"chunk-1","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}],"usage":null}\n\n`
- **WHEN** the parser reads the next event
- **THEN** it must yield `{type: "chunk", data: {choices: [{delta: {content: "Hello"}}]}}`

#### Scenario: Parser identifies done event
- **GIVEN** a ReadableStream yielding the line `data: {"done":true,"conversation_id":"conv-123","message":{"id":"msg-1","role":"assistant","content":"Hello world","created_at":"..."}}\n\n`
- **WHEN** the parser reads the next event
- **THEN** it must yield `{type: "done", conversation_id: "conv-123", message: {id: "msg-1", role: "assistant", content: "Hello world"}}`

#### Scenario: Parser identifies error event
- **GIVEN** a ReadableStream yielding the line `data: {"type":"error","error":"Rate limit exceeded","conversation_id":"conv-123","message":{...}}\n\n`
- **WHEN** the parser reads the next event
- **THEN** it must yield `{type: "error", error: "Rate limit exceeded", conversation_id: "conv-123"}`
