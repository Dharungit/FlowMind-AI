import type { ChatState, ChatAction } from "./chatTypes"

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          { role: "user", content: action.content },
        ],
        error: null,
      }
    case "START_STREAMING":
      return {
        ...state,
        isStreaming: true,
        messages: [
          ...state.messages,
          { role: "assistant", content: "" },
        ],
      }
    case "APPEND_TOKEN": {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      msgs[msgs.length - 1] = { ...last, content: last.content + action.token }
      return { ...state, messages: msgs }
    }
    case "FINISH_STREAMING":
      return { ...state, isStreaming: false }
    case "STOP_STREAMING": {
      const msgs = [...state.messages]
      if (msgs.length > 0 && msgs[msgs.length - 1].content === "") {
        msgs.pop()
      }
      return { ...state, messages: msgs, isStreaming: false }
    }
    case "SET_ERROR":
      return { ...state, error: action.error, isStreaming: false }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    default:
      return state
  }
}
