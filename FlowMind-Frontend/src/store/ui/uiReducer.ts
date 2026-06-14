export interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
}

export type UIAction =
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "CLOSE_SIDEBAR" }
  | { type: "OPEN_MODAL"; modal: string }
  | { type: "CLOSE_MODAL" };

export const initialUIState: UIState = {
  sidebarOpen: true,
  activeModal: null,
};

export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "CLOSE_SIDEBAR":
      return { ...state, sidebarOpen: false };
    case "OPEN_MODAL":
      return { ...state, activeModal: action.modal };
    case "CLOSE_MODAL":
      return { ...state, activeModal: null };
    default:
      return state;
  }
}
