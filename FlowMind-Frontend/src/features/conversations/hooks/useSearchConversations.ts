"use client"

import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { conversationClient } from "../api/conversation-client"
import { CONVERSATIONS_KEY } from "./useConversations"
import type { SearchResponse } from "../types"

export function useSearchConversations(query: string): UseQueryResult<SearchResponse> {
  return useQuery<SearchResponse>({
    queryKey: [...CONVERSATIONS_KEY, "search", query],
    queryFn: () => conversationClient.search(query),
    enabled: query.trim().length >= 2,
  })
}
