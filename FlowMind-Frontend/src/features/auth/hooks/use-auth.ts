"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { signIn, useSession } from "next-auth/react"
import { apiClient } from "../api/auth-client"
import type { UserProfile } from "../api/types"

export function useCurrentUser() {
  const { data: session, status } = useSession()
  return {
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  }
}

export function useProfile() {
  const { isAuthenticated } = useCurrentUser()

  return useQuery<UserProfile>({
    queryKey: ["auth", "profile"],
    queryFn: () => apiClient.get<UserProfile>("/v1/auth/me"),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (callbackUrl?: string) => {
      await signIn("google", { callbackUrl, redirect: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const session = useSession()

  return useMutation({
    mutationFn: () => apiClient.logout(session.data?.refreshToken),
    onSettled: () => {
      queryClient.clear()
    },
  })
}
