/**
 * Type declarations for Electron API exposed via preload script
 */

/**
 * View bounds specification for positioning WebContentsView
 */
interface ViewBounds {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/**
 * Options for creating a new browser view
 */
interface CreateViewOptions {
    readonly url?: string;
    readonly userAgent?: string;
    readonly partition?: string;
}

/**
 * Browser event types for IPC
 */
interface BrowserLoadingEvent {
    viewId: string;
    isLoading: boolean;
}

interface BrowserNavigatedEvent {
    viewId: string;
    url: string;
    canGoBack: boolean;
    canGoForward: boolean;
    isSecure: boolean;
}

interface BrowserTitleEvent {
    viewId: string;
    title: string;
}

interface BrowserFaviconEvent {
    viewId: string;
    faviconUrl: string | null;
}

interface BrowserProgressEvent {
    viewId: string;
    progress: number;
}

interface BrowserErrorEvent {
    viewId: string;
    errorCode: number;
    errorDescription: string;
    failedUrl: string;
}

/**
 * Browser API exposed to renderer via contextBridge
 */
interface BrowserAPI {
    // View management
    createView: (id: string, options?: CreateViewOptions) => Promise<{ success: boolean; viewId?: string; error?: string }>;
    destroyView: (id: string) => Promise<{ success: boolean; error?: string }>;
    setActiveView: (id: string) => Promise<{ success: boolean; error?: string }>;
    getActiveViewId: () => Promise<{ success: boolean; viewId: string | null }>;

    // Bounds
    setBounds: (bounds: ViewBounds) => Promise<{ success: boolean; error?: string }>;

    // Navigation
    loadURL: (id: string, url: string) => Promise<{ success: boolean; error?: string }>;
    goBack: (id: string) => Promise<{ success: boolean; error?: string }>;
    goForward: (id: string) => Promise<{ success: boolean; error?: string }>;
    reload: (id: string) => Promise<{ success: boolean; error?: string }>;
    stop: (id: string) => Promise<{ success: boolean; error?: string }>;

    // State
    getViewState: (id: string) => Promise<{ success: boolean; state?: any; error?: string }>;
    setVisibility: (id: string, visible: boolean) => Promise<{ success: boolean; error?: string }>;
    getViewCount: () => Promise<{ success: boolean; count?: number }>;

    // Event listeners (return unsubscribe function)
    onLoading: (callback: (data: BrowserLoadingEvent) => void) => () => void;
    onNavigated: (callback: (data: BrowserNavigatedEvent) => void) => () => void;
    onTitle: (callback: (data: BrowserTitleEvent) => void) => () => void;
    onFavicon: (callback: (data: BrowserFaviconEvent) => void) => () => void;
    onProgress: (callback: (data: BrowserProgressEvent) => void) => () => void;
    onError: (callback: (data: BrowserErrorEvent) => void) => () => void;
}

interface ElectronAPI {
    spaces: {
        getAll: (profileId: string) => Promise<any>;
        create: (input: { profileId: string; userId: string; name: string; iconName: string; accentColor: string }) => Promise<any>;
        delete: (spaceId: string, profileId: string) => Promise<any>;
        rename: (spaceId: string, newName: string) => Promise<any>;
        update: (spaceId: string, updates: { name?: string; iconName?: string; accentColor?: string; isExpanded?: boolean }) => Promise<any>;
        reorder: (profileId: string, spaceIds: string[]) => Promise<any>;
    };
    items: {
        getBySpace: (spaceId: string) => Promise<any>;
        create: (input: { spaceId: string; name: string; type: string; path: string; parentId?: string }) => Promise<any>;
        delete: (itemId: string) => Promise<any>;
        move: (itemId: string, targetSpaceId: string, targetParentId?: string, toPosition?: number) => Promise<any>;
        rename: (itemId: string, newName: string) => Promise<any>;
    };
    search: {
        items: (query: string) => Promise<any>;
        recent: (limit?: number) => Promise<any>;
        mostVisited: (limit?: number) => Promise<any>;
    };
    app: {
        getVersion: () => Promise<string>;
        getPlatform: () => Promise<string>;
    };
    clipboard: {
        readText: () => Promise<string>;
        writeText: (text: string) => Promise<boolean>;
    };
    on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
    // Browser API (Spec 019)
    browser: BrowserAPI;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };
