"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageThread } from "@/components/chat/message-thread";
import { ChatInput } from "@/components/chat/chat-input";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { useConversationContext } from "@/store/conversation/ConversationContext";
import { useConversation } from "@/features/conversations/hooks/useConversations";
import { useSendMessage } from "@/features/conversations/hooks/useSendMessage";
import { MessageSquare } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";

export function ChatPage() {
  const { state: convState } = useConversationContext();
  const { data: conversation, isLoading } = useConversation(
    convState.activeConversationId,
  );
  const sendMessage = useSendMessage();

  const [pendingMessages, setPendingMessages] = useState<
    { role: string; content: string }[]
  >([]);

  const messages = conversation?.messages ?? [];
  const error = sendMessage.error?.message ?? null;
  const isSending = sendMessage.isPending;

  const allMessages = [...messages, ...pendingMessages];
  const hasMessages = allMessages.length > 0;

  useEffect(() => {
    if (messages.length > 0) {
      setPendingMessages([]);
    }
  }, [messages]);

  const handleSend = useCallback(
    (content: string) => {
      setPendingMessages((prev) => [...prev, { role: "user", content }]);
      sendMessage.mutate({
        content,
        activeConversationId: convState.activeConversationId,
      });
    },
    [convState.activeConversationId, sendMessage],
  );

  if (
    isLoading &&
    convState.activeConversationId &&
    pendingMessages.length === 0
  ) {
    return (
      <div className="flex flex-1 min-h-0 items-start justify-center bg-white pt-32">
        <Spinner className="size-5" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-white overflow-hidden">
      {hasMessages ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MessageThread messages={allMessages} />
          {isSending && <TypingIndicator />}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 overflow-hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F5F5]">
            <MessageSquare className="h-6 w-6 text-[#737373]" />
          </div>
          <h2 className="text-lg font-semibold text-[#171717]">
            Start a conversation
          </h2>
          <p className="text-sm text-[#737373] max-w-sm text-center">
            Send a message to begin chatting with the AI assistant.
          </p>
        </div>
      )}

      {error && (
        <div className="pb-2">
          <div className="mx-auto max-w-3xl px-4">
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-neutral-200 px-4 pb-4 pt-2">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={handleSend} disabled={isSending} />
        </div>
      </div>
    </div>
  );
}
