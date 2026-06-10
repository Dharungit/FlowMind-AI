import { MarkdownRenderer } from "./markdown-renderer"

interface AssistantMessageProps {
  content: string
  isStreaming?: boolean
}

export function AssistantMessage({
  content,
  isStreaming,
}: AssistantMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] md:max-w-[70%] rounded-2xl bg-[#F5F5F5] px-4 py-3 text-[#171717]">
        <MarkdownRenderer content={content} />
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-[#171717] animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  )
}
