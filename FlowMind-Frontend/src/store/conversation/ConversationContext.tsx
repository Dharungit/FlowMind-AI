"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"

export interface ConversationState {
  activeConversationId: string | null
  pendingUserMessage: { role: string; content: string } | null
}

export type ConversationAction =
  | { type: "SET_ACTIVE"; conversationId: string }
  | { type: "CLEAR_ACTIVE" }
  | { type: "SET_PENDING_MESSAGE"; message: { role: string; content: string } | null }

export const initialConversationState: ConversationState = {
  activeConversationId: null,
  pendingUserMessage: null,
}

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case "SET_ACTIVE":
      return { ...state, activeConversationId: action.conversationId }
    case "CLEAR_ACTIVE":
      return { ...state, activeConversationId: null, pendingUserMessage: null }
    case "SET_PENDING_MESSAGE":
      return { ...state, pendingUserMessage: action.message }
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
