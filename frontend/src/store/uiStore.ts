import { create } from "zustand";

type ToastType = "success" | "error" | "info";

interface UiState {
  sidebarOpen: boolean;
  themeMode: "dark" | "light";
  toastMessage: string | null;
  toastType: ToastType;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarOpen: true,
  themeMode: "dark",
  toastMessage: null,
  toastType: "info",

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  
  toggleTheme: () => {
    const nextTheme = get().themeMode === "dark" ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ themeMode: nextTheme });
  },

  showToast: (message, type = "info") => {
    set({ toastMessage: message, toastType: type });
    // Auto hide after 4 seconds
    setTimeout(() => {
      // Avoid hiding a new toast message that was set in the meantime
      if (get().toastMessage === message) {
        get().hideToast();
      }
    }, 4000);
  },

  hideToast: () => set({ toastMessage: null })
}));
