"use client"

import { useSession } from "next-auth/react"
import Image from "next/image"
import { LogOut, User } from "lucide-react"
import { useLogout } from "../hooks/use-auth"
import { Button } from "@/components/ui/button"

export function UserMenu() {
  const { data: session } = useSession()
  const logout = useLogout()
  const user = session?.user

  if (!user) return null

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.display_name}
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-neutral-100">
            <User className="size-4 text-neutral-500" />
          </div>
        )}
        <span className="hidden text-sm font-medium text-neutral-700 sm:inline">
          {user.display_name}
        </span>
      </div>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        <LogOut data-icon="inline-start" />
        {logout.isPending ? "Signing out..." : "Sign out"}
      </Button>
    </div>
  )
}
