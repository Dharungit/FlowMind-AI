"use client";

import { useEffect, useRef, useState } from "react";
import { UserMessage } from "./user-message";
import { AssistantMessage } from "./assistant-message";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/Spinner";

interface Message {
  role: string;
  content?: string | null;
}

interface MessageThreadProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageThread({ messages, isLoading }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUserScrolledUp(false);
  };

  useEffect(() => {
    if (!userScrolledUp) {
      scrollToBottom()
    }
  }, [messages, userScrolledUp])

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setUserScrolledUp(!isNearBottom);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="relative min-h-0 flex-1 flex flex-col overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-4"
      >
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserMessage key={i} content={msg.content ?? ""} />
          ) : (
            <AssistantMessage key={i} content={msg.content ?? ""} />
          ),
        )}
        <div ref={bottomRef} />
      </div>

      {userScrolledUp && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-md h-9 w-9"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
