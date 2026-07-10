"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewChatButtonProps {
  onClick: () => void;
}

export function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
        "text-[#171717] hover:bg-[#F5F5F5]",
        "transition-colors duration-200",
        "cursor-pointer select-none outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1",
      )}
    >
      <MessageCircle className="size-4 shrink-0" />
      New Chat
    </button>
  );
}
