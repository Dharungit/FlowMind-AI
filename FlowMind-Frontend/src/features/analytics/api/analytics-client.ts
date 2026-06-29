import { apiClient } from "@/features/auth/api/auth-client"

export interface UserAnalyticsResponse {
  total_usage: {
    total_tokens: number
    input_tokens: number
    output_tokens: number
  }
  daily_usage: {
    date: string
    total_tokens: number
  }[]
}

export interface AdminAnalyticsResponse {
  platform_usage: {
    total_tokens: number
  }
  usage_per_user: {
    user_id: string
    user_name?: string
    total_tokens: number
  }[]
  cost_per_user: {
    user_id: string
    user_name?: string
    cost: number
  }[]
  feature_breakdown: {
    feature: string
    total_tokens: number
  }[]
  cache_breakdown: {
    cached_tokens: number
    non_cached_tokens: number
  }
  peak_usage_hours: {
    hour: number
    total_tokens: number
  }[]
}

export const analyticsClient = {
  getUserAnalytics(): Promise<UserAnalyticsResponse> {
    return apiClient.get<UserAnalyticsResponse>("/v1/analytics/user")
  },

  getAdminAnalytics(): Promise<AdminAnalyticsResponse> {
    return apiClient.get<AdminAnalyticsResponse>("/v1/analytics/admin")
  },
}
