"use client"

import { useSession } from "next-auth/react"
import { LogOut, Mail } from "lucide-react"
import { useLogout } from "../hooks/use-auth"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

function getInitial(name: string, email: string): string {
  if (name?.trim()) return name.trim()[0].toUpperCase()
  if (email?.trim()) return email.trim()[0].toUpperCase()
  return "?"
}

export function UserMenu() {
  const { data: session } = useSession()
  const logout = useLogout()
  const user = session?.user

  if (!user) return null

  const initial = getInitial(user.display_name, user.email)

  return (
    <Popover>
      <PopoverTrigger className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-neutral-100 outline-hidden transition-colors hover:bg-neutral-200">
        <Avatar>
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url} alt={user.display_name} />
          ) : null}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" sideOffset={8}>
        <PopoverTitle>{user.display_name}</PopoverTitle>
        <PopoverDescription className="flex items-center gap-1.5">
          <Mail className="size-3.5 shrink-0" />
          {user.email}
        </PopoverDescription>
        <div className="border-t border-border" />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut data-icon="inline-start" />
          {logout.isPending ? "Signing out..." : "Sign out"}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
