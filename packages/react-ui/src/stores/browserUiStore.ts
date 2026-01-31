import { create } from 'zustand';

/**
 * Helper to get the browser API, throws if not available
 * In Electron renderer context, this should always be available
 */
function getBrowserAPI() {
    const api = window.electronAPI?.browser;
    if (!api) {
        throw new Error('Browser API not available. Make sure you are running in Electron renderer context.');
    }
    return api;
}

/**
 * Browser view state for UI
 * Spec 019: Single Tab Browser MVP
 */
export interface BrowserViewUiState {
    id: string;
    url: string;
    title: string;
    faviconUrl: string | null;
    isLoading: boolean;
    loadingProgress: number;
    canGoBack: boolean;
    canGoForward: boolean;
    isSecure: boolean;
    errorCode: number | null;
    errorDescription: string | null;
}

/**
 * Browser UI store state
 */
interface BrowserUiState {
    // State
    activeViewId: string | null;
    views: Map<string, BrowserViewUiState>;
    isInitialized: boolean;
    initError: string | null;

    // Actions
    initialize: () => Promise<void>;
    createView: (url?: string) => Promise<string | null>;
    destroyView: (id: string) => Promise<void>;
    setActiveView: (id: string) => Promise<void>;
    loadURL: (url: string) => Promise<void>;
    goBack: () => Promise<void>;
    goForward: () => Promise<void>;
    reload: () => Promise<void>;
    stop: () => Promise<void>;
    updateBounds: (bounds: { x: number; y: number; width: number; height: number }) => void;
    setVisibility: (visible: boolean) => void;

    // State updates (called from IPC events)
    handleLoadingEvent: (viewId: string, isLoading: boolean) => void;
    handleNavigatedEvent: (viewId: string, url: string, canGoBack: boolean, canGoForward: boolean, isSecure: boolean) => void;
    handleTitleEvent: (viewId: string, title: string) => void;
    handleFaviconEvent: (viewId: string, faviconUrl: string | null) => void;
    handleProgressEvent: (viewId: string, progress: number) => void;
    handleErrorEvent: (viewId: string, errorCode: number, errorDescription: string) => void;
    clearError: (viewId: string) => void;
}

/**
 * Create default view state
 */
function createDefaultViewState(id: string, url: string = 'https://www.google.com'): BrowserViewUiState {
    return {
        id,
        url,
        title: 'New Tab',
        faviconUrl: null,
        isLoading: true,
        loadingProgress: 0,
        canGoBack: false,
        canGoForward: false,
        isSecure: url.startsWith('https://'),
        errorCode: null,
        errorDescription: null,
    };
}

export const useBrowserUiStore = create<BrowserUiState>((set, get) => ({
    // Initial state
    activeViewId: null,
    views: new Map(),
    isInitialized: false,
    initError: null,

    // Actions
    initialize: async () => {
        // Check if already initialized
        if (get().isInitialized) return;

        try {
            // Create initial view
            const id = crypto.randomUUID();
            const url = 'https://www.google.com';

            const result = await getBrowserAPI().createView(id, { url });

            if (!result.success) {
                set({ initError: result.error ?? 'Failed to create initial browser view', isInitialized: true });
                return;
            }

            // Set as active view
            await getBrowserAPI().setActiveView(id);

            // Update state
            const views = new Map(get().views);
            views.set(id, createDefaultViewState(id, url));

            set({
                activeViewId: id,
                views,
                isInitialized: true,
                initError: null,
            });

            console.log('[BrowserUiStore] Initialized with view:', id);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            set({ initError: message, isInitialized: true });
            console.error('[BrowserUiStore] Initialization error:', message);
        }
    },

    createView: async (url = 'https://www.google.com') => {
        try {
            const id = crypto.randomUUID();
            const result = await getBrowserAPI().createView(id, { url });

            if (!result.success) {
                console.error('[BrowserUiStore] Failed to create view:', result.error);
                return null;
            }

            // Set as active
            await getBrowserAPI().setActiveView(id);

            // Update state
            const views = new Map(get().views);
            views.set(id, createDefaultViewState(id, url));

            set({ activeViewId: id, views });

            console.log('[BrowserUiStore] Created view:', id);
            return id;
        } catch (error) {
            console.error('[BrowserUiStore] Create view error:', error);
            return null;
        }
    },

    destroyView: async (id: string) => {
        try {
            await getBrowserAPI().destroyView(id);

            const views = new Map(get().views);
            views.delete(id);

            const newActiveId = get().activeViewId === id
                ? (views.size > 0 ? views.keys().next().value : null)
                : get().activeViewId;

            set({ views, activeViewId: newActiveId });

            console.log('[BrowserUiStore] Destroyed view:', id);
        } catch (error) {
            console.error('[BrowserUiStore] Destroy view error:', error);
        }
    },

    setActiveView: async (id: string) => {
        try {
            const result = await getBrowserAPI().setActiveView(id);
            if (result.success) {
                set({ activeViewId: id });
            }
        } catch (error) {
            console.error('[BrowserUiStore] Set active view error:', error);
        }
    },

    loadURL: async (url: string) => {
        const activeViewId = get().activeViewId;
        if (!activeViewId) {
            console.warn('[BrowserUiStore] No active view to load URL');
            return;
        }

        try {
            // Clear any existing error
            get().clearError(activeViewId);

            const result = await getBrowserAPI().loadURL(activeViewId, url);
            if (!result.success) {
                console.error('[BrowserUiStore] Load URL failed:', result.error);
            }
        } catch (error) {
            console.error('[BrowserUiStore] Load URL error:', error);
        }
    },

    goBack: async () => {
        const activeViewId = get().activeViewId;
        if (!activeViewId) return;

        try {
            await getBrowserAPI().goBack(activeViewId);
        } catch (error) {
            console.error('[BrowserUiStore] Go back error:', error);
        }
    },

    goForward: async () => {
        const activeViewId = get().activeViewId;
        if (!activeViewId) return;

        try {
            await getBrowserAPI().goForward(activeViewId);
        } catch (error) {
            console.error('[BrowserUiStore] Go forward error:', error);
        }
    },

    reload: async () => {
        const activeViewId = get().activeViewId;
        if (!activeViewId) return;

        try {
            get().clearError(activeViewId);
            await getBrowserAPI().reload(activeViewId);
        } catch (error) {
            console.error('[BrowserUiStore] Reload error:', error);
        }
    },

    stop: async () => {
        const activeViewId = get().activeViewId;
        if (!activeViewId) return;

        try {
            await getBrowserAPI().stop(activeViewId);
        } catch (error) {
            console.error('[BrowserUiStore] Stop error:', error);
        }
    },

    updateBounds: (bounds) => {
        // Fire and forget - no need to await
        getBrowserAPI().setBounds(bounds).catch((error) => {
            console.error('[BrowserUiStore] Set bounds error:', error);
        });
    },

    setVisibility: (visible) => {
        const activeViewId = get().activeViewId;
        if (!activeViewId) return;

        // Fire and forget - no need to await
        getBrowserAPI().setVisibility(activeViewId, visible).catch((error) => {
            console.error('[BrowserUiStore] Set visibility error:', error);
        });
    },

    // Event handlers
    handleLoadingEvent: (viewId, isLoading) => {
        const views = new Map(get().views);
        const view = views.get(viewId);
        if (view) {
            views.set(viewId, {
                ...view,
                isLoading,
                loadingProgress: isLoading ? view.loadingProgress : 1,
            });
            set({ views });
        }
    },

    handleNavigatedEvent: (viewId, url, canGoBack, canGoForward, isSecure) => {
        const views = new Map(get().views);
        const view = views.get(viewId);
        if (view) {
            views.set(viewId, {
                ...view,
                url,
                canGoBack,
                canGoForward,
                isSecure,
                // Clear error on successful navigation
                errorCode: null,
                errorDescription: null,
            });
            set({ views });
        }
    },

    handleTitleEvent: (viewId, title) => {
        const views = new Map(get().views);
        const view = views.get(viewId);
        if (view) {
            views.set(viewId, { ...view, title });
            set({ views });
        }
    },

    handleFaviconEvent: (viewId, faviconUrl) => {
        const views = new Map(get().views);
        const view = views.get(viewId);
        if (view) {
            views.set(viewId, { ...view, faviconUrl });
            set({ views });
        }
    },

    handleProgressEvent: (viewId, progress) => {
        const views = new Map(get().views);
        const view = views.get(viewId);
        if (view) {
            views.set(viewId, { ...view, loadingProgress: progress });
            set({ views });
        }
    },

    handleErrorEvent: (viewId, errorCode, errorDescription) => {
        const views = new Map(get().views);
        const view = views.get(viewId);
        if (view) {
            views.set(viewId, {
                ...view,
                errorCode,
                errorDescription,
                isLoading: false,
            });
            set({ views });
        }
    },

    clearError: (viewId) => {
        const views = new Map(get().views);
        const view = views.get(viewId);
        if (view) {
            views.set(viewId, {
                ...view,
                errorCode: null,
                errorDescription: null,
            });
            set({ views });
        }
    },
}));

/**
 * Initialize IPC event subscriptions
 * Call this once when the app mounts
 */
export function initializeBrowserEventSubscriptions(): () => void {
    const unsubscribers: (() => void)[] = [];

    // Loading events
    unsubscribers.push(
        getBrowserAPI().onLoading(({ viewId, isLoading }) => {
            useBrowserUiStore.getState().handleLoadingEvent(viewId, isLoading);
        })
    );

    // Navigation events
    unsubscribers.push(
        getBrowserAPI().onNavigated(({ viewId, url, canGoBack, canGoForward, isSecure }) => {
            useBrowserUiStore.getState().handleNavigatedEvent(viewId, url, canGoBack, canGoForward, isSecure);
        })
    );

    // Title events
    unsubscribers.push(
        getBrowserAPI().onTitle(({ viewId, title }) => {
            useBrowserUiStore.getState().handleTitleEvent(viewId, title);
        })
    );

    // Favicon events
    unsubscribers.push(
        getBrowserAPI().onFavicon(({ viewId, faviconUrl }) => {
            useBrowserUiStore.getState().handleFaviconEvent(viewId, faviconUrl);
        })
    );

    // Progress events
    unsubscribers.push(
        getBrowserAPI().onProgress(({ viewId, progress }) => {
            useBrowserUiStore.getState().handleProgressEvent(viewId, progress);
        })
    );

    // Error events
    unsubscribers.push(
        getBrowserAPI().onError(({ viewId, errorCode, errorDescription }) => {
            useBrowserUiStore.getState().handleErrorEvent(viewId, errorCode, errorDescription);
        })
    );

    console.log('[BrowserUiStore] Event subscriptions initialized');

    // Return cleanup function
    return () => {
        unsubscribers.forEach((unsub) => unsub());
        console.log('[BrowserUiStore] Event subscriptions cleaned up');
    };
}
