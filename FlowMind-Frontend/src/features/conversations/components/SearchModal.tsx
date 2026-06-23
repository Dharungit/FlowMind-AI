"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Search, X, MessageSquare } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchConversations } from "../hooks/useSearchConversations";
import { useConversationContext } from "@/store/conversation/ConversationContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SearchResult } from "../types";

import type { ReactNode } from "react";

function highlightText(text: string): ReactNode[] {
  const parts = text.split(/(<strong>.*?<\/strong>)/g);
  return parts.map((part, i) => {
    if (part.startsWith("<strong>") && part.endsWith("</strong>")) {
      return (
        <strong key={i} className="font-semibold text-[#171717]">
          {part.slice(8, -9)}
        </strong>
      );
    }
    return part;
  });
}

function resultDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-full rounded-md bg-[#F5F5F5] animate-pulse" />
        <div className="h-3 w-3/4 rounded-md bg-[#F5F5F5] animate-pulse" />
      </div>
    </div>
  );
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const { dispatch } = useConversationContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const { data, isLoading, isError, error } = useSearchConversations(debouncedQuery);

  const results = data?.results ?? [];
  const hasSearched = debouncedQuery.trim().length >= 2;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (isError && error) {
      toast.error("Search failed. Please try again.");
    }
  }, [isError, error]);

  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  const handleClear = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      router.push(`/c/${result.conversation_id}`);
      dispatch({ type: "SET_ACTIVE", conversationId: result.conversation_id });
      handleClose();
    },
    [router, dispatch, handleClose],
  );

  const renderContent = () => {
    if (isError) {
      return (
        <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
          <p className="text-sm text-[#DC2626]">Something went wrong. Please try again.</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col gap-0.5 px-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      );
    }

    if (!hasSearched) {
      return (
        <div className="flex flex-col items-center gap-3 px-3 py-12 text-center">
          <Search className="size-8 text-[#737373]" />
          <p className="text-sm text-[#737373]">Search your conversations</p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 px-3 py-12 text-center">
          <MessageSquare className="size-8 text-[#737373]" />
          <p className="text-sm text-[#737373]">No results found</p>
          <p className="text-xs text-[#A3A3A3]">Try different keywords</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <p className="px-3 pb-2 text-xs font-medium text-[#737373]">
          {results.length} {results.length === 1 ? "result" : "results"}
        </p>
        <div className="flex flex-col gap-0.5">
          {results.map((result) => (
            <button
              key={result.conversation_id}
              onClick={() => handleResultClick(result)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left",
                "border border-transparent hover:border-neutral-200 hover:bg-[#F5F5F5]",
                "transition-all duration-150",
                "cursor-pointer outline-none",
                "focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1",
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="flex-1 min-w-0 truncate text-sm font-semibold text-[#171717]">
                    {result.title}
                  </span>
                  <span className="ml-auto shrink-0 pl-2 text-xs text-[#A3A3A3] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {resultDate(result.updated_at)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[#737373]">
                  {highlightText(result.matched_text)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 transition-opacity duration-200" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none",
            "w-[680px] max-w-[calc(100vw-32px)] h-[480px] max-h-[calc(100vh-32px)]",
            "rounded-xl bg-white shadow-xl",
            "flex flex-col overflow-hidden",
            "transition-all duration-200",
          )}
        >
          <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2">
              <Search className="size-4 shrink-0 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats"
                className="flex-1 bg-transparent text-sm text-[#171717] outline-none placeholder:text-neutral-400"
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="flex size-5 items-center justify-center rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-5">{renderContent()}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
