"use client"

import { useCallback } from "react"
import { MessageThread } from "@/components/chat/message-thread"
import { ChatInput } from "@/components/chat/chat-input"
import { useChat } from "@/features/chat/hooks/use-chat"
import { useConversationContext } from "@/store/conversation/ConversationContext"
import { useCreateConversation } from "@/features/conversations/hooks/useConversations"
import { MessageSquare } from "lucide-react"

export function ChatPage() {
  const { messages, isStreaming, error, send, stop } = useChat()
  const { state: convState } = useConversationContext()
  const createConversation = useCreateConversation()
  const hasMessages = messages.length > 0

  const handleSend = useCallback(async (content: string) => {
    if (!convState.activeConversationId && !hasMessages) {
      await createConversation.mutateAsync({ title: "New Conversation" })
    }
    send(content)
  }, [convState.activeConversationId, hasMessages, createConversation, send])

  return (
    <div className="flex h-full flex-col bg-white">
      {hasMessages ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <MessageThread
            messages={messages}
            isStreaming={isStreaming}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4">
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

      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            onSend={handleSend}
            onStop={stop}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </div>
  )
}
