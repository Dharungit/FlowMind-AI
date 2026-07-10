"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"

export interface StreamingMessage {
  content: string
  conversationId?: string
}

export interface ConversationState {
  activeConversationId: string | null
  pendingUserMessage: { role: string; content: string } | null
  isStreaming: boolean
  streamingMessage: StreamingMessage | null
  streamAbortController: AbortController | null
}

export type ConversationAction =
  | { type: "SET_ACTIVE"; conversationId: string }
  | { type: "CLEAR_ACTIVE" }
  | { type: "SET_PENDING_MESSAGE"; message: { role: string; content: string } | null }
  | { type: "STREAM_START"; abortController: AbortController }
  | { type: "STREAM_CHUNK"; content: string }
  | { type: "STREAM_META"; conversationId: string }
  | { type: "STREAM_DONE" }
  | { type: "STREAM_ERROR" }
  | { type: "STREAM_ABORT" }

export const initialConversationState: ConversationState = {
  activeConversationId: null,
  pendingUserMessage: null,
  isStreaming: false,
  streamingMessage: null,
  streamAbortController: null,
}

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case "SET_ACTIVE":
      return { ...state, activeConversationId: action.conversationId }
    case "CLEAR_ACTIVE":
      return {
        ...state,
        activeConversationId: null,
        pendingUserMessage: null,
        isStreaming: false,
        streamingMessage: null,
        streamAbortController: null,
      }
    case "SET_PENDING_MESSAGE":
      return { ...state, pendingUserMessage: action.message }
    case "STREAM_START":
      return {
        ...state,
        isStreaming: true,
        streamingMessage: { content: "" },
        streamAbortController: action.abortController,
      }
    case "STREAM_CHUNK":
      return {
        ...state,
        streamingMessage: state.streamingMessage
          ? { ...state.streamingMessage, content: state.streamingMessage.content + action.content }
          : { content: action.content },
      }
    case "STREAM_META":
      return {
        ...state,
        activeConversationId: action.conversationId,
        streamingMessage: state.streamingMessage
          ? { ...state.streamingMessage, conversationId: action.conversationId }
          : { content: "", conversationId: action.conversationId },
      }
    case "STREAM_DONE":
      return {
        ...state,
        isStreaming: false,
        streamingMessage: null,
        streamAbortController: null,
        pendingUserMessage: null,
      }
    case "STREAM_ERROR":
      return {
        ...state,
        isStreaming: false,
        streamAbortController: null,
      }
    case "STREAM_ABORT":
      return {
        ...state,
        isStreaming: false,
        streamAbortController: null,
      }
    default:
      return state
  }
}

const ConversationContext = createContext<{
  state: ConversationState
  dispatch: React.Dispatch<ConversationAction>
} | null>(null)

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, initialConversationState)

  return (
    <ConversationContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversationContext() {
  const ctx = useContext(ConversationContext)
  if (!ctx) {
    throw new Error("useConversationContext must be used within a ConversationProvider")
  }
  return ctx
}
