"use client"

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Pie } from "react-chartjs-2"
import { Card } from "@/components/shared/Card"
import { SkeletonChart } from "@/components/shared/Skeleton"
import { formatTokens } from "@/lib/format"
import type { AdminAnalyticsResponse } from "../api/analytics-client"

ChartJS.register(ArcElement, Tooltip, Legend)

interface CacheBreakdownChartProps {
  data: AdminAnalyticsResponse | undefined
  isLoading: boolean
}

export function CacheBreakdownChart({
  data,
  isLoading,
}: CacheBreakdownChartProps) {
  if (isLoading || !data) {
    return <SkeletonChart />
  }

  if (!data.cache_breakdown) {
    return (
      <Card>
        <p className="py-12 text-center text-sm text-[#64748b]">
          No usage data available yet
        </p>
      </Card>
    )
  }

  const total =
    data.cache_breakdown.cached_tokens +
    data.cache_breakdown.non_cached_tokens

  const chartData = {
    labels: ["Cached Tokens", "Non-Cached Tokens"],
    datasets: [
      {
        data: [
          data.cache_breakdown.cached_tokens,
          data.cache_breakdown.non_cached_tokens,
        ],
        backgroundColor: ["#10b981", "#94a3b8"],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx: Record<string, unknown>) => {
            const val = ctx.parsed as number
            const pct =
              total > 0 ? ((val / total) * 100).toFixed(1) : "0"
            return ` ${ctx.label}: ${formatTokens(val)} (${pct}%)`
          },
        },
      },
    },
  }

  return (
    <Card title="Cached vs Non-Cached">
      <div className="h-64">
        <Pie data={chartData} options={options} />
      </div>
    </Card>
  )
}
