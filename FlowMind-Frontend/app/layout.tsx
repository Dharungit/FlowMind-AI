import type { Metadata } from "next"
import "./globals.css"
import { AuthProviders } from "@/features/auth/components/providers"
import { UserMenu } from "@/features/auth/components/user-menu"

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
          <div className="flex h-full flex-col">
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
              <span className="text-sm font-semibold text-neutral-900">
                FlowMind
              </span>
              <UserMenu />
            </header>
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          </div>
        </AuthProviders>
      </body>
    </html>
  )
}
