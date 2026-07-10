import type { AppState, AppAction } from "./appTypes"

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_THEME":
      return { ...state, theme: action.theme }
    default:
      return state
  }
}
