import type { Metadata } from "next"
import "./globals.css"
import { AuthProviders } from "@/features/auth/components/providers"
import { AppProvider } from "@/store/app/AppContext"
import { AuthProvider } from "@/store/auth/AuthContext"
import { UIProvider } from "@/store/ui/UIContext"
import { ConversationProvider } from "@/store/conversation/ConversationContext"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"

export const metadata: Metadata = {
  title: "FlowMind Chat",
  description: "AI chat interface",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full font-sans antialiased">
        <AuthProviders>
          <AppProvider>
            <AuthProvider>
              <ConversationProvider>
                <UIProvider>
                  <div className="flex h-full flex-col">
                    <Header />
                    <div className="flex min-h-0 flex-1">
                      <Sidebar />
                      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
                    </div>
                  </div>
                </UIProvider>
              </ConversationProvider>
            </AuthProvider>
          </AppProvider>
        </AuthProviders>
      </body>
    </html>
  )
}
