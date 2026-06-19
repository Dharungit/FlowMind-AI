export interface ConversationCreate {
  title: string
}

export interface ConversationUpdate {
  title: string
}

export interface MessageItem {
  role: string
  content?: string | null
  tool_call_id?: string | null
  name?: string | null
}

export interface MessageAddRequest {
  messages: MessageItem[]
}

export interface MessageResponse {
  id: string
  role: string
  content?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface ConversationResponse {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ConversationDetailResponse extends ConversationResponse {
  messages: MessageResponse[]
}

export type ConversationStatus = "idle" | "loading" | "error" | "empty"

export interface StreamRequest {
  conversation_id?: string | null
  messages: MessageItem[]
}

export interface StreamMetaEvent {
  type: "meta"
  conversation_id: string
}

export interface StreamChunkEvent {
  type: "chunk"
  data: Record<string, unknown>
}

export interface StreamDoneEvent {
  type: "done"
  done: true
  conversation_id: string
  message: MessageResponse
}

export interface StreamErrorEvent {
  type: "error"
  error: string
  conversation_id?: string
  message?: MessageResponse
}

export type SSEEvent = StreamMetaEvent | StreamChunkEvent | StreamDoneEvent | StreamErrorEvent
