import { create } from 'zustand';

export type SidebarTab = 'spaces' | 'history' | 'search';
export type SidebarMode = 'fixed' | 'floating';

interface NavigationUiState {
    activeSpaceId: string | null;
    sidebarTab: SidebarTab;
    sidebarMode: SidebarMode;
    isSidebarOpen: boolean;

    setActiveSpace: (spaceId: string | null) => void;
    setSidebarTab: (tab: SidebarTab) => void;
    setSidebarMode: (mode: SidebarMode) => void;
    toggleSidebar: () => void;
}

export const useNavigationUiStore = create<NavigationUiState>((set) => ({
    activeSpaceId: null,
    sidebarTab: 'spaces',
    sidebarMode: 'fixed',
    isSidebarOpen: true,

    setActiveSpace: (spaceId) => set({ activeSpaceId: spaceId }),
    setSidebarTab: (tab) => set({ sidebarTab: tab }),
    setSidebarMode: (mode) => set({ sidebarMode: mode }),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
