import type { ChatState, ChatAction } from "./chatTypes"

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_ERROR":
      return { ...state, error: action.error }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    default:
      return state
  }
}
