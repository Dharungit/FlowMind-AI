"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { ChatPage } from "@/components/chat/chat-page"
import { useConversationContext } from "@/store/conversation/ConversationContext"

export default function ConversationChatPage() {
  const params = useParams()
  const { dispatch } = useConversationContext()
  const conversationId = params.conversationId as string

  useEffect(() => {
    dispatch({ type: "SET_ACTIVE", conversationId })
  }, [conversationId, dispatch])

  return <ChatPage />
}
