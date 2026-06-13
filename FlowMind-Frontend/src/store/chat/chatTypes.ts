export interface Message {
  role: "user" | "assistant"
  content: string
}

export interface ChatState {
  messages: Message[]
  isStreaming: boolean
  error: string | null
}

export type ChatAction =
  | { type: "ADD_USER_MESSAGE"; content: string }
  | { type: "START_STREAMING" }
  | { type: "APPEND_TOKEN"; token: string }
  | { type: "FINISH_STREAMING" }
  | { type: "STOP_STREAMING" }
  | { type: "SET_ERROR"; error: string }
  | { type: "CLEAR_ERROR" }

export const initialChatState: ChatState = {
  messages: [],
  isStreaming: false,
  error: null,
}
