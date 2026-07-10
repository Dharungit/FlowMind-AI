import type { ChatAction } from "./chatTypes"

export function setError(error: string): ChatAction {
  return { type: "SET_ERROR", error }
}

export function clearError(): ChatAction {
  return { type: "CLEAR_ERROR" }
}
