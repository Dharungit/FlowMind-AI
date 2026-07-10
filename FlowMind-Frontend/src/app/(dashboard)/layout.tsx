import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MemoryProvider } from "@/features/memory/store/MemoryContext"
import { Header } from "@/components/layout/Header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MemoryProvider>
      <div className="flex min-h-0 flex-1 flex-col">
        <Header />
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-[#e2e8f0] px-4 py-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#171717] transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              Back to Chat
            </Link>
          </div>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-5xl space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MemoryProvider>
  )
}
