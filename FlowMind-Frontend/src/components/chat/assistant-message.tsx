import { MarkdownRenderer } from "./markdown-renderer"

interface AssistantMessageProps {
  content: string
  isStreaming?: boolean
}

export function AssistantMessage({ content, isStreaming }: AssistantMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] md:max-w-[70%] rounded-2xl bg-[#F5F5F5] px-4 py-3 text-[#171717]">
        {content ? (
          <MarkdownRenderer content={content} />
        ) : (
          <span className="text-[#737373]">Thinking...</span>
        )}
        {isStreaming && (
          <span className="inline-block w-[6px] h-4 bg-[#171717] ml-0.5 animate-pulse align-text-bottom" />
        )}
      </div>
    </div>
  )
}
