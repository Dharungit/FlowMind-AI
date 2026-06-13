export type Theme = "light" | "dark" | "system"

export interface AppConfig {
  apiBaseUrl: string
}

export interface AppState {
  theme: Theme
  config: AppConfig
}

export type AppAction =
  | { type: "SET_THEME"; theme: Theme }

export const initialAppState: AppState = {
  theme: "system",
  config: {
    apiBaseUrl: "",
  },
}
