"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface RenameInputProps {
  initialTitle: string
  onSubmit: (title: string) => void
  onCancel: () => void
}

export function RenameInput({ initialTitle, onSubmit, onCancel }: RenameInputProps) {
  const [value, setValue] = useState(initialTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== initialTitle) {
      onSubmit(trimmed)
    } else {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSubmit()
        if (e.key === "Escape") onCancel()
      }}
      onBlur={onCancel}
      className={cn(
        "h-5 w-full rounded border border-[#E5E5E5] bg-white px-1 text-sm",
        "text-[#171717] placeholder-[#A3A3A3]",
        "outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
      )}
    />
  )
}
