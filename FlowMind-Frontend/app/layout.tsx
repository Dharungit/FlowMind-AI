import type { Metadata } from "next"
import "./globals.css"
import { AuthProviders } from "@/features/auth/components/providers"

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
        <AuthProviders>{children}</AuthProviders>
      </body>
    </html>
  )
}
