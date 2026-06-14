"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useConversationContext } from "@/store/conversation/ConversationContext"
import * as mockService from "../conversations.mock"
import type { ConversationCreate, ConversationUpdate } from "../types"

const CONVERSATIONS_KEY = ["conversations"] as const

export function useConversationList() {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: mockService.getConversations,
  })
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: [...CONVERSATIONS_KEY, id],
    queryFn: () => (id ? mockService.getConversation(id) : null),
    enabled: !!id,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  const { dispatch } = useConversationContext()

  return useMutation({
    mutationFn: (data: ConversationCreate) => mockService.createConversation(data),
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
      dispatch({ type: "SET_ACTIVE", conversationId: newConversation.id })
    },
  })
}

export function useUpdateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConversationUpdate }) =>
      mockService.updateConversation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  const { state, dispatch } = useConversationContext()

  return useMutation({
    mutationFn: (id: string) => mockService.deleteConversation(id),
    onSuccess: (_result, deletedId) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
      if (state.activeConversationId === deletedId) {
        dispatch({ type: "CLEAR_ACTIVE" })
      }
    },
  })
}
