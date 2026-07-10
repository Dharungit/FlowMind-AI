"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { UIState, UIAction } from "../ui/uiReducer"
import { initialUIState, uiReducer } from "../ui/uiReducer"

const UIContext = createContext<{
  state: UIState
  dispatch: React.Dispatch<UIAction>
} | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialUIState)

  return (
    <UIContext.Provider value={{ state, dispatch }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) {
    throw new Error("useUI must be used within a UIProvider")
  }
  return ctx
}
