"use client"

import { useState, useCallback } from "react"
import { Copy, Check } from "lucide-react"
import { MarkdownRenderer } from "./markdown-renderer"

interface AssistantMessageProps {
  content: string
  isStreaming?: boolean
}

export function AssistantMessage({ content, isStreaming }: AssistantMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] md:max-w-[70%]">
        <div className="rounded-2xl bg-[#F5F5F5] px-4 py-3 text-[#171717]">
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <span className="text-[#737373]">Thinking...</span>
          )}
          {isStreaming && (
            <span className="inline-block w-[6px] h-4 bg-[#171717] ml-0.5 animate-pulse align-text-bottom" />
          )}
        </div>
        {content && !isStreaming && (
          <div className="flex justify-start mt-1">
            <button
              onClick={handleCopy}
              className="flex size-6 items-center justify-center rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label={copied ? "Copied" : "Copy message"}
            >
              {copied ? <Check className="size-3.5 text-[#16A34A]" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
