import { getServerSession } from "next-auth"
import { notFound } from "next/navigation"
import { authOptions } from "@/features/auth/api/auth"
import type { UserProfile } from "@/features/auth/api/types"
import { AdminAnalyticsContent } from "./content"

export const dynamic = "force-dynamic"

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions)

  const user = session?.user as UserProfile | undefined

  if (!user?.is_admin) {
    notFound()
  }

  return <AdminAnalyticsContent />
}
