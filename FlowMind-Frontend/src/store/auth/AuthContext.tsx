"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import type { AuthState } from "./authTypes"

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, isLoading, isAuthenticated } = useCurrentUser()

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
