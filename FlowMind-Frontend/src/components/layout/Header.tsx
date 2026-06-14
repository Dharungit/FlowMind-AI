"use client";

import { Menu } from "lucide-react";
import { UserMenu } from "@/features/auth/components/user-menu";
import { useUI } from "@/store/ui/UIContext";
import { cn } from "@/lib/utils";

export function Header() {
  const { dispatch } = useUI();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
            "transition-colors duration-200 cursor-pointer",
            "focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1",
          )}
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </button>
        <span className="text-sm font-semibold text-neutral-900">FlowMind</span>
      </div>
      <UserMenu />
    </header>
  );
}
