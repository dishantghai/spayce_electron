import { BrowserWindow, WebContentsView } from 'electron';

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
 * Options for creating a new browser view
 */
export interface CreateViewOptions {
    readonly url?: string;
    readonly userAgent?: string;
    readonly partition?: string;
}

/**
 * Browser view event types for IPC forwarding
 */
export type BrowserEventType =
    | 'browser:loading'
    | 'browser:navigated'
    | 'browser:title'
    | 'browser:progress'
    | 'browser:error'
    | 'browser:favicon';

/**
 * Core browser service interface
 */
export interface IBrowserService {
    initialize(mainWindow: BrowserWindow): void;
    createView(id: string, options?: CreateViewOptions): string;
    getView(id: string): WebContentsView | undefined;
    destroyView(id: string): void;
    destroyAllViews(): void;
    setActiveView(id: string): boolean;
    getActiveViewId(): string | null;
    setBounds(bounds: ViewBounds): void;
    loadURL(id: string, url: string): Promise<void>;
    goBack(id: string): Promise<void>;
    goForward(id: string): Promise<void>;
    reload(id: string): Promise<void>;
    stop(id: string): void;
    getViewState(id: string): BrowserViewState | null;
    setViewVisibility(id: string, visible: boolean): void;
    getViewCount(): number;
}

export class BrowserService implements IBrowserService {
    private views: Map<string, WebContentsView> = new Map();
    private activeViewId: string | null = null;
    private mainWindow: BrowserWindow | null = null;
    private currentBounds: ViewBounds = { x: 0, y: 0, width: 800, height: 600 };
    private isInitialized = false;

    private readonly DEFAULT_USER_AGENT =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

    /**
     * Initialize the browser service with the main window
     * Must be called before any other methods
     */
    initialize(mainWindow: BrowserWindow): void {
        if (this.isInitialized) {
            console.warn('[BrowserService] Already initialized');
            return;
        }

        this.mainWindow = mainWindow;
        this.isInitialized = true;

        mainWindow.on('closed', () => {
            this.destroyAllViews();
            this.mainWindow = null;
            this.isInitialized = false;
        });

        console.log('[BrowserService] Initialized');
    }

    /**
     * Create a new WebContentsView with secure defaults
     */
    createView(id: string, options: CreateViewOptions = {}): string {
        this.ensureInitialized();

        if (this.views.has(id)) {
            console.warn(`[BrowserService] View ${id} already exists`);
            return id;
        }

        const view = new WebContentsView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
                preload: undefined,
                javascript: true,
                webSecurity: true,
                allowRunningInsecureContent: false,
                autoplayPolicy: 'user-gesture-required',
                partition: options.partition,
            },
        });

        view.webContents.setUserAgent(options.userAgent ?? this.DEFAULT_USER_AGENT);

        this.setupEventListeners(id, view);

        this.views.set(id, view);

        const initialUrl = options.url ?? 'https://www.google.com';
        this.loadURLInternal(view, initialUrl).catch((error) => {
            console.error(`[BrowserService] Failed to load initial URL: ${error.message}`);
        });

        console.log(`[BrowserService] Created view: ${id}`);
        return id;
    }

    /**
     * Get a view by ID
     */
    getView(id: string): WebContentsView | undefined {
        return this.views.get(id);
    }

    /**
     * Destroy a view and cleanup resources
     */
    destroyView(id: string): void {
        const view = this.views.get(id);
        if (!view) {
            console.warn(`[BrowserService] View ${id} not found for destruction`);
            return;
        }

        if (this.mainWindow && this.activeViewId === id) {
            try {
                this.mainWindow.contentView.removeChildView(view);
            } catch (error) {
                console.warn(`[BrowserService] Error removing view from window: ${error}`);
            }
        }

        view.webContents.removeAllListeners();

        if (!view.webContents.isDestroyed()) {
            view.webContents.close();
        }

        this.views.delete(id);

        if (this.activeViewId === id) {
            this.activeViewId = null;
        }

        console.log(`[BrowserService] Destroyed view: ${id}`);
    }

    /**
     * Destroy all views (cleanup on window close)
     */
    destroyAllViews(): void {
        const viewIds = Array.from(this.views.keys());
        for (const id of viewIds) {
            this.destroyView(id);
        }
        console.log('[BrowserService] Destroyed all views');
    }

    /**
     * Set the active view (shown in browser area)
     */
    setActiveView(id: string): boolean {
        this.ensureInitialized();

        const view = this.views.get(id);
        if (!view) {
            console.warn(`[BrowserService] View ${id} not found`);
            return false;
        }

        if (this.activeViewId && this.activeViewId !== id) {
            const currentView = this.views.get(this.activeViewId);
            if (currentView && this.mainWindow) {
                try {
                    this.mainWindow.contentView.removeChildView(currentView);
                } catch (error) {
                    console.warn(`[BrowserService] Error removing current view: ${error}`);
                }
            }
        }

        if (this.mainWindow) {
            try {
                this.mainWindow.contentView.addChildView(view);
                view.setBounds(this.currentBounds);
            } catch (error) {
                console.error(`[BrowserService] Error adding view to window: ${error}`);
                return false;
            }
        }

        this.activeViewId = id;
        console.log(`[BrowserService] Set active view: ${id}`);
        return true;
    }

    /**
     * Get the currently active view ID
     */
    getActiveViewId(): string | null {
        return this.activeViewId;
    }

    /**
     * Update bounds for the active view
     */
    setBounds(bounds: ViewBounds): void {
        if (bounds.width <= 0 || bounds.height <= 0) {
            console.warn('[BrowserService] Invalid bounds: width and height must be positive');
            return;
        }

        this.currentBounds = {
            x: Math.round(bounds.x),
            y: Math.round(bounds.y),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
        };

        if (this.activeViewId) {
            const view = this.views.get(this.activeViewId);
            if (view) {
                view.setBounds(this.currentBounds);
            }
        }
    }

    /**
     * Navigate to a URL with validation
     */
    async loadURL(id: string, url: string): Promise<void> {
        const view = this.views.get(id);
        if (!view) {
            throw new Error(`View ${id} not found`);
        }

        return this.loadURLInternal(view, url);
    }

    private async loadURLInternal(view: WebContentsView, url: string): Promise<void> {
        const normalizedUrl = this.validateAndNormalizeUrl(url);

        if (!normalizedUrl) {
            throw new Error(`Invalid URL: ${url}`);
        }

        try {
            await view.webContents.loadURL(normalizedUrl);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to load URL ${normalizedUrl}: ${message}`);
        }
    }

    /**
     * Validate and normalize a URL
     */
    private validateAndNormalizeUrl(url: string): string | null {
        if (!url || typeof url !== 'string') {
            return null;
        }

        let trimmed = url.trim();

        if (trimmed.length === 0) {
            return null;
        }

        const lowerUrl = trimmed.toLowerCase();
        if (
            lowerUrl.startsWith('javascript:') ||
            lowerUrl.startsWith('data:text/html') ||
            lowerUrl.startsWith('vbscript:')
        ) {
            console.warn(`[BrowserService] Blocked dangerous URL scheme: ${trimmed}`);
            return null;
        }

        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            if (trimmed.includes('.') && !trimmed.includes(' ')) {
                trimmed = `https://${trimmed}`;
            } else {
                trimmed = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
            }
        }

        try {
            new URL(trimmed);
            return trimmed;
        } catch {
            return null;
        }
    }

    /**
     * Navigate back in history
     */
    async goBack(id: string): Promise<void> {
        const view = this.views.get(id);
        if (!view) {
            throw new Error(`View ${id} not found`);
        }

        if (view.webContents.canGoBack()) {
            view.webContents.goBack();
        }
    }

    /**
     * Navigate forward in history
     */
    async goForward(id: string): Promise<void> {
        const view = this.views.get(id);
        if (!view) {
            throw new Error(`View ${id} not found`);
        }

        if (view.webContents.canGoForward()) {
            view.webContents.goForward();
        }
    }

    /**
     * Reload the current page
     */
    async reload(id: string): Promise<void> {
        const view = this.views.get(id);
        if (!view) {
            throw new Error(`View ${id} not found`);
        }

        view.webContents.reload();
    }

    /**
     * Stop loading the current page
     */
    stop(id: string): void {
        const view = this.views.get(id);
        if (!view) {
            console.warn(`[BrowserService] View ${id} not found for stop`);
            return;
        }

        view.webContents.stop();
    }

    /**
     * Get the current state of a view
     */
    getViewState(id: string): BrowserViewState | null {
        const view = this.views.get(id);
        if (!view) {
            return null;
        }

        const webContents = view.webContents;
        const url = webContents.getURL();

        return {
            id,
            url,
            title: webContents.getTitle() || 'New Tab',
            isLoading: webContents.isLoading(),
            loadingProgress: webContents.isLoading() ? 0.5 : 1,
            canGoBack: webContents.canGoBack(),
            canGoForward: webContents.canGoForward(),
            isSecure: url.startsWith('https://'),
            errorCode: null,
            errorDescription: null,
        };
    }

    /**
     * Set visibility of a view
     */
    setViewVisibility(id: string, visible: boolean): void {
        const view = this.views.get(id);
        if (!view) {
            console.warn(`[BrowserService] View ${id} not found for visibility change`);
            return;
        }

        view.setVisible(visible);
    }

    /**
     * Get the number of views
     */
    getViewCount(): number {
        return this.views.size;
    }

    /**
     * Ensure service is initialized
     */
    private ensureInitialized(): void {
        if (!this.isInitialized || !this.mainWindow) {
            throw new Error('BrowserService not initialized. Call initialize() first.');
        }
    }

    /**
     * Set up event listeners for a view
     */
    private setupEventListeners(id: string, view: WebContentsView): void {
        const webContents = view.webContents;

        webContents.on('did-start-loading', () => {
            this.sendToRenderer('browser:loading', {
                viewId: id,
                isLoading: true,
            });
        });

        webContents.on('did-stop-loading', () => {
            this.sendToRenderer('browser:loading', {
                viewId: id,
                isLoading: false,
            });
        });

        webContents.on('did-navigate', (_, url) => {
            this.sendToRenderer('browser:navigated', {
                viewId: id,
                url,
                canGoBack: webContents.canGoBack(),
                canGoForward: webContents.canGoForward(),
                isSecure: url.startsWith('https://'),
            });
        });

        webContents.on('did-navigate-in-page', (_, url) => {
            this.sendToRenderer('browser:navigated', {
                viewId: id,
                url,
                canGoBack: webContents.canGoBack(),
                canGoForward: webContents.canGoForward(),
                isSecure: url.startsWith('https://'),
            });
        });

        webContents.on('page-title-updated', (_, title) => {
            this.sendToRenderer('browser:title', {
                viewId: id,
                title,
            });
        });

        webContents.on('page-favicon-updated', (_, favicons) => {
            this.sendToRenderer('browser:favicon', {
                viewId: id,
                faviconUrl: favicons.length > 0 ? favicons[0] : null,
            });
        });

        webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL, isMainFrame) => {
            if (isMainFrame) {
                this.sendToRenderer('browser:error', {
                    viewId: id,
                    errorCode,
                    errorDescription,
                    failedUrl: validatedURL,
                });
            } else {
                console.warn(`[BrowserService] Sub-frame load error: ${errorDescription}`);
            }
        });

        webContents.on('certificate-error', (event, url, error, certificate, callback) => {
            console.warn(`[BrowserService] Certificate error for ${url}: ${error}`);
            callback(false);
        });

        webContents.setWindowOpenHandler(({ url }) => {
            console.log(`[BrowserService] Window open blocked, loading in current view: ${url}`);
            this.loadURLInternal(view, url).catch((error) => {
                console.error(`[BrowserService] Failed to load popup URL: ${error.message}`);
            });
            return { action: 'deny' };
        });

        webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
            const allowedPermissions = [
                'fullscreen',
                'pointerLock',
                'clipboard-read',
                'clipboard-sanitized-write',
            ];

            const granted = allowedPermissions.includes(permission);
            console.log(`[BrowserService] Permission ${permission}: ${granted ? 'granted' : 'denied'}`);
            callback(granted);
        });
    }

    /**
     * Send event to renderer process
     */
    private sendToRenderer(channel: BrowserEventType, data: unknown): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(channel, data);
        }
    }
}

let browserServiceInstance: BrowserService | null = null;

export function getBrowserService(): BrowserService {
    if (!browserServiceInstance) {
        browserServiceInstance = new BrowserService();
    }
    return browserServiceInstance;
}

export function resetBrowserService(): void {
    if (browserServiceInstance) {
        browserServiceInstance.destroyAllViews();
        browserServiceInstance = null;
    }
}
