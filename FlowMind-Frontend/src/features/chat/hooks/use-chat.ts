"use client"

import { useCallback, useRef } from "react"
import { sendMessage as sendChatMessage } from "@/features/chat/api/chat-client"
import { useChatState } from "@/store/chat/ChatContext"
import { addUserMessage, startStreaming, appendToken, finishStreaming, stopStreaming, setError } from "@/store/chat/chatActions"
import type { Message } from "@/store/chat/chatTypes"

export { type Message }

export function useChat() {
  const { state, dispatch } = useChatState()
  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef(state.messages)
  messagesRef.current = state.messages

  const send = useCallback(async (content: string) => {
    dispatch(addUserMessage(content))
    dispatch(startStreaming())

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const messagesForApi = [
        ...messagesRef.current,
        { role: "user" as const, content },
      ]

      await sendChatMessage(messagesForApi as Message[], {
        onToken: (token) => dispatch(appendToken(token)),
        onDone: () => dispatch(finishStreaming()),
        onError: (err) =>
          dispatch(setError(err.message)),
        signal: abort.signal,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      dispatch(setError(err instanceof Error ? err.message : "Something went wrong"))
    }
  }, [dispatch])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    dispatch(stopStreaming())
  }, [dispatch])

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    error: state.error,
    send,
    stop,
  }
}
