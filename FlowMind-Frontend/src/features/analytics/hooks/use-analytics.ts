"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsClient } from "../api/analytics-client"
import type { UserAnalyticsResponse, AdminAnalyticsResponse } from "../api/analytics-client"

export function useUserAnalytics() {
  return useQuery<UserAnalyticsResponse>({
    queryKey: ["analytics", "user"],
    queryFn: () => analyticsClient.getUserAnalytics(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAdminAnalytics() {
  return useQuery<AdminAnalyticsResponse>({
    queryKey: ["analytics", "admin"],
    queryFn: () => analyticsClient.getAdminAnalytics(),
    staleTime: 5 * 60 * 1000,
  })
}
