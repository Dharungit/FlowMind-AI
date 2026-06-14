"use client"

import { useState } from "react"
import { NewChatButton } from "./NewChatButton"
import { ConversationList } from "./ConversationList"
import { DeleteDialog } from "./DeleteDialog"
import { useConversationContext } from "@/store/conversation/ConversationContext"
import { useUpdateConversation, useDeleteConversation, useConversationList } from "../hooks/useConversations"
import type { ConversationResponse } from "../types"

interface ConversationSidebarProps {
  onNewChat: () => void
  onSelectConversation: (conversation: ConversationResponse) => void
}

export function ConversationSidebar({ onNewChat, onSelectConversation }: ConversationSidebarProps) {
  const { state } = useConversationContext()
  const { data: conversations } = useConversationList()
  const updateConversation = useUpdateConversation()
  const deleteConversation = useDeleteConversation()

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const deleteTarget = conversations?.find((c) => c.id === deleteTargetId) ?? null

  const handleRename = (id: string, title: string) => {
    updateConversation.mutate({ id, data: { title } })
  }

  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id)
  }

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteConversation.mutate(deleteTargetId)
      setDeleteTargetId(null)
    }
  }

  return (
    <>
      <div className="flex flex-col px-3 pt-3 pb-2">
        <NewChatButton onClick={onNewChat} />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <ConversationList
          activeConversationId={state.activeConversationId}
          onSelect={onSelectConversation}
          onRename={handleRename}
          onDelete={handleDeleteRequest}
        />
      </div>

      <DeleteDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
