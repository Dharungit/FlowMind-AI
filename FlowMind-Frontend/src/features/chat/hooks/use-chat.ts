"use client"

import { useChatState } from "@/store/chat/ChatContext"

export function useChat() {
  const { state } = useChatState()

  return {
    error: state.error,
  }
}
