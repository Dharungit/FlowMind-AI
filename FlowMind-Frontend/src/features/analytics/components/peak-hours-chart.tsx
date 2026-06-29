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

interface PeakHoursChartProps {
  data: AdminAnalyticsResponse | undefined
  isLoading: boolean
}

export function PeakHoursChart({ data, isLoading }: PeakHoursChartProps) {
  if (isLoading || !data) {
    return <SkeletonChart />
  }

  if (!data.peak_usage_hours || data.peak_usage_hours.length === 0) {
    return (
      <Card>
        <p className="py-12 text-center text-sm text-[#64748b]">
          No usage data available yet
        </p>
      </Card>
    )
  }

  const labels = Array.from({ length: 24 }, (_, i) => `${i}`)
  const values = labels.map((hour) => {
    const entry = data.peak_usage_hours.find((h) => h.hour === parseInt(hour))
    return entry?.total_tokens ?? 0
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: "Tokens",
        data: values,
        backgroundColor: "#3B82F6",
        borderColor: "#1E40AF",
        borderWidth: 1,
        borderRadius: 4,
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
        title: {
          display: true,
          text: "Hour",
        },
        grid: { display: false },
      },
      y: {
        title: {
          display: true,
          text: "Tokens",
        },
        ticks: {
          callback: (v: string | number) =>
            formatTokens(typeof v === "string" ? parseInt(v) : v),
        },
      },
    },
  }

  return (
    <Card title="Peak Usage Hours">
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  )
}
