"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ConversationSidebar } from "@/features/conversations/components/ConversationSidebar"
import { useConversationContext } from "@/store/conversation/ConversationContext"
import { useUI } from "@/store/ui/UIContext"
import { cn } from "@/lib/utils"
import type { ConversationResponse } from "@/features/conversations/types"

export function Sidebar() {
  const router = useRouter()
  const { state, dispatch } = useUI()
  const { dispatch: convDispatch } = useConversationContext()
  const isOpen = state.sidebarOpen

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        dispatch({ type: "CLOSE_SIDEBAR" })
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, dispatch])

  const handleNewChat = () => {
    router.push("/")
    convDispatch({ type: "CLEAR_ACTIVE" })
  }

  const handleSelectConversation = (conversation: ConversationResponse) => {
    router.push(`/c/${conversation.id}`)
    convDispatch({ type: "SET_ACTIVE", conversationId: conversation.id })
  }

  return (
    <>
      <div
        className={cn(
          "hidden md:flex h-full flex-col border-r border-[#E5E5E5] bg-white shrink-0 overflow-hidden",
          "transition-all duration-300 ease motion-reduce:transition-none",
          isOpen ? "w-[280px]" : "w-0 border-r-0"
        )}
      >
        <ConversationSidebar
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300"
          onClick={() => dispatch({ type: "CLOSE_SIDEBAR" })}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white shadow-xl md:hidden",
          "transition-transform duration-300 ease motion-reduce:transition-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ConversationSidebar
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
        />
      </div>
    </>
  )
}
