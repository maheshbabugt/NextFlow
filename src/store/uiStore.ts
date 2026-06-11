/**
 * store/uiStore.ts
 * Global UI state — sidebar open/close, active nav item
 * Persisted to localStorage so it survives page refresh
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  /** Whether the left sidebar is expanded (true) or collapsed to icons (false) */
  sidebarExpanded: boolean;
  /** Currently active nav item key */
  activeItem: string;

  toggleSidebar: () => void;
  setSidebarExpanded: (open: boolean) => void;
  setActiveItem: (item: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarExpanded: true,
      activeItem: "home",

      toggleSidebar: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

      setSidebarExpanded: (open) => set({ sidebarExpanded: open }),

      setActiveItem: (item) => set({ activeItem: item }),
    }),
    {
      name: "nextflow-ui-state", // localStorage key
    },
  ),
);
