"use client"

import { useReducer, useRef, useCallback } from "react"
import { MessageThread } from "@/components/chat/message-thread"
import { ChatInput } from "@/components/chat/chat-input"
import { sendMessage } from "@/lib/chat"
import { MessageSquare } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

type State = {
  messages: Message[]
  isStreaming: boolean
  error: string | null
}

type Action =
  | { type: "ADD_USER_MESSAGE"; content: string }
  | { type: "START_STREAMING" }
  | { type: "APPEND_TOKEN"; token: string }
  | { type: "FINISH_STREAMING" }
  | { type: "STOP_STREAMING" }
  | { type: "SET_ERROR"; error: string }
  | { type: "CLEAR_ERROR" }

function reducer(state: State, action: Action): State {
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

export default function ChatPage() {
  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    isStreaming: false,
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const handleSend = useCallback(async (content: string) => {
    dispatch({ type: "ADD_USER_MESSAGE", content })
    dispatch({ type: "START_STREAMING" })

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const messagesForApi = [
        ...state.messages,
        { role: "user" as const, content },
      ]
      await sendMessage(messagesForApi, {
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
  }, [state.messages])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    dispatch({ type: "STOP_STREAMING" })
  }, [])

  const hasMessages = state.messages.length > 0

  return (
    <div className="flex h-dvh flex-col bg-white">
      {hasMessages ? (
        <MessageThread
          messages={state.messages}
          isStreaming={state.isStreaming}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F5F5]">
            <MessageSquare className="h-6 w-6 text-[#737373]" />
          </div>
          <h2 className="text-lg font-semibold text-[#171717]">
            Start a conversation
          </h2>
          <p className="text-sm text-[#737373] max-w-sm text-center">
            Send a message to begin chatting with the AI assistant.
          </p>
        </div>
      )}

      {state.error && (
        <div className="mx-auto max-w-3xl px-4 pb-2">
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            {state.error}
          </div>
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={state.isStreaming}
      />
    </div>
  )
}
