function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue
}

export const env = {
  backendUrl: requireEnv("NEXT_PUBLIC_BACKEND_URL"),
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
} as const
