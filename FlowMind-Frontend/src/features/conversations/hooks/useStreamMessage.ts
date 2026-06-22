"use client"

import { useCallback, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useConversationContext } from "@/store/conversation/ConversationContext"
import { conversationClient, parseSSEResponse } from "../api/conversation-client"
import { useGenerateTitle } from "./useConversations"
import type { ConversationDetailResponse, StreamRequest } from "../types"

const CONVERSATIONS_KEY = ["conversations"] as const

interface StreamMessageInput {
  content: string
  activeConversationId: string | null
}

export function useStreamMessage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { dispatch } = useConversationContext()
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isNewConversationRef = useRef(false)
  const accumulatedContentRef = useRef("")
  const userMessageRef = useRef("")
  const { mutate: generateTitle } = useGenerateTitle()

  const startStream = useCallback(
    async ({ content, activeConversationId }: StreamMessageInput) => {
      setError(null)
      isNewConversationRef.current = !activeConversationId
      userMessageRef.current = content
      accumulatedContentRef.current = ""

      if (abortRef.current) {
        abortRef.current.abort()
      }

      const abortController = new AbortController()
      abortRef.current = abortController
      dispatch({ type: "STREAM_START", abortController })

      dispatch({
        type: "SET_PENDING_MESSAGE",
        message: { role: "user", content },
      })

      try {
        const body: StreamRequest = {
          messages: [{ role: "user", content }],
        }
        if (activeConversationId) {
          body.conversation_id = activeConversationId
        }

        const response = await conversationClient.streamMessage(body, abortController.signal)

        for await (const event of parseSSEResponse(response)) {
          switch (event.type) {
            case "meta":
              dispatch({ type: "STREAM_META", conversationId: event.conversation_id })
              router.replace(`/c/${event.conversation_id}`)
              break
            case "chunk": {
              const delta = (event.data as { choices?: { delta?: { content?: string } }[] })?.choices?.[0]?.delta?.content
              if (delta) {
                accumulatedContentRef.current += delta
                dispatch({ type: "STREAM_CHUNK", content: delta })
              }
              break
            }
            case "done":
              if (event.conversation_id && (isNewConversationRef.current || accumulatedContentRef.current)) {
                const now = new Date().toISOString()
                const seed: ConversationDetailResponse = {
                  id: event.conversation_id,
                  title: "",
                  title_generated: false,
                  created_at: now,
                  updated_at: now,
                  messages: [
                    {
                      id: "seed-user",
                      role: "user",
                      content: userMessageRef.current,
                      metadata: null,
                      created_at: now,
                    },
                    {
                      id: "seed-ai",
                      role: "assistant",
                      content: accumulatedContentRef.current,
                      metadata: null,
                      created_at: now,
                    },
                  ],
                }
                queryClient.setQueryData([...CONVERSATIONS_KEY, event.conversation_id], seed)
              }
              dispatch({ type: "STREAM_DONE" })
              abortRef.current = null
              if (event.conversation_id && isNewConversationRef.current) {
                generateTitle(event.conversation_id)
              }
              break
            case "error":
              dispatch({ type: "STREAM_ERROR" })
              abortRef.current = null
              setError(event.error)
              queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
              if (event.conversation_id) {
                queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, event.conversation_id] })
              }
              return
          }
        }
      } catch (err) {
        if (abortController.signal.aborted) {
          dispatch({ type: "STREAM_ABORT" })
          abortRef.current = null
          return
        }
        dispatch({ type: "STREAM_ERROR" })
        abortRef.current = null
        const message = err instanceof Error ? err.message : "Stream failed"
        setError(message)
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
        if (activeConversationId) {
          queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, activeConversationId] })
        }
      }
    },
    [dispatch, router, queryClient, generateTitle],
  )

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
      dispatch({ type: "STREAM_ABORT" })
    }
  }, [dispatch])

  return { startStream, stopStream, error }
}
