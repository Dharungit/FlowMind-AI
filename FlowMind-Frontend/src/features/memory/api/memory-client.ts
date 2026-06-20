import { apiClient } from "@/features/auth/api/auth-client"
import type { MemoryListResponse, MemoryUsage } from "../types"

class MemoryApiClient {
  getUsage(): Promise<MemoryUsage> {
    return apiClient.get<MemoryUsage>("/v1/users/me/memory-usage")
  }

  list(): Promise<MemoryListResponse> {
    return apiClient.get<MemoryListResponse>("/v1/memories")
  }

  delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/memories/${id}`)
  }
}

export const memoryClient = new MemoryApiClient()
