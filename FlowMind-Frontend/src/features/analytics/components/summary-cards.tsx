"use client"

import { useEffect, useRef, useState } from "react"
import { SummaryCard } from "@/components/shared/Card"
import { SkeletonCard } from "@/components/shared/Skeleton"
import { formatTokens } from "@/lib/format"
import type { UserAnalyticsResponse } from "../api/analytics-client"
import type { AdminAnalyticsResponse } from "../api/analytics-client"

function useCountUp(end: number, duration = 1000) {
  const [display, setDisplay] = useState(formatTokens(end))
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    if (prefersReduced) {
      setDisplay(formatTokens(end))
      return
    }

    const startTime = performance.now()
    const startValue = 0

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (end - startValue) * eased)
      setDisplay(formatTokens(current))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }

    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [end, duration])

  return display
}

function AnimatedNumber({ value }: { value: number }) {
  const display = useCountUp(value)
  return <>{display}</>
}

interface UserSummaryCardsProps {
  data: UserAnalyticsResponse | undefined
  isLoading: boolean
}

export function UserSummaryCards({ data, isLoading }: UserSummaryCardsProps) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <SummaryCard
        label="Total Tokens"
        value={<AnimatedNumber value={data.total_usage.total_tokens} />}
      />
      <SummaryCard
        label="Input Tokens"
        value={<AnimatedNumber value={data.total_usage.input_tokens} />}
      />
      <SummaryCard
        label="Output Tokens"
        value={<AnimatedNumber value={data.total_usage.output_tokens} />}
      />
    </div>
  )
}

interface AdminSummaryCardProps {
  data: AdminAnalyticsResponse | undefined
  isLoading: boolean
}

export function AdminSummaryCard({ data, isLoading }: AdminSummaryCardProps) {
  if (isLoading || !data) {
    return <SkeletonCard />
  }

  return (
    <SummaryCard
      label="Total Platform Tokens"
      value={<AnimatedNumber value={data.platform_usage.total_tokens} />}
    />
  )
}
