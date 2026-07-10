export interface ChatState {
  error: string | null
}

export type ChatAction =
  | { type: "SET_ERROR"; error: string }
  | { type: "CLEAR_ERROR" }

export const initialChatState: ChatState = {
  error: null,
}
