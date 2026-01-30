/**
 * View bounds for positioning
 */
export interface ViewBounds {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/**
 * Browser view state
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
 * Options for creating a view
 */
export interface CreateViewOptions {
    readonly url?: string;
    readonly userAgent?: string;
    readonly partition?: string;
}

/**
 * IPC response wrapper
 */
export interface BrowserIPCResponse<T = void> {
    readonly success: boolean;
    readonly error?: string;
    readonly data?: T;
}

/**
 * Loading event payload
 */
export interface BrowserLoadingEvent {
    readonly viewId: string;
    readonly isLoading: boolean;
}

/**
 * Navigation event payload
 */
export interface BrowserNavigatedEvent {
    readonly viewId: string;
    readonly url: string;
    readonly canGoBack: boolean;
    readonly canGoForward: boolean;
    readonly isSecure: boolean;
}

/**
 * Title event payload
 */
export interface BrowserTitleEvent {
    readonly viewId: string;
    readonly title: string;
}

/**
 * Favicon event payload
 */
export interface BrowserFaviconEvent {
    readonly viewId: string;
    readonly faviconUrl: string | null;
}

/**
 * Progress event payload
 */
export interface BrowserProgressEvent {
    readonly viewId: string;
    readonly progress: number;
}

/**
 * Error event payload
 */
export interface BrowserErrorEvent {
    readonly viewId: string;
    readonly errorCode: number;
    readonly errorDescription: string;
    readonly failedUrl: string;
}
