"use client"

export function TypingIndicator() {
  return (
    <div className="flex justify-start px-4 pb-2">
      <div className="flex items-center gap-1 rounded-2xl bg-[#F5F5F5] px-4 py-3">
        <span className="size-1.5 animate-bounce rounded-full bg-[#737373] [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#737373] [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#737373] [animation-delay:300ms]" />
      </div>
    </div>
  )
}
