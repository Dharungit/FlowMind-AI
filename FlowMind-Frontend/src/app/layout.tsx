import type { Metadata } from "next"
import "./globals.css"
import { AuthProviders } from "@/features/auth/components/providers"
import { AppProvider } from "@/store/app/AppContext"
import { AuthProvider } from "@/store/auth/AuthContext"
import { UIProvider } from "@/store/ui/UIContext"
import { ConversationProvider } from "@/store/conversation/ConversationContext"


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
    <html lang="en" className="h-full overflow-hidden">
      <body className="flex flex-col h-full overflow-hidden font-sans antialiased">
        <AuthProviders>
          <AppProvider>
            <AuthProvider>
              <ConversationProvider>
                <UIProvider>
                  <main className="flex min-h-0 flex-1 flex-col">{children}</main>
                </UIProvider>
              </ConversationProvider>
            </AuthProvider>
          </AppProvider>
        </AuthProviders>
      </body>
    </html>
  )
}
