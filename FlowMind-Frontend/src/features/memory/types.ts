export interface Memory {
  id: string
  memory: string
  memory_type: string
  importance: number
  access_count: number
  last_accessed_at: string
  created_at: string
  updated_at: string
}

export interface MemoryUsage {
  count: number
  max: number
  percentage: number
}

export interface MemoryListResponse {
  memories: Memory[]
  usage: MemoryUsage
}
