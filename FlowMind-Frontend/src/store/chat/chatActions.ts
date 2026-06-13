import type { ChatAction } from "./chatTypes"

export function addUserMessage(content: string): ChatAction {
  return { type: "ADD_USER_MESSAGE", content }
}

export function startStreaming(): ChatAction {
  return { type: "START_STREAMING" }
}

export function appendToken(token: string): ChatAction {
  return { type: "APPEND_TOKEN", token }
}

export function finishStreaming(): ChatAction {
  return { type: "FINISH_STREAMING" }
}

export function stopStreaming(): ChatAction {
  return { type: "STOP_STREAMING" }
}

export function setError(error: string): ChatAction {
  return { type: "SET_ERROR", error }
}

export function clearError(): ChatAction {
  return { type: "CLEAR_ERROR" }
}
