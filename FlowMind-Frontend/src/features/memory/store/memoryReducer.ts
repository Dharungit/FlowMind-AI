import type { MemoryState, MemoryAction } from "./memoryTypes"
import { initialMemoryState } from "./memoryTypes"

export function memoryReducer(state: MemoryState, action: MemoryAction): MemoryState {
  switch (action.type) {
    case "SET_MEMORY_USAGE":
      return { ...action.payload }
    case "RESET_MEMORY_USAGE":
      return { ...initialMemoryState }
    default:
      return state
  }
}
