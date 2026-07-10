"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { MessageThread } from "@/components/chat/message-thread";
import { ChatInput } from "@/components/chat/chat-input";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { useConversationContext } from "@/store/conversation/ConversationContext";
import { useConversation } from "@/features/conversations/hooks/useConversations";
import { useStreamMessage } from "@/features/conversations/hooks/useStreamMessage";
import { MessageSquare } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";

export function ChatPage() {
  const { state: convState, dispatch: convDispatch } = useConversationContext();
  const { data: conversation, isLoading } = useConversation(
    convState.activeConversationId,
  );
  const { startStream, stopStream, error: streamError } = useStreamMessage();
  const scrollKeyRef = useRef(0);

  const pendingMessages = useMemo(
    () => (convState.pendingUserMessage ? [convState.pendingUserMessage] : []),
    [convState.pendingUserMessage],
  );

  const messages = useMemo(() => conversation?.messages ?? [], [conversation?.messages]);
  const error = streamError ?? null;
  const isSending = convState.isStreaming;

  const streamingEntry = convState.streamingMessage
    ? [{ role: "assistant" as const, content: convState.streamingMessage.content }]
    : [];

  const allMessages = useMemo(
    () => [...messages, ...pendingMessages, ...streamingEntry],
    [messages, pendingMessages, streamingEntry],
  );
  const hasMessages = allMessages.length > 0;

  useEffect(() => {
    if (messages.length > 0) {
      convDispatch({ type: "SET_PENDING_MESSAGE", message: null });
    }
  }, [messages, convDispatch]);

  const handleSend = useCallback(
    (content: string) => {
      scrollKeyRef.current += 1;
      startStream({
        content,
        activeConversationId: convState.activeConversationId,
      });
    },
    [convState.activeConversationId, startStream],
  );

  if (
    isLoading &&
    convState.activeConversationId &&
    pendingMessages.length === 0 &&
    !convState.streamingMessage
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
          <MessageThread messages={allMessages} isStreaming={convState.isStreaming} scrollToKey={scrollKeyRef.current} />
          {isSending && !convState.streamingMessage && <TypingIndicator />}
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
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <ChatInput onSend={handleSend} disabled={isSending} />
            </div>
            {isSending && (
              <button
                onClick={stopStream}
                className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                aria-label="Stop generating"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
