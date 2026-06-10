# 0002. Use native fetch with ReadableStream and AbortController for streaming chat responses

## Context and Problem Statement

The chat interface needs to display assistant responses token-by-token as they arrive from the backend. This requires consuming a server-sent stream of data over HTTP and rendering each chunk incrementally. The solution must support cancellation (user stops generation mid-stream) and work without adding external streaming libraries. The backend sends streaming responses via ReadableStream (SSE-style).

## Considered Options

- **Native fetch + ReadableStream + AbortController**: Uses the browser's built-in streaming API. ReadableStream provides on-the-fly chunk reading. AbortController handles cancellation. No extra dependencies.
- **EventSource API**: Built-in SSE client. Simpler for pure SSE but doesn't support POST requests or custom headers (only GET). Cannot send the required JSON payload.
- **Server-Sent Events polyfill library**: Adds a dependency. May not keep up with browser standards. Overkill for a single chat endpoint.
- **WebSocket**: Persistent connection, bidirectional. Adds complexity (connection management, reconnection). Not needed when the backend already supports streaming HTTP.

## Decision Outcome

Chosen option: "native fetch + ReadableStream + AbortController", because it uses zero additional dependencies, works with POST requests, supports custom headers, and provides native cancellation via AbortController. The `ReadableStream` API is well-supported in modern browsers and matches the backend's SSE output format.

### Consequences

- Good, because no external streaming library is needed
- Good, because AbortController provides clean cancellation without memory leaks
- Good, because fetch POST allows sending the required JSON payload with conversation history
- Bad, because ReadableStream parsing requires manual line-by-line handling of SSE chunks
- Bad, because older browsers may need a ReadableStream polyfill
