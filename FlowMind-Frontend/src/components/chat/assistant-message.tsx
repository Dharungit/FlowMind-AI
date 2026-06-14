import { MarkdownRenderer } from "./markdown-renderer"

interface AssistantMessageProps {
  content: string
}

export function AssistantMessage({ content }: AssistantMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] md:max-w-[70%] rounded-2xl bg-[#F5F5F5] px-4 py-3 text-[#171717]">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}
