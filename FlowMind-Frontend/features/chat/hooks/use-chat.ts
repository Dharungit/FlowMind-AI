"use client"

import { useReducer, useRef, useCallback } from "react"
import { sendMessage as sendChatMessage } from "@/features/chat/api/chat-client"

interface Message {
  role: "user" | "assistant"
  content: string
}

export type { Message }

export type ChatState = {
  messages: Message[]
  isStreaming: boolean
  error: string | null
}

export type ChatAction =
  | { type: "ADD_USER_MESSAGE"; content: string }
  | { type: "START_STREAMING" }
  | { type: "APPEND_TOKEN"; token: string }
  | { type: "FINISH_STREAMING" }
  | { type: "STOP_STREAMING" }
  | { type: "SET_ERROR"; error: string }
  | { type: "CLEAR_ERROR" }

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          { role: "user", content: action.content },
        ],
        error: null,
      }
    case "START_STREAMING":
      return {
        ...state,
        isStreaming: true,
        messages: [
          ...state.messages,
          { role: "assistant", content: "" },
        ],
      }
    case "APPEND_TOKEN": {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      msgs[msgs.length - 1] = { ...last, content: last.content + action.token }
      return { ...state, messages: msgs }
    }
    case "FINISH_STREAMING":
      return { ...state, isStreaming: false }
    case "STOP_STREAMING": {
      const msgs = [...state.messages]
      if (msgs.length > 0 && msgs[msgs.length - 1].content === "") {
        msgs.pop()
      }
      return { ...state, messages: msgs, isStreaming: false }
    }
    case "SET_ERROR":
      return { ...state, error: action.error, isStreaming: false }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    default:
      return state
  }
}

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
  error: null,
}

export function useChat() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef(state.messages)
  messagesRef.current = state.messages

  const send = useCallback(async (content: string) => {
    dispatch({ type: "ADD_USER_MESSAGE", content })
    dispatch({ type: "START_STREAMING" })

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const messagesForApi = [
        ...messagesRef.current,
        { role: "user" as const, content },
      ]

      await sendChatMessage(messagesForApi as Message[], {
        onToken: (token) => dispatch({ type: "APPEND_TOKEN", token }),
        onDone: () => dispatch({ type: "FINISH_STREAMING" }),
        onError: (err) =>
          dispatch({ type: "SET_ERROR", error: err.message }),
        signal: abort.signal,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      dispatch({
        type: "SET_ERROR",
        error: err instanceof Error ? err.message : "Something went wrong",
      })
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    dispatch({ type: "STOP_STREAMING" })
  }, [])

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    error: state.error,
    send,
    stop,
  }
}
