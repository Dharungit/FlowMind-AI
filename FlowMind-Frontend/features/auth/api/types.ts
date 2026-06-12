export interface GoogleAuthRequest {
  id_token: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface LogoutRequest {
  refresh_token?: string | null
  all?: boolean
}

export interface UserProfile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: UserProfile
}

export interface RefreshResponse {
  access_token: string
  refresh_token: string
}

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    error?: string
    user: UserProfile
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    error?: string
    user?: UserProfile
  }
}
