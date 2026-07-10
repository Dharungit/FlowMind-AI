"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useConversationContext } from "@/store/conversation/ConversationContext"
import { conversationClient } from "../api/conversation-client"
import type { ConversationUpdate } from "../types"

export const CONVERSATIONS_KEY = ["conversations"] as const

export function useConversationList() {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: conversationClient.list.bind(conversationClient),
  })
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: [...CONVERSATIONS_KEY, id],
    queryFn: () => (id ? conversationClient.get(id) : null),
    enabled: !!id,
  })
}

export function useGenerateTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => conversationClient.generateTitle(id),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, id] })
    },
    onError: () => {
      toast.error("Failed to generate conversation title")
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
    },
  })
}

export function useUpdateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConversationUpdate }) =>
      conversationClient.update(id, data.title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { state, dispatch } = useConversationContext()

  return useMutation({
    mutationFn: (id: string) => conversationClient.delete(id),
    onSuccess: (_result, deletedId) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
      if (state.activeConversationId === deletedId) {
        dispatch({ type: "CLEAR_ACTIVE" })
        router.push("/")
      }
    },
  })
}
