import { cn } from "@/lib/utils"

interface UserMessageProps {
  content: string
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] md:max-w-[70%] rounded-2xl bg-[#171717] px-4 py-3 text-white">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}
