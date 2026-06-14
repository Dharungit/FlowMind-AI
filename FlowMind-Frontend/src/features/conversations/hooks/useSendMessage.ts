"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useConversationContext } from "@/store/conversation/ConversationContext"
import { conversationClient } from "../api/conversation-client"
import type { MessageItem, MessageResponse } from "../types"

const CONVERSATIONS_KEY = ["conversations"] as const

interface SendMessageInput {
  content: string
  activeConversationId: string | null
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  const { dispatch } = useConversationContext()

  return useMutation<MessageResponse, Error, SendMessageInput>({
    mutationFn: async ({ content, activeConversationId }) => {
      let conversationId = activeConversationId

      if (!conversationId) {
        const conv = await conversationClient.create()
        conversationId = conv.id
        dispatch({ type: "SET_ACTIVE", conversationId })
      }

      const message: MessageItem = { role: "user", content }
      return conversationClient.sendMessage(conversationId, { messages: [message] })
    },
    onSuccess: (_result, { activeConversationId }) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
      if (activeConversationId) {
        queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, activeConversationId] })
      }
    },
    onError: (_error, { activeConversationId }) => {
      if (activeConversationId) {
        queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, activeConversationId] })
      }
    },
  })
}
