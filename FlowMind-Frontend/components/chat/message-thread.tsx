"use client"

import { useEffect, useRef, useState } from "react"
import { UserMessage } from "./user-message"
import { AssistantMessage } from "./assistant-message"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface MessageThreadProps {
  messages: Message[]
  isStreaming?: boolean
}

export function MessageThread({ messages, isStreaming }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [userScrolledUp, setUserScrolledUp] = useState(false)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    setUserScrolledUp(false)
  }

  useEffect(() => {
    if (!userScrolledUp) {
      scrollToBottom()
    }
  }, [messages, userScrolledUp])

  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setUserScrolledUp(!isNearBottom)
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-6 space-y-4"
      >
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserMessage key={i} content={msg.content} />
          ) : (
            <AssistantMessage
              key={i}
              content={msg.content}
              isStreaming={isStreaming && i === messages.length - 1}
            />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {userScrolledUp && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-md h-9 w-9"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
