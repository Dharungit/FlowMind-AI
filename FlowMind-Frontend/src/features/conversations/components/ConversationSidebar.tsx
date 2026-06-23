"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { NewChatButton } from "./NewChatButton";
import { ConversationList } from "./ConversationList";
import { DeleteDialog } from "./DeleteDialog";
import { SearchModal } from "./SearchModal";
import { useConversationContext } from "@/store/conversation/ConversationContext";
import {
  useUpdateConversation,
  useDeleteConversation,
  useConversationList,
} from "../hooks/useConversations";
import { cn } from "@/lib/utils";
import type { ConversationResponse } from "../types";

interface ConversationSidebarProps {
  onNewChat: () => void;
  onSelectConversation: (conversation: ConversationResponse) => void;
}

export function ConversationSidebar({ onNewChat, onSelectConversation }: ConversationSidebarProps) {
  const { state } = useConversationContext();
  const { data: conversations } = useConversationList();
  const updateConversation = useUpdateConversation();
  const deleteConversation = useDeleteConversation();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const deleteTarget = conversations?.find((c) => c.id === deleteTargetId) ?? null;

  const handleRename = (id: string, title: string) => {
    updateConversation.mutate({ id, data: { title } });
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteConversation.mutate(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-1 px-3 pt-3 pb-2">
        <NewChatButton onClick={onNewChat} />
        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            "text-[#171717] hover:bg-[#F5F5F5]",
            "transition-colors duration-200",
            "cursor-pointer select-none outline-none",
            "focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1",
          )}
        >
          <Search className="size-4 shrink-0" />
          Search chats
        </button>
      </div>
      {/* divider with 90% width */}
      <div className="w-[90%] mx-auto border-t border-neutral-200 pb-5" />

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

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
