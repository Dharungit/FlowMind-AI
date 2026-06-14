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
