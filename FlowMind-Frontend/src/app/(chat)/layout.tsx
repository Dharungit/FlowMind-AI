import { ChatProvider } from "@/store/chat/ChatContext"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ChatProvider>{children}</ChatProvider>
}
