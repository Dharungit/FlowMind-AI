"use client"

import { Trash2 } from "lucide-react"
import type { Memory } from "../types"
import { cn } from "@/lib/utils"

interface MemoryListProps {
  memories: Memory[]
  isLoading: boolean
  onDelete: (memoryId: string) => void
}

export function MemoryList({ memories, isLoading, onDelete }: MemoryListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-neutral-500">
        Loading memories...
      </div>
    )
  }

  if (memories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-neutral-500">
        No memories stored yet.
      </div>
    )
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {memories.map((memory) => (
        <div
          key={memory.id}
          className={cn(
            "flex items-start gap-3 px-4 py-2.5",
            "border-b border-neutral-100 last:border-b-0",
            "hover:bg-neutral-50 transition-colors duration-150"
          )}
        >
          <span className="flex-1 text-sm text-neutral-700 leading-relaxed break-words min-w-0">
            {memory.memory}
          </span>
          <button
            onClick={() => onDelete(memory.id)}
            className={cn(
              "shrink-0 flex items-center justify-center",
              "size-7 rounded-md",
              "text-neutral-400 hover:text-[#DC2626] hover:bg-red-50",
              "transition-colors duration-200 cursor-pointer",
              "focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1",
            )}
            aria-label="Delete memory"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
