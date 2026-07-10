export interface MemoryState {
  count: number
  max: number
  percentage: number
}

export type MemoryAction =
  | { type: "SET_MEMORY_USAGE"; payload: MemoryState }
  | { type: "RESET_MEMORY_USAGE" }

export const initialMemoryState: MemoryState = {
  count: 0,
  max: 100,
  percentage: 0,
}
