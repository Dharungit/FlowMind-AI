"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { Card } from "@/components/shared/Card"
import { SkeletonChart } from "@/components/shared/Skeleton"
import { formatTokens } from "@/lib/format"
import type { UserAnalyticsResponse } from "../api/analytics-client"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
)

interface DailyUsageChartProps {
  data: UserAnalyticsResponse | undefined
  isLoading: boolean
}

export function DailyUsageChart({ data, isLoading }: DailyUsageChartProps) {
  if (isLoading || !data) {
    return <SkeletonChart />
  }

  if (!data.daily_usage || data.daily_usage.length === 0) {
    return (
      <Card>
        <p className="py-12 text-center text-sm text-[#64748b]">
          No usage data available yet
        </p>
      </Card>
    )
  }

  const chartData = {
    labels: data.daily_usage.map((d) => d.date),
    datasets: [
      {
        label: "Tokens",
        data: data.daily_usage.map((d) => d.total_tokens),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
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
          label: (ctx: Record<string, unknown>) =>
            ` ${formatTokens((ctx.parsed as Record<string, number>).y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        ticks: {
          callback: (v: string | number) =>
            formatTokens(typeof v === "string" ? parseInt(v) : v),
        },
      },
    },
  }

  return (
    <Card title="Daily Usage">
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  )
}
