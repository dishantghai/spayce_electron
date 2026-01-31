/**
 * Browser API Types for Preload
 * Spec 019: Single Tab Browser MVP
 */

/**
 * View bounds specification for positioning WebContentsView
 */
export interface ViewBounds {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/**
 * Options for creating a new browser view
 */
export interface CreateViewOptions {
    readonly url?: string;
    readonly userAgent?: string;
    readonly partition?: string;
}

/**
 * Current state of a browser view for UI synchronization
 */
export interface BrowserViewState {
    readonly id: string;
    readonly url: string;
    readonly title: string;
    readonly isLoading: boolean;
    readonly loadingProgress: number;
    readonly canGoBack: boolean;
    readonly canGoForward: boolean;
    readonly isSecure: boolean;
    readonly errorCode: number | null;
    readonly errorDescription: string | null;
}

/**
 * Browser loading event payload
 */
export interface BrowserLoadingEvent {
    viewId: string;
    isLoading: boolean;
}

/**
 * Browser navigated event payload
 */
export interface BrowserNavigatedEvent {
    viewId: string;
    url: string;
    canGoBack: boolean;
    canGoForward: boolean;
    isSecure: boolean;
}

/**
 * Browser title changed event payload
 */
export interface BrowserTitleEvent {
    viewId: string;
    title: string;
}

/**
 * Browser favicon changed event payload
 */
export interface BrowserFaviconEvent {
    viewId: string;
    faviconUrl: string | null;
}

/**
 * Browser loading progress event payload
 */
export interface BrowserProgressEvent {
    viewId: string;
    progress: number;
}

/**
 * Browser error event payload
 */
export interface BrowserErrorEvent {
    viewId: string;
    errorCode: number;
    errorDescription: string;
    failedUrl: string;
}

/**
 * Generic IPC response type
 */
export interface IpcResponse<T = void> {
    success: boolean;
    error?: string;
    data?: T;
}

/**
 * Browser API exposed to renderer via contextBridge
 */
export interface BrowserAPI {
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
    getViewState: (id: string) => Promise<{ success: boolean; state?: BrowserViewState; error?: string }>;
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
