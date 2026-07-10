"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatPage } from "@/components/chat/chat-page";
import { useConversationContext } from "@/store/conversation/ConversationContext";

export default function ConversationChatPage() {
  const params = useParams();
  const { dispatch } = useConversationContext();
  const segments = params.conversationId as string[] | undefined;
  const conversationId = segments?.[1] ?? null;

  useEffect(() => {
    if (conversationId) {
      dispatch({ type: "SET_ACTIVE", conversationId });
    } else {
      dispatch({ type: "CLEAR_ACTIVE" });
    }
  }, [conversationId, dispatch]);

  return <ChatPage />;
}
