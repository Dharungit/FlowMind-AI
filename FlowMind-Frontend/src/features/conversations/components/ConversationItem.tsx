"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { RenameInput } from "./RenameInput"
import type { ConversationResponse } from "../types"

function relativeTime(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

interface ConversationItemProps {
  conversation: ConversationResponse
  isActive: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex h-10 cursor-pointer items-center rounded-lg px-3 transition-colors duration-150",
        isActive ? "bg-[#EBEBEB]" : "hover:bg-[#F5F5F5]"
      )}
      onClick={onSelect}
    >
      <div className="flex flex-1 items-center min-w-0 gap-2">
        {isEditing ? (
          <RenameInput
            initialTitle={conversation.title}
            onSubmit={(title) => {
              onRename(title)
              setIsEditing(false)
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <span
            className={cn(
              "truncate text-sm leading-5",
              isActive ? "font-medium text-[#171717]" : "text-[#171717]"
            )}
            title={conversation.title}
          >
            {conversation.title}
          </span>
        )}
      </div>

      {!isEditing && (
        <div className="flex shrink-0 items-center gap-0.5">
          {isHovered ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
                className="flex size-6 items-center justify-center rounded text-[#737373] hover:text-[#171717] hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                aria-label="Rename"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="flex size-6 items-center justify-center rounded text-[#737373] hover:text-[#DC2626] hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                aria-label="Delete"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          ) : (
            <span className="text-xs text-[#737373]">{relativeTime(conversation.updated_at)}</span>
          )}
        </div>
      )}
    </div>
  )
}
