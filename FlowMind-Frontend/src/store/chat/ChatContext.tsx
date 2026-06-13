"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { ChatState, ChatAction } from "./chatTypes"
import { initialChatState } from "./chatTypes"
import { chatReducer } from "./chatReducer"

const ChatContext = createContext<{
  state: ChatState
  dispatch: React.Dispatch<ChatAction>
} | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialChatState)

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatState() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error("useChatState must be used within a ChatProvider")
  }
  return ctx
}
