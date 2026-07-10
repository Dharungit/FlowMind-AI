"use client"

import { useState, useCallback } from "react"
import { MessageSquare } from "lucide-react"
import { ConversationItem } from "./ConversationItem"
import { useConversationList } from "../hooks/useConversations"
import type { ConversationResponse } from "../types"

interface ConversationListProps {
  activeConversationId: string | null
  onSelect?: (conversation: ConversationResponse) => void
  onRename?: (id: string, title: string) => void
  onDelete?: (id: string) => void
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-full rounded-md bg-[#F5F5F5] animate-pulse" />
      </div>
    </div>
  )
}

export function ConversationList({ activeConversationId, onSelect, onRename, onDelete }: ConversationListProps) {
  const { data: conversations, isLoading, isError } = useConversationList()
  const [focusIndex, setFocusIndex] = useState(-1)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!conversations || conversations.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setFocusIndex((prev) => Math.min(prev + 1, conversations.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setFocusIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && focusIndex >= 0) {
      e.preventDefault()
      onSelect?.(conversations[focusIndex])
    }
  }, [conversations, focusIndex, onSelect])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-0.5 px-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
        <p className="text-sm text-[#DC2626]">Failed to load conversations</p>
      </div>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
        <MessageSquare className="size-4 text-[#737373]" />
        <p className="text-sm text-[#737373]">No conversations</p>
        <p className="text-xs text-[#A3A3A3]">Start a new chat</p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-0.5 px-3"
      onKeyDown={handleKeyDown}
    >
      {conversations.map((conversation, index) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === activeConversationId}
          onSelect={() => {
            setFocusIndex(index)
            onSelect?.(conversation)
          }}
          onRename={(title) => onRename?.(conversation.id, title)}
          onDelete={() => onDelete?.(conversation.id)}
        />
      ))}
    </div>
  )
}
