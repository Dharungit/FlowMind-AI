"use client"

import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useMemoryContext } from "../store/MemoryContext"
import { memoryClient } from "../api/memory-client"

export const MEMORIES_KEY = ["memories"] as const
export const MEMORY_USAGE_KEY = ["memory-usage"] as const

export function useMemoryUsageQuery() {
  const { dispatch } = useMemoryContext()
  const query = useQuery({
    queryKey: MEMORY_USAGE_KEY,
    queryFn: () => memoryClient.getUsage(),
  })

  useEffect(() => {
    if (query.data) {
      dispatch({ type: "SET_MEMORY_USAGE", payload: query.data })
    }
  }, [query.data, dispatch])

  return query
}

export function useMemoriesQuery() {
  const { dispatch } = useMemoryContext()
  const query = useQuery({
    queryKey: MEMORIES_KEY,
    queryFn: () => memoryClient.list(),
  })

  useEffect(() => {
    if (query.data) {
      dispatch({ type: "SET_MEMORY_USAGE", payload: query.data.usage })
    }
  }, [query.data, dispatch])

  return query
}

export function useDeleteMemoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => memoryClient.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMORIES_KEY })
      queryClient.invalidateQueries({ queryKey: MEMORY_USAGE_KEY })
      toast.success("Memory deleted")
    },
    onError: () => {
      toast.error("Failed to delete memory")
    },
  })
}
