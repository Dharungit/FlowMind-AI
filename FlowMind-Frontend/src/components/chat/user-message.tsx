"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <div
      className="flex justify-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-[85%] md:max-w-[70%]">
        <div className="rounded-2xl bg-[#171717] px-4 py-3 text-white">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
        <div
          className={cn(
            "flex justify-end mt-1 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        >
          <button
            onClick={handleCopy}
            className="flex size-6 items-center justify-center rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label={copied ? "Copied" : "Copy message"}
          >
            {copied ? <Check className="size-4 text-[#16A34A]" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
