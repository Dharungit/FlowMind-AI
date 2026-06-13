import type { UserProfile } from "@/features/auth/api/types"

export interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
}
