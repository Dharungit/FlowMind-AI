import { getSession, signOut } from "next-auth/react"
import type { LogoutRequest, RefreshRequest } from "./types"

class AuthApiClient {
  private baseUrl: string
  private refreshPromise: Promise<boolean> | null = null

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

    let res: Response | null = null
    try {
      res = await fetch(url, { ...options, headers })
    } catch (err) {
      console.log("[AUTH DEBUG] request fetch threw", {
        path,
        error: String(err),
      })
    }

    if (res?.status === 401 || res === null) {
      if (session?.refreshToken) {
        console.log("[AUTH DEBUG] request got 401 or fetch failed", {
          path,
          status: res?.status,
          hasRefreshToken: !!session?.refreshToken,
        })
        const refreshed = await this.tryRefresh(session.refreshToken)

        console.log("[AUTH DEBUG] refresh attempt result", { refreshed })
        if (refreshed) {
          const newSession = await getSession()
          if (newSession?.accessToken) {
            headers["Authorization"] = `Bearer ${newSession.accessToken}`
          }
          try {
            res = await fetch(url, { ...options, headers })
          } catch {
            console.log("[AUTH DEBUG] request retry fetch also threw")
            throw new ApiError(401, "Request failed after refresh")
          }
        } else {
          await signOut({ callbackUrl: "/login" })
          throw new ApiError(401, "Session expired")
        }
      } else {
        throw new ApiError(401, "No refresh token available")
      }
    }

    if (!res || !res.ok) {
      const body = res ? await res.text() : "No response"
      throw new ApiError(res?.status ?? 0, body || res?.statusText || "Network error")
    }

    if (res.headers.get("content-length") === "0" || res.status === 204) {
      return undefined as T
    }

    return res.json()
  }

  private async tryRefresh(refreshToken: string): Promise<boolean> {
    console.log("[AUTH DEBUG] tryRefresh starting", {
      refreshTokenExists: !!refreshToken,
      refreshTokenPrefix: refreshToken?.substring(0, 10) + "...",
    })

    if (this.refreshPromise) {
      console.log("[AUTH DEBUG] tryRefresh - waiting for in-flight refresh")
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${this.baseUrl}/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refresh_token: refreshToken,
          } satisfies RefreshRequest),
        })

        console.log("[AUTH DEBUG] POST /v1/auth/refresh response", {
          ok: res.ok,
          status: res.status,
        })

        if (!res.ok) return false

        const data = await res.json()

        const csrfRes = await fetch("/api/auth/csrf")
        const { csrfToken } = await csrfRes.json()

        console.log("[AUTH DEBUG] CSRF token fetched", {
          csrfTokenExists: !!csrfToken,
        })

        const updateRes = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            csrfToken,
            data: {
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresAt: Date.now() + 2 * 60 * 1000,
            },
            json: true,
          }),
        })

        console.log("[AUTH DEBUG] POST /api/auth/session update response", {
          ok: updateRes.ok,
          status: updateRes.status,
        })

        console.log("[AUTH DEBUG] tryRefresh result", { success: updateRes.ok })

        return updateRes.ok
      } catch {
        console.log("[AUTH DEBUG] tryRefresh - error caught, returning false")
        return false
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
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

    let res: Response | null = null
    try {
      res = await fetch(url, options)
    } catch (err) {
      console.log("[AUTH DEBUG] stream fetch threw", {
        path,
        error: String(err),
      })
    }

    if (res?.status === 401 || res === null) {
      if (session?.refreshToken) {
        console.log("[AUTH DEBUG] stream got 401 or fetch failed", {
          path,
          status: res?.status,
          hasRefreshToken: !!session?.refreshToken,
        })
        const refreshed = await this.tryRefresh(session.refreshToken)

        console.log("[AUTH DEBUG] stream refresh attempt result", { refreshed })
        if (refreshed) {
          const newSession = await getSession()
          if (newSession?.accessToken) {
            headers["Authorization"] = `Bearer ${newSession.accessToken}`
          }
          try {
            res = await fetch(url, { ...options, headers })
          } catch {
            console.log("[AUTH DEBUG] stream retry fetch also threw")
            throw new ApiError(401, "Stream failed after refresh")
          }
        } else {
          await signOut({ callbackUrl: "/login" })
          throw new ApiError(401, "Session expired")
        }
      } else {
        throw new ApiError(401, "No refresh token available")
      }
    }

    if (!res || !res.ok) {
      const bodyText = res ? await res.text() : "No response"
      throw new ApiError(res?.status ?? 0, bodyText || res?.statusText || "Network error")
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

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" })
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
