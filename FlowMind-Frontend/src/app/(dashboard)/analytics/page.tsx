"use client"

import { useUserAnalytics } from "@/features/analytics/hooks/use-analytics"
import { UserSummaryCards } from "@/features/analytics/components/summary-cards"
import { DailyUsageChart } from "@/features/analytics/components/daily-usage-chart"

export default function UserAnalyticsPage() {
  const { data, isLoading, isError } = useUserAnalytics()

  return (
    <>
      <h1 className="text-2xl font-semibold text-[#171717]">Token Usage</h1>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Failed to load analytics data. Please try again later.
          </p>
        </div>
      )}

      <UserSummaryCards data={data} isLoading={isLoading} />
      <DailyUsageChart data={data} isLoading={isLoading} />
    </>
  )
}
