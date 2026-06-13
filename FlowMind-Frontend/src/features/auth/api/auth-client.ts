import { getSession, signOut } from "next-auth/react"
import type { LogoutRequest, RefreshRequest } from "./types"

class AuthApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const session = await getSession()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`
    }

    let res = await fetch(url, { ...options, headers })

    if (res.status === 401 && session?.refreshToken) {
      const refreshed = await this.tryRefresh(session.refreshToken)

      if (refreshed) {
        const newSession = await getSession()
        if (newSession?.accessToken) {
          headers["Authorization"] = `Bearer ${newSession.accessToken}`
        }
        res = await fetch(url, { ...options, headers })
      } else {
        await signOut({ callbackUrl: "/login" })
        throw new ApiError(401, "Session expired")
      }
    }

    if (!res.ok) {
      const body = await res.text()
      throw new ApiError(res.status, body || res.statusText)
    }

    if (res.headers.get("content-length") === "0" || res.status === 204) {
      return undefined as T
    }

    return res.json()
  }

  private async tryRefresh(refreshToken: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken } satisfies RefreshRequest),
      })

      if (!res.ok) return false

      const data = await res.json()

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        }),
      })

      return true
    } catch {
      return false
    }
  }

  async stream(
    path: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`
    const session = await getSession()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`
    }

    const options: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    }

    let res = await fetch(url, options)

    if (res.status === 401 && session?.refreshToken) {
      const refreshed = await this.tryRefresh(session.refreshToken)

      if (refreshed) {
        const newSession = await getSession()
        if (newSession?.accessToken) {
          headers["Authorization"] = `Bearer ${newSession.accessToken}`
        }
        res = await fetch(url, { ...options, headers })
      } else {
        await signOut({ callbackUrl: "/login" })
        throw new ApiError(401, "Session expired")
      }
    }

    if (!res.ok) {
      const bodyText = await res.text()
      throw new ApiError(res.status, bodyText || res.statusText)
    }

    return res
  }

  get<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" })
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async logout(refreshToken?: string | null): Promise<void> {
    if (refreshToken) {
      try {
        await this.post("/v1/auth/logout", { refresh_token: refreshToken } satisfies LogoutRequest)
      } catch {
        console.warn("Logout API call failed")
      }
    }
    await signOut({ callbackUrl: "/login" })
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export const apiClient = new AuthApiClient(process.env.NEXT_PUBLIC_BACKEND_URL || "")
