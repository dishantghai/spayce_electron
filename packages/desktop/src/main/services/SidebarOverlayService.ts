import { BrowserWindow, WebContentsView, app, screen } from 'electron';
import path from 'path';

/**
 * Sidebar overlay configuration
 */
export interface SidebarOverlayConfig {
    readonly width: number;
    readonly animationDuration: number;
    readonly hoverTriggerWidth: number; // Width of hover trigger zone in pixels
}

const DEFAULT_CONFIG: SidebarOverlayConfig = {
    width: 320,
    animationDuration: 250,
    hoverTriggerWidth: 10, // 10px from left edge triggers sidebar
};

/**
 * SidebarOverlayService manages the sidebar WebContentsView overlay
 *
 * The sidebar is rendered as a separate WebContentsView that floats
 * above the browser WebContentsView, achieving true overlay behavior.
 * This solves the fundamental Electron constraint where WebContentsView
 * always renders above HTML/React content.
 *
 * Z-Order: Browser at index 0, Sidebar at index 1
 *
 * Mouse Tracking: When sidebar is hidden in floating mode, tracks mouse
 * position to auto-show when hovering near the left edge of the window.
 * This works even when WebContentsView covers the HTML hover trigger.
 */
export class SidebarOverlayService {
    private sidebarView: WebContentsView | null = null;
    private mainWindow: BrowserWindow | null = null;
    private config: SidebarOverlayConfig;
    private isVisible = false;
    private isAnimating = false;
    private isInitialized = false;
    private mouseTrackingInterval: NodeJS.Timeout | null = null;
    private isFloatingMode = false;
    private isSidebarContentReady = false; // Track if sidebar.html has loaded

    constructor(config: Partial<SidebarOverlayConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Initialize the service with the main window
     */
    initialize(mainWindow: BrowserWindow): void {
        if (this.isInitialized) {
            console.warn('[SidebarOverlayService] Already initialized');
            return;
        }

        this.mainWindow = mainWindow;
        this.createSidebarView();
        this.isInitialized = true;

        // Handle window resize
        mainWindow.on('resize', () => {
            this.handleWindowResize();
        });

        // Cleanup on window close
        mainWindow.on('closed', () => {
            this.destroy();
        });

        console.log('[SidebarOverlayService] Initialized');
    }

    /**
     * Set floating mode state
     * When in floating mode and sidebar is hidden, start mouse tracking
     */
    setFloatingMode(enabled: boolean): void {
        this.isFloatingMode = enabled;

        if (enabled && !this.isVisible) {
            this.startMouseTracking();
        } else {
            this.stopMouseTracking();
        }
    }

    /**
     * Start tracking mouse position for auto-show
     * Only active when sidebar is hidden in floating mode
     */
    private startMouseTracking(): void {
        if (this.mouseTrackingInterval) {
            return; // Already tracking
        }

        console.log('[SidebarOverlayService] Starting mouse tracking for auto-show');

        this.mouseTrackingInterval = setInterval(() => {
            if (!this.mainWindow || !this.isFloatingMode || this.isVisible || this.isAnimating) {
                return;
            }

            try {
                const cursorPosition = screen.getCursorScreenPoint();
                const windowBounds = this.mainWindow.getBounds();

                // Check if cursor is within the left edge trigger zone
                const isInWindow =
                    cursorPosition.x >= windowBounds.x &&
                    cursorPosition.x <= windowBounds.x + windowBounds.width &&
                    cursorPosition.y >= windowBounds.y &&
                    cursorPosition.y <= windowBounds.y + windowBounds.height;

                if (isInWindow) {
                    const relativeX = cursorPosition.x - windowBounds.x;

                    // If cursor is within trigger zone on the left edge
                    if (relativeX <= this.config.hoverTriggerWidth) {
                        console.log('[SidebarOverlayService] Mouse near left edge - auto-showing sidebar');

                        // Notify main renderer BEFORE showing so it can update sidebarVisible
                        // This ensures state sync happens before overlay appears
                        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                            this.mainWindow.webContents.send('sidebar-overlay:auto-show-triggered');
                        }

                        this.show();
                    }
                }
            } catch (error) {
                // Window might be destroyed or in invalid state
                console.error('[SidebarOverlayService] Error in mouse tracking:', error);
                this.stopMouseTracking();
            }
        }, 100); // Check every 100ms for responsive hover detection
    }

    /**
     * Stop tracking mouse position
     */
    private stopMouseTracking(): void {
        if (this.mouseTrackingInterval) {
            clearInterval(this.mouseTrackingInterval);
            this.mouseTrackingInterval = null;
            console.log('[SidebarOverlayService] Stopped mouse tracking');
        }
    }

    /**
     * Create the sidebar WebContentsView
     */
    private createSidebarView(): void {
        if (!this.mainWindow) return;

        // Get preload path
        // Both main.cjs and preload.cjs are in the same dist/ directory
        // __dirname points to the directory containing main.cjs (packages/desktop/dist/)
        const preloadPath = path.join(__dirname, 'preload.cjs');

        console.log('[SidebarOverlayService] Creating sidebar view with preload:', preloadPath);
        console.log('[SidebarOverlayService] __dirname:', __dirname);
        console.log('[SidebarOverlayService] app.isPackaged:', app.isPackaged);

        this.sidebarView = new WebContentsView({
            webPreferences: {
                preload: preloadPath,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
            },
        });

        // Set background color to match sidebar theme - prevents white flash before React renders
        this.sidebarView.setBackgroundColor('#131020');

        // Load sidebar entry point
        if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
            // In development, load from Vite dev server
            this.sidebarView.webContents.loadURL('http://localhost:5173/sidebar.html');
        } else {
            // In production, load from built files
            this.sidebarView.webContents.loadFile(
                path.join(__dirname, '../../renderer/sidebar.html')
            );
        }

        // Set initial bounds (off-screen AND invisible)
        // Use explicit values to ensure view is truly hidden
        if (this.mainWindow) {
            const [, windowHeight] = this.mainWindow.getSize();
            this.sidebarView.setBounds({
                x: -this.config.width, // Off-screen to the left
                y: 0,
                width: this.config.width,
                height: windowHeight > 0 ? windowHeight : 800, // Fallback height if window not ready
            });
        }

        // Make view invisible until explicitly shown
        this.sidebarView.setVisible(false);

        // Wait for sidebar content to load before allowing it to be shown
        this.sidebarView.webContents.on('did-finish-load', () => {
            console.log('[SidebarOverlayService] Sidebar content loaded and ready');
            this.isSidebarContentReady = true;
        });

        // Open DevTools in development for debugging (optional)
        if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
            // Uncomment to debug sidebar overlay
            // this.sidebarView.webContents.openDevTools({ mode: 'detach' });
        }

        console.log('[SidebarOverlayService] Sidebar view created');
    }

    /**
     * Show the sidebar overlay with animation
     */
    async show(): Promise<void> {
        if (!this.sidebarView || !this.mainWindow || this.isVisible || this.isAnimating) {
            return;
        }

        // Don't show sidebar until content has loaded
        if (!this.isSidebarContentReady) {
            console.log('[SidebarOverlayService] Waiting for sidebar content to load before showing...');
            // Wait up to 3 seconds for content to load
            const startTime = Date.now();
            while (!this.isSidebarContentReady && Date.now() - startTime < 3000) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            if (!this.isSidebarContentReady) {
                console.warn('[SidebarOverlayService] Sidebar content not ready after 3s, showing anyway');
            }
        }

        this.isAnimating = true;

        // Stop mouse tracking while sidebar is visible
        this.stopMouseTracking();

        try {
            // Make view visible
            this.sidebarView.setVisible(true);

            // Add to window at index 1 (above browser at index 0)
            this.mainWindow.contentView.addChildView(this.sidebarView, 1);

            // Animate from off-screen to visible
            await this.animateBounds(-this.config.width, 0);

            this.isVisible = true;
            console.log('[SidebarOverlayService] Sidebar shown');
        } finally {
            this.isAnimating = false;
        }
    }

    /**
     * Hide the sidebar overlay with animation
     */
    async hide(): Promise<void> {
        if (!this.sidebarView || !this.mainWindow || !this.isVisible || this.isAnimating) {
            return;
        }

        this.isAnimating = true;

        try {
            // Animate from visible to off-screen
            await this.animateBounds(0, -this.config.width);

            // Remove from window
            this.mainWindow.contentView.removeChildView(this.sidebarView);

            // Make view invisible
            this.sidebarView.setVisible(false);

            this.isVisible = false;
            console.log('[SidebarOverlayService] Sidebar hidden');

            // Restart mouse tracking if still in floating mode
            // setFloatingMode() will handle stopping it if mode changed
            if (this.isFloatingMode) {
                console.log('[SidebarOverlayService] Restarting mouse tracking (still in floating mode)');
                this.startMouseTracking();
            }
        } finally {
            this.isAnimating = false;
        }
    }

    /**
     * Toggle sidebar visibility
     */
    async toggle(): Promise<boolean> {
        if (this.isVisible) {
            await this.hide();
        } else {
            await this.show();
        }
        return this.isVisible;
    }

    /**
     * Hide sidebar instantly without animation (for mode switches)
     */
    hideInstant(): void {
        if (!this.sidebarView || !this.mainWindow || !this.isVisible) {
            return;
        }

        try {
            // Remove from window immediately without animation
            this.mainWindow.contentView.removeChildView(this.sidebarView);
            // Make view invisible
            this.sidebarView.setVisible(false);
            this.isVisible = false;
            console.log('[SidebarOverlayService] Sidebar hidden instantly (mode switch)');
        } catch (error) {
            console.error('[SidebarOverlayService] Error hiding instantly:', error);
        }
    }

    /**
     * Update sidebar bounds with cached height to avoid expensive getSize() calls
     */
    private updateBoundsWithHeight(x: number, height: number): void {
        if (!this.sidebarView || !this.mainWindow) return;

        this.sidebarView.setBounds({
            x: x,
            y: 0,
            width: this.config.width,
            height: height,
        });
    }

    /**
     * Update sidebar bounds (fetches current window height)
     */
    private updateBounds(x: number): void {
        if (!this.sidebarView || !this.mainWindow) return;

        const [, height] = this.mainWindow.getSize();
        this.updateBoundsWithHeight(x, height);
    }

    /**
     * Animate bounds from start to end x position
     * Optimized to:
     * 1. Cache window height at animation start (avoid repeated getSize calls)
     * 2. Use setImmediate for more precise timing when possible
     * 3. Skip intermediate frames if animation is behind schedule
     */
    private animateBounds(startX: number, endX: number): Promise<void> {
        return new Promise((resolve) => {
            if (!this.mainWindow) {
                resolve();
                return;
            }

            const duration = this.config.animationDuration;
            const startTime = Date.now();
            const frameInterval = 1000 / 60; // ~16.67ms for 60fps

            // Cache height at animation start to avoid expensive getSize() calls during animation
            const [, windowHeight] = this.mainWindow.getSize();

            // Track last rendered position to avoid redundant setBounds calls
            let lastRenderedX = startX;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-out cubic for smooth deceleration
                const eased = 1 - Math.pow(1 - progress, 3);

                // Calculate target position - use floor for consistency (avoids sub-pixel jitter)
                const targetX = Math.floor(startX + (endX - startX) * eased);

                // Only update bounds if position actually changed (reduces compositor load)
                if (targetX !== lastRenderedX) {
                    this.updateBoundsWithHeight(targetX, windowHeight);
                    lastRenderedX = targetX;
                }

                if (progress < 1) {
                    // Use setImmediate when available for better timing, fall back to setTimeout
                    if (typeof setImmediate !== 'undefined') {
                        // For frames that are on schedule, use setTimeout
                        // For frames that are behind, use setImmediate to catch up
                        const expectedElapsed = (Date.now() - startTime);
                        const framesBehind = Math.floor(expectedElapsed / frameInterval) - Math.floor(elapsed / frameInterval);

                        if (framesBehind > 1) {
                            // We're behind schedule, catch up immediately
                            setImmediate(animate);
                        } else {
                            setTimeout(animate, frameInterval);
                        }
                    } else {
                        setTimeout(animate, frameInterval);
                    }
                } else {
                    // Ensure final position is exact
                    if (lastRenderedX !== endX) {
                        this.updateBoundsWithHeight(endX, windowHeight);
                    }
                    resolve();
                }
            };

            animate();
        });
    }

    /**
     * Get visibility state
     */
    getIsVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Get sidebar WebContents for IPC communication
     */
    getWebContents(): Electron.WebContents | null {
        return this.sidebarView?.webContents ?? null;
    }

    /**
     * Handle window resize - update sidebar bounds
     */
    handleWindowResize(): void {
        if (this.isVisible && !this.isAnimating) {
            this.updateBounds(0);
        }
    }

    /**
     * Send state update to sidebar overlay
     */
    sendStateUpdate(state: unknown): void {
        const webContents = this.getWebContents();
        if (webContents && !webContents.isDestroyed()) {
            webContents.send('sidebar:state-update', state);
        }
    }

    /**
     * Handle renderer reload (CMD+R)
     * Resets view state and re-attaches views if they were visible
     */
    handleRendererReload(): void {
        if (!this.sidebarView || !this.mainWindow) {
            console.log('[SidebarOverlayService] No view to reset on reload');
            return;
        }

        console.log('[SidebarOverlayService] Handling renderer reload...');
        console.log('[SidebarOverlayService] Sidebar was visible:', this.isVisible);

        // Stop any ongoing animations
        this.isAnimating = false;

        // Stop mouse tracking temporarily
        this.stopMouseTracking();

        try {
            // Remove the view if it's attached (to reset z-order)
            if (this.isVisible) {
                try {
                    this.mainWindow.contentView.removeChildView(this.sidebarView);
                } catch (error) {
                    console.warn('[SidebarOverlayService] View was not attached:', error);
                }

                // Make view visible
                this.sidebarView.setVisible(true);

                // Re-add the view at correct z-index and bounds
                this.mainWindow.contentView.addChildView(this.sidebarView, 1);

                // Update bounds to correct position
                this.updateBounds(0);

                console.log('[SidebarOverlayService] Re-attached visible sidebar after reload');
            } else {
                // Sidebar was hidden - ensure it's removed and positioned off-screen
                try {
                    this.mainWindow.contentView.removeChildView(this.sidebarView);
                } catch {
                    // Already removed
                }

                // Make view invisible
                this.sidebarView.setVisible(false);

                // Set off-screen bounds
                this.updateBounds(-this.config.width);

                console.log('[SidebarOverlayService] Reset hidden sidebar after reload');

                // Restart mouse tracking if in floating mode
                if (this.isFloatingMode) {
                    this.startMouseTracking();
                }
            }
        } catch (error) {
            console.error('[SidebarOverlayService] Error handling reload:', error);
        }
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        // Stop mouse tracking
        this.stopMouseTracking();

        if (this.sidebarView && this.mainWindow) {
            try {
                this.mainWindow.contentView.removeChildView(this.sidebarView);
            } catch {
                // View may not be attached
            }

            if (!this.sidebarView.webContents.isDestroyed()) {
                this.sidebarView.webContents.close();
            }
        }

        this.sidebarView = null;
        this.mainWindow = null;
        this.isInitialized = false;
        this.isVisible = false;
        this.isFloatingMode = false;

        console.log('[SidebarOverlayService] Destroyed');
    }
}

// Singleton instance
let sidebarOverlayService: SidebarOverlayService | null = null;

export function getSidebarOverlayService(): SidebarOverlayService {
    if (!sidebarOverlayService) {
        sidebarOverlayService = new SidebarOverlayService();
    }
    return sidebarOverlayService;
}

export function resetSidebarOverlayService(): void {
    if (sidebarOverlayService) {
        sidebarOverlayService.destroy();
        sidebarOverlayService = null;
    }
}
