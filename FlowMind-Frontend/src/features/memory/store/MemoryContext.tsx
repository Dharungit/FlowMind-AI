"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { MemoryState, MemoryAction } from "./memoryTypes"
import { initialMemoryState } from "./memoryTypes"
import { memoryReducer } from "./memoryReducer"

const MemoryContext = createContext<{
  state: MemoryState
  dispatch: React.Dispatch<MemoryAction>
} | null>(null)

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(memoryReducer, initialMemoryState)

  return (
    <MemoryContext.Provider value={{ state, dispatch }}>
      {children}
    </MemoryContext.Provider>
  )
}

export function useMemoryContext() {
  const ctx = useContext(MemoryContext)
  if (!ctx) {
    throw new Error("useMemoryContext must be used within a MemoryProvider")
  }
  return ctx
}
