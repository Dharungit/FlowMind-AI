import { ChatProvider } from "@/store/chat/ChatContext"
import { MemoryProvider } from "@/features/memory/store/MemoryContext"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ChatProvider>
      <MemoryProvider>
      <div className="flex flex-1 min-h-0 flex-col">
        <Header />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
      </MemoryProvider>
    </ChatProvider>
  )
}
