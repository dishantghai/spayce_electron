import { create } from 'zustand';
import type { InlineInputState } from '../types';

type RenameContext = 'sidebar' | 'card';

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

    getRenameState: (context: RenameContext) => string | null;
    isRenaming: (itemId: string, context: RenameContext) => boolean;
    clearAllRenames: () => void;
}

export const useInlineInputStore = create<InlineInputStore>((set, get) => ({
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

    getRenameState: (context) => {
        const state = get();
        return context === 'sidebar' ? state.sidebarRenameItemId : state.cardRenameItemId;
    },

    isRenaming: (itemId, context) => {
        const state = get();
        const renameId = context === 'sidebar' ? state.sidebarRenameItemId : state.cardRenameItemId;
        return renameId === itemId;
    },

    clearAllRenames: () => set({
        sidebarRenameItemId: null,
        cardRenameItemId: null,
    }),
}));
