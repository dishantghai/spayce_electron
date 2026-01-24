import { create } from 'zustand';
import type { InlineInputState } from '../types';

interface InlineInputStore {
    sidebarInput: InlineInputState | null;
    setSidebarInput: (state: InlineInputState | null) => void;
    clearSidebarInput: () => void;

    cardInput: InlineInputState | null;
    setCardInput: (state: InlineInputState | null) => void;
    clearCardInput: () => void;

    sidebarRenameItemId: string | null;
    setSidebarRenameItemId: (id: string | null) => void;

    cardRenameItemId: string | null;
    setCardRenameItemId: (id: string | null) => void;
}

export const useInlineInputStore = create<InlineInputStore>((set) => ({
    sidebarInput: null,
    setSidebarInput: (state) => set({ sidebarInput: state }),
    clearSidebarInput: () => set({ sidebarInput: null }),

    cardInput: null,
    setCardInput: (state) => set({ cardInput: state }),
    clearCardInput: () => set({ cardInput: null }),

    sidebarRenameItemId: null,
    setSidebarRenameItemId: (id) => set({ sidebarRenameItemId: id }),

    cardRenameItemId: null,
    setCardRenameItemId: (id) => set({ cardRenameItemId: id }),
}));
