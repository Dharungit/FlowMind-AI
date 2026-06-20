"use client"

import { Brain } from "lucide-react"
import { useMemoryContext } from "../store/MemoryContext"
import { useMemoryUsageQuery } from "../hooks/use-memory"
import { cn } from "@/lib/utils"

function getPercentageColor(percentage: number): string {
  if (percentage >= 80) return "text-[#DC2626]"
  if (percentage >= 50) return "text-[#EA580C]"
  return "text-[#16A34A]"
}

interface MemoryPillProps {
  onClick: () => void
}

export function MemoryPill({ onClick }: MemoryPillProps) {
  useMemoryUsageQuery()
  const { state } = useMemoryContext()
  const percentage = Math.round(state.percentage * 100)

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium",
        "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
        "transition-colors duration-200 cursor-pointer",
        "focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1",
      )}
      aria-label={`Memory usage: ${percentage}%`}
    >
      <Brain className="size-3.5" />
      <span>
        Memory{" "}
        <span className={getPercentageColor(state.percentage)}>
          {percentage}%
        </span>
      </span>
    </button>
  )
}
