import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  selectedPlatform: 'ALL' | 'CODEFORCES' | 'LEETCODE' | 'CODECHEF';
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setSelectedPlatform: (platform: 'ALL' | 'CODEFORCES' | 'LEETCODE' | 'CODECHEF') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      selectedPlatform: 'CODEFORCES',
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      toggleMobileSidebar: () =>
        set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
    }),
    {
      name: 'arc-ui',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, selectedPlatform: state.selectedPlatform }),
    },
  ),
);
