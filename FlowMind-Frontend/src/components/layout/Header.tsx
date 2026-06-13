import { UserMenu } from "@/features/auth/components/user-menu"

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
      <span className="text-sm font-semibold text-neutral-900">
        FlowMind
      </span>
      <UserMenu />
    </header>
  )
}
