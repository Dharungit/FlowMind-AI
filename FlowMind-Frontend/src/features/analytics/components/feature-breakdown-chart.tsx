"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import { Card } from "@/components/shared/Card"
import { SkeletonChart } from "@/components/shared/Skeleton"
import { formatTokens } from "@/lib/format"
import type { AdminAnalyticsResponse } from "../api/analytics-client"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

interface FeatureBreakdownChartProps {
  data: AdminAnalyticsResponse | undefined
  isLoading: boolean
}

export function FeatureBreakdownChart({
  data,
  isLoading,
}: FeatureBreakdownChartProps) {
  if (isLoading || !data) {
    return <SkeletonChart />
  }

  if (
    !data.feature_breakdown ||
    data.feature_breakdown.length === 0
  ) {
    return (
      <Card>
        <p className="py-12 text-center text-sm text-[#64748b]">
          No usage data available yet
        </p>
      </Card>
    )
  }

  const sorted = [...data.feature_breakdown].sort(
    (a, b) => b.total_tokens - a.total_tokens,
  )

  const chartData = {
    labels: sorted.map((f) => f.feature),
    datasets: [
      {
        label: "Tokens",
        data: sorted.map((f) => f.total_tokens),
        backgroundColor: sorted.map(
          (_, i) =>
            `rgba(30, 64, 175, ${1 - i * 0.1})`,
        ),
        borderColor: "#1E40AF",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx: Record<string, unknown>) =>
            ` ${formatTokens((ctx.parsed as Record<string, number>).x)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (v: string | number) =>
            formatTokens(typeof v === "string" ? parseInt(v) : v),
        },
      },
      y: {
        grid: { display: false },
      },
    },
  }

  return (
    <Card title="Usage by Feature">
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  )
}
