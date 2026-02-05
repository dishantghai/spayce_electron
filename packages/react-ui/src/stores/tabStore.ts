/**
 * Tab Store
 * Story F038: Tab State Management
 *
 * Zustand store for multi-tab state in the renderer process.
 * Manages tab list, active tab, and metadata with IPC synchronization.
 *
 * Responsibilities:
 * - Tab list state (which tabs exist, their order)
 * - Active tab tracking
 * - Optimistic updates with rollback on IPC failure
 *
 * Works alongside browserUiStore which manages view-level state
 * (loading progress, navigation, errors for the active WebContentsView).
 */

import { create } from 'zustand';

/** Tab data as stored in the renderer */
export interface TabData {
    id: string;
    url: string;
    title: string;
    faviconUrl: string | null;
    isActive: boolean;
    isLoading: boolean;
    loadingProgress: number;
    position: number;
    tabType: string;
    originSpaceId: string | null;
    originSpaceItemId: string | null;
    isTracked: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
    isSecure: boolean;
}

/** Input for creating a new tab */
export interface CreateTabInput {
    url?: string;
    title?: string;
    originSpaceId?: string;
    originSpaceItemId?: string;
    faviconUrl?: string;
}

/** Partial update from IPC events */
export interface TabEventUpdate {
    url?: string;
    title?: string;
    faviconUrl?: string | null;
    isLoading?: boolean;
    loadingProgress?: number;
    canGoBack?: boolean;
    canGoForward?: boolean;
    isSecure?: boolean;
    errorCode?: number | null;
    errorDescription?: string | null;
}

interface TabStoreState {
    // State
    tabs: TabData[];
    activeTabId: string | null;
    isInitialized: boolean;
    initError: string | null;

    // Actions
    initialize: () => Promise<void>;
    createTab: (input?: CreateTabInput) => Promise<string | null>;
    closeTab: (tabId: string) => Promise<void>;
    switchTab: (tabId: string) => Promise<void>;
    reorderTabs: (orderedIds: string[]) => Promise<void>;
    updateTabFromEvent: (tabId: string, updates: TabEventUpdate) => void;
}

function getTabsAPI() {
    const api = (window as any).electronAPI?.tabs;
    if (!api) {
        throw new Error('Tabs API not available. Make sure you are running in Electron renderer context.');
    }
    return api;
}

/**
 * Module-level promise lock to prevent concurrent initialize() calls.
 * B021 fix: React strict mode double-mounts components, causing two
 * concurrent initialize() calls. Without this lock, both pass the
 * isInitialized guard before either completes, leading to duplicate tabs.
 */
let _initializePromise: Promise<void> | null = null;

/** Reset the initialize lock (for tests only) */
export function _resetInitializeForTesting(): void {
    _initializePromise = null;
}

/** Map a backend TabEntity to our lightweight TabData */
function mapTabEntity(entity: any): TabData {
    return {
        id: entity.id,
        url: entity.url,
        title: entity.title ?? 'New Tab',
        faviconUrl: entity.faviconUrl ?? null,
        isActive: Boolean(entity.isActive),
        isLoading: Boolean(entity.isLoading),
        loadingProgress: entity.loadingProgress ?? 0,
        position: entity.position ?? 0,
        tabType: entity.tabType ?? 'web',
        originSpaceId: entity.originSpaceId ?? null,
        originSpaceItemId: entity.originSpaceItemId ?? null,
        isTracked: Boolean(entity.isTracked),
        canGoBack: Boolean(entity.canGoBack),
        canGoForward: Boolean(entity.canGoForward),
        isSecure: Boolean(entity.isSecure),
    };
}

export const useTabStore = create<TabStoreState>((set, get) => ({
    // Initial state
    tabs: [],
    activeTabId: null,
    isInitialized: false,
    initError: null,

    initialize: async () => {
        if (get().isInitialized) return;

        // B021 fix: Share a single promise for concurrent callers
        if (_initializePromise) return _initializePromise;

        _initializePromise = (async () => {
            try {
                const result = await getTabsAPI().getAll();

                if (!result.success) {
                    set({
                        isInitialized: true,
                        initError: result.error?.message ?? 'Failed to load tabs',
                    });
                    return;
                }

                const tabs: TabData[] = (result.data ?? []).map(mapTabEntity);

                if (tabs.length === 0) {
                    // No tabs in DB - create a default tab (Flutter behavior: always at least 1 tab)
                    set({ isInitialized: true, initError: null });
                    await get().createTab({ url: 'https://www.google.com', title: 'New Tab' });
                    return;
                }

                const activeTab = tabs.find(t => t.isActive);

                set({
                    tabs,
                    activeTabId: activeTab?.id ?? null,
                    isInitialized: true,
                    initError: null,
                });
            } catch (error) {
                set({
                    isInitialized: true,
                    initError: error instanceof Error ? error.message : 'Unexpected error',
                });
            }
        })();

        return _initializePromise;
    },

    createTab: async (input?: CreateTabInput) => {
        try {
            const result = await getTabsAPI().create(input);

            if (!result.success || !result.data) {
                console.error('[TabStore] Failed to create tab:', result.error);
                return null;
            }

            const newTab = mapTabEntity(result.data);

            set((state) => {
                // B021 fix: If facade returned an existing tab (URL/SpaceItemId duplicate
                // detection), don't prepend a duplicate. Just activate it in place.
                const existingIndex = state.tabs.findIndex(t => t.id === newTab.id);
                if (existingIndex !== -1) {
                    return {
                        tabs: state.tabs.map(t => ({ ...t, isActive: t.id === newTab.id })),
                        activeTabId: newTab.id,
                    };
                }

                // New tab - prepend at position 0 (leftmost, matching Flutter behavior)
                return {
                    tabs: [
                        newTab,
                        ...state.tabs.map(t => ({ ...t, isActive: false })),
                    ],
                    activeTabId: newTab.isActive ? newTab.id : state.activeTabId,
                };
            });

            return newTab.id;
        } catch (error) {
            console.error('[TabStore] Create tab error:', error);
            return null;
        }
    },

    closeTab: async (tabId: string) => {
        const { tabs, activeTabId } = get();
        const tabIndex = tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;

        const closingTab = tabs[tabIndex];
        const wasActive = closingTab.isActive;

        // Optimistic: remove tab
        const remaining = tabs.filter(t => t.id !== tabId);
        let newActiveId = activeTabId;

        if (wasActive && remaining.length > 0) {
            // Activate adjacent tab
            const newIndex = Math.min(tabIndex, remaining.length - 1);
            newActiveId = remaining[newIndex].id;
            remaining[newIndex] = { ...remaining[newIndex], isActive: true };
        } else if (remaining.length === 0) {
            newActiveId = null;
        }

        set({ tabs: remaining, activeTabId: newActiveId });

        try {
            const result = await getTabsAPI().close(tabId);

            if (!result.success) {
                // Rollback
                console.error('[TabStore] Close tab failed, rolling back:', result.error);
                set({ tabs, activeTabId });
                return;
            }

            // If no tabs remain, create a default tab (never have 0 tabs)
            if (remaining.length === 0) {
                await get().createTab({ url: 'https://www.google.com', title: 'New Tab' });
            }
        } catch (error) {
            // Rollback
            console.error('[TabStore] Close tab error, rolling back:', error);
            set({ tabs, activeTabId });
        }
    },

    switchTab: async (tabId: string) => {
        const { tabs, activeTabId: previousActiveId } = get();
        if (previousActiveId === tabId) return;

        // Optimistic: switch active
        set({
            tabs: tabs.map(t => ({ ...t, isActive: t.id === tabId })),
            activeTabId: tabId,
        });

        try {
            const result = await getTabsAPI().switch(tabId);

            if (!result.success) {
                // Rollback
                console.error('[TabStore] Switch tab failed, rolling back:', result.error);
                set({
                    tabs: tabs.map(t => ({ ...t, isActive: t.id === previousActiveId })),
                    activeTabId: previousActiveId,
                });
            }
        } catch (error) {
            // Rollback
            console.error('[TabStore] Switch tab error, rolling back:', error);
            set({
                tabs: tabs.map(t => ({ ...t, isActive: t.id === previousActiveId })),
                activeTabId: previousActiveId,
            });
        }
    },

    reorderTabs: async (orderedIds: string[]) => {
        const { tabs: originalTabs } = get();

        // Optimistic: reorder
        const tabMap = new Map(originalTabs.map(t => [t.id, t]));
        const reordered = orderedIds
            .map((id, index) => {
                const tab = tabMap.get(id);
                return tab ? { ...tab, position: index } : null;
            })
            .filter((t): t is TabData => t !== null);

        set({ tabs: reordered });

        try {
            const result = await getTabsAPI().reorder(orderedIds);

            if (!result.success) {
                // Rollback
                console.error('[TabStore] Reorder failed, rolling back:', result.error);
                set({ tabs: originalTabs });
            }
        } catch (error) {
            // Rollback
            console.error('[TabStore] Reorder error, rolling back:', error);
            set({ tabs: originalTabs });
        }
    },

    updateTabFromEvent: (tabId: string, updates: TabEventUpdate) => {
        set((state) => {
            const index = state.tabs.findIndex(t => t.id === tabId);
            if (index === -1) return state;

            const updatedTabs = [...state.tabs];
            updatedTabs[index] = { ...updatedTabs[index], ...updates };
            return { tabs: updatedTabs };
        });
    },
}));
