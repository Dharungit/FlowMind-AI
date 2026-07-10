"use client"

import { Table } from "@/components/shared/Table"
import { SkeletonTable } from "@/components/shared/Skeleton"
import { formatTokens, formatCurrency } from "@/lib/format"
import type { AdminAnalyticsResponse } from "../api/analytics-client"

interface AdminTablesProps {
  data: AdminAnalyticsResponse | undefined
  isLoading: boolean
}

export function UsagePerUserTable({ data, isLoading }: AdminTablesProps) {
  if (isLoading || !data) {
    return <SkeletonTable rows={5} />
  }

  const sorted = [...data.usage_per_user].sort(
    (a, b) => b.total_tokens - a.total_tokens,
  )

  return (
    <Table
      columns={[
        {
          key: "user",
          header: "User",
          render: (item) =>
            item.user_name || item.user_id.slice(0, 8),
        },
        {
          key: "tokens",
          header: "Tokens",
          render: (item) => formatTokens(item.total_tokens),
          className: "text-right",
        },
      ]}
      data={sorted}
    />
  )
}

export function CostPerUserTable({ data, isLoading }: AdminTablesProps) {
  if (isLoading || !data) {
    return <SkeletonTable rows={5} />
  }

  const sorted = [...data.cost_per_user].sort(
    (a, b) => b.cost - a.cost,
  )

  return (
    <Table
      columns={[
        {
          key: "user",
          header: "User",
          render: (item) =>
            item.user_name || item.user_id.slice(0, 8),
        },
        {
          key: "cost",
          header: "Estimated Cost",
          render: (item) => formatCurrency(item.cost),
          className: "text-right",
        },
      ]}
      data={sorted}
    />
  )
}
