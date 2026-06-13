"use client"

import { useRef, useEffect, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isStreaming && !disabled) {
      textareaRef.current?.focus()
    }
  }, [isStreaming, disabled])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
      <div className="flex items-end gap-2 p-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              adjustHeight()
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming ? "Generating..." : "Send a message..."
            }
            disabled={disabled || isStreaming}
            className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent px-3 py-3 text-sm placeholder:text-[#737373] focus-visible:ring-0 disabled:opacity-50"
            rows={1}
          />
        </div>

        {isStreaming ? (
          <Button
            type="button"
            variant="default"
            size="icon"
            className="mb-1 h-[32px] w-[32px] shrink-0 rounded-lg bg-[#DC2626] hover:bg-[#DC2626]/90"
            onClick={onStop}
          >
            <Square className="h-3.5 w-3.5 fill-white" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size="icon"
            className="mb-1 h-[32px] w-[32px] shrink-0 rounded-lg bg-[#2563EB] hover:bg-[#2563EB]/90"
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
