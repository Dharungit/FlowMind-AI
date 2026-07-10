"use client"

import { useAdminAnalytics } from "@/features/analytics/hooks/use-analytics"
import { AdminSummaryCard } from "@/features/analytics/components/summary-cards"
import { FeatureBreakdownChart } from "@/features/analytics/components/feature-breakdown-chart"
import { CacheBreakdownChart } from "@/features/analytics/components/cache-breakdown-chart"
import { PeakHoursChart } from "@/features/analytics/components/peak-hours-chart"
import {
  UsagePerUserTable,
  CostPerUserTable,
} from "@/features/analytics/components/admin-tables"

export function AdminAnalyticsContent() {
  const { data, isLoading, isError } = useAdminAnalytics()

  return (
    <>
      <h1 className="text-2xl font-semibold text-[#171717]">
        Platform Analytics
      </h1>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Failed to load analytics data. Please try again later.
          </p>
        </div>
      )}

      <div className="max-w-md">
        <AdminSummaryCard data={data} isLoading={isLoading} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium text-[#171717]">
          Usage Per User
        </h2>
        <UsagePerUserTable data={data} isLoading={isLoading} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-[#171717]">
          Cost Per User
        </h2>
        <CostPerUserTable data={data} isLoading={isLoading} />
      </section>

      <FeatureBreakdownChart data={data} isLoading={isLoading} />
      <CacheBreakdownChart data={data} isLoading={isLoading} />
      <PeakHoursChart data={data} isLoading={isLoading} />
    </>
  )
}
