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

// B015: Extra width for the WebContentsView so the sidebar's CSS box-shadow
// (4px offset + 30px blur + 5px spread = 39px) can render beyond the sidebar
// element's right edge without being clipped by the view boundary.
export const SHADOW_MARGIN = 40;

// Minimum valid height to prevent narrow strip bug
// If window height is less than this, use fallback height
const MIN_VALID_HEIGHT = 100;
const FALLBACK_HEIGHT = 800;

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
    private isSidebarReactReady = false; // Track if React has rendered with correct dimensions
    private sidebarReadyResolver: (() => void) | null = null; // Resolver for waiting on React ready

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

        this.sidebarView = new WebContentsView({
            webPreferences: {
                preload: preloadPath,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
            },
        });

        // B015: Transparent background so the sidebar's CSS box-shadow can render
        // into the SHADOW_MARGIN area. The .sidebar component has its own background.
        // No white flash risk because the view starts invisible and off-screen.
        this.sidebarView.setBackgroundColor('#00000000');

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
        // IMPORTANT: Use MIN_VALID_HEIGHT to prevent narrow strip bug
        if (this.mainWindow) {
            const [, windowHeight] = this.mainWindow.getSize();
            // Use fallback height if window height is 0 or too small
            const safeHeight = windowHeight >= MIN_VALID_HEIGHT ? windowHeight : FALLBACK_HEIGHT;

            const initialBounds = {
                x: -(this.config.width + SHADOW_MARGIN), // Off-screen to the left
                y: 0,
                width: this.config.width + SHADOW_MARGIN,
                height: safeHeight,
            };
            this.sidebarView.setBounds(initialBounds);
        }

        // Make view invisible until explicitly shown
        this.sidebarView.setVisible(false);

        // Wait for sidebar content to load before allowing it to be shown
        this.sidebarView.webContents.on('did-finish-load', () => {
            this.isSidebarContentReady = true;

            // FIX: Re-set bounds after content loads to ensure renderer gets correct viewport
            // This fixes the narrow strip bug where the renderer's viewport dimensions
            // might not match the view bounds on initial load
            if (this.sidebarView && this.mainWindow) {
                const [, windowHeight] = this.mainWindow.getSize();
                const safeHeight = windowHeight >= MIN_VALID_HEIGHT ? windowHeight : FALLBACK_HEIGHT;
                const currentBounds = this.sidebarView.getBounds();

                // Re-set bounds to trigger viewport update in renderer
                this.sidebarView.setBounds({
                    x: currentBounds.x,
                    y: currentBounds.y,
                    width: this.config.width + SHADOW_MARGIN,
                    height: safeHeight,
                });
            }
        });
    }

    /**
     * Show the sidebar overlay with animation
     */
    async show(): Promise<void> {
        if (!this.sidebarView || !this.mainWindow || this.isVisible || this.isAnimating) {
            console.log('[SidebarOverlayService] show() skipped — isVisible:', this.isVisible, 'isAnimating:', this.isAnimating, 'hasView:', !!this.sidebarView);
            return;
        }

        // CRITICAL FIX: Set isAnimating IMMEDIATELY to prevent race condition
        // where multiple show() calls proceed past this check before any sets isAnimating
        this.isAnimating = true;

        try {
            // Don't show sidebar until content has loaded AND window has valid size
            // This prevents the narrow strip bug on first load
            const startTime = Date.now();
            const timeout = 3000;

            // Wait for content to be ready
            if (!this.isSidebarContentReady) {
                while (!this.isSidebarContentReady && Date.now() - startTime < timeout) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                if (!this.isSidebarContentReady) {
                    console.warn('[SidebarOverlayService] Sidebar content not ready after 3s, showing anyway');
                }
            }

            // Also wait for window to have valid size (prevents narrow strip bug)
            if (!this.hasValidWindowSize()) {
                const sizeWaitStart = Date.now();
                while (!this.hasValidWindowSize() && Date.now() - sizeWaitStart < timeout) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                if (!this.hasValidWindowSize()) {
                    console.warn('[SidebarOverlayService] Window size not valid after 3s, showing anyway with fallback');
                }
            }

            // Stop mouse tracking while sidebar is visible
            this.stopMouseTracking();

            // Make view visible
            this.sidebarView.setVisible(true);

            // Add to window at highest z-order (always above browser views).
            // Using no index ensures sidebar is on top even when browser views
            // are added/swapped after this call (e.g., after CMD+R reload).
            this.mainWindow.contentView.addChildView(this.sidebarView);

            // CRITICAL: Force a setBounds call AFTER addChildView to ensure viewport is updated
            // The WebContentsView might not update its internal viewport until attached + bounds set
            const boundsForForceUpdate = this.sidebarView.getBounds();
            this.sidebarView.setBounds({
                x: boundsForForceUpdate.x,
                y: boundsForForceUpdate.y,
                width: boundsForForceUpdate.width,
                height: boundsForForceUpdate.height,
            });

            // Send a signal to the sidebar renderer with the correct bounds
            // CRITICAL: This tells the sidebar what dimensions to use BEFORE viewport is valid
            // The sidebar should use these dimensions instead of waiting for viewport
            const targetBounds = this.sidebarView.getBounds();
            if (this.sidebarView.webContents && !this.sidebarView.webContents.isDestroyed()) {
                this.sidebarView.webContents.send('sidebar:view-attached', {
                    timestamp: Date.now(),
                    bounds: targetBounds,
                    width: targetBounds.width,
                    height: targetBounds.height,
                });
            }

            // Animate from off-screen to visible
            const finalBounds = this.sidebarView.getBounds();
            console.log('[SidebarOverlayService] show() starting animation, bounds:', JSON.stringify(finalBounds));
            await this.animateBounds(-(this.config.width + SHADOW_MARGIN), 0);

            this.isVisible = true;
            console.log('[SidebarOverlayService] show() completed, final bounds:', JSON.stringify(this.sidebarView.getBounds()));
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
            await this.animateBounds(0, -(this.config.width + SHADOW_MARGIN));

            // Remove from window
            this.mainWindow.contentView.removeChildView(this.sidebarView);

            // Make view invisible
            this.sidebarView.setVisible(false);

            this.isVisible = false;

            // Restart mouse tracking if still in floating mode
            // setFloatingMode() will handle stopping it if mode changed
            if (this.isFloatingMode) {
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
     * Show sidebar instantly without animation (for tab switches into overlay mode)
     * B010-FIX: Symmetric to hideInstant(). Used when switching from Spaces/Workspace
     * to Browser tab — the overlay should appear instantly, not slide in.
     */
    async showInstant(): Promise<void> {
        if (!this.sidebarView || !this.mainWindow || this.isVisible || this.isAnimating) {
            console.log('[SidebarOverlayService] showInstant() skipped — isVisible:', this.isVisible, 'isAnimating:', this.isAnimating, 'hasView:', !!this.sidebarView);
            return;
        }
        console.log('[SidebarOverlayService] showInstant() starting...');

        try {
            // Wait for content to be ready (same as show())
            if (!this.isSidebarContentReady) {
                const startTime = Date.now();
                const timeout = 3000;
                while (!this.isSidebarContentReady && Date.now() - startTime < timeout) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            // Wait for window to have valid size (prevents narrow strip bug after reload)
            // Same check as show() — without this, showInstant() can use stale/zero height
            if (!this.hasValidWindowSize()) {
                const sizeWaitStart = Date.now();
                const timeout = 3000;
                while (!this.hasValidWindowSize() && Date.now() - sizeWaitStart < timeout) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                if (!this.hasValidWindowSize()) {
                    console.warn('[SidebarOverlayService] Window size not valid for showInstant, using fallback');
                }
            }

            // Stop mouse tracking while sidebar is visible
            this.stopMouseTracking();

            // Ensure sidebar view has correct height BEFORE making visible.
            // After renderer reloads, the view's cached bounds may be stale.
            // Re-validate with current window size.
            const [, currentWindowHeight] = this.mainWindow.getSize();
            const validHeight = currentWindowHeight >= MIN_VALID_HEIGHT ? currentWindowHeight : FALLBACK_HEIGHT;
            this.sidebarView.setBounds({
                x: -(this.config.width + SHADOW_MARGIN), // Still off-screen until updateBounds(0) below
                y: 0,
                width: this.config.width + SHADOW_MARGIN,
                height: validHeight,
            });

            // Make view visible
            this.sidebarView.setVisible(true);

            // Add to window at highest z-order (always above browser views).
            // Using no index ensures sidebar is on top even when browser views
            // are added/swapped after this call (e.g., after CMD+R reload).
            this.mainWindow.contentView.addChildView(this.sidebarView);

            // Force setBounds after addChildView to ensure renderer viewport is updated
            this.sidebarView.setBounds({
                x: -(this.config.width + SHADOW_MARGIN),
                y: 0,
                width: this.config.width + SHADOW_MARGIN,
                height: validHeight,
            });

            // Send view-attached signal with explicit dimensions
            if (this.sidebarView.webContents && !this.sidebarView.webContents.isDestroyed()) {
                this.sidebarView.webContents.send('sidebar:view-attached', {
                    timestamp: Date.now(),
                    bounds: { x: 0, y: 0, width: this.config.width + SHADOW_MARGIN, height: validHeight },
                    width: this.config.width + SHADOW_MARGIN,
                    height: validHeight,
                });
            }

            // B010-FIX: Set bounds directly at x=0 — NO animation
            this.updateBoundsWithHeight(0, validHeight);

            this.isVisible = true;
            const finalBounds = this.sidebarView.getBounds();
            console.log('[SidebarOverlayService] showInstant() completed — bounds:', JSON.stringify(finalBounds), 'windowHeight:', currentWindowHeight, 'validHeight:', validHeight);
        } catch (error) {
            console.error('[SidebarOverlayService] Error showing instantly:', error);
        }
    }

    /**
     * Hide sidebar instantly without animation (for mode switches)
     */
    hideInstant(): void {
        if (!this.sidebarView || !this.mainWindow || !this.isVisible) {
            console.log('[SidebarOverlayService] hideInstant() skipped — isVisible:', this.isVisible);
            return;
        }
        console.log('[SidebarOverlayService] hideInstant() — hiding overlay');

        try {
            // Remove from window immediately without animation
            this.mainWindow.contentView.removeChildView(this.sidebarView);
            // Make view invisible
            this.sidebarView.setVisible(false);
            this.isVisible = false;
        } catch (error) {
            console.error('[SidebarOverlayService] Error hiding instantly:', error);
        }
    }

    /**
     * Update sidebar bounds with cached height to avoid expensive getSize() calls
     * IMPORTANT: Validates height to prevent narrow strip bug
     */
    private updateBoundsWithHeight(x: number, height: number): void {
        if (!this.sidebarView || !this.mainWindow) return;

        // Validate height - use fallback if too small
        const safeHeight = height >= MIN_VALID_HEIGHT ? height : FALLBACK_HEIGHT;

        const newBounds = {
            x: x,
            y: 0,
            width: this.config.width + SHADOW_MARGIN,
            height: safeHeight,
        };

        this.sidebarView.setBounds(newBounds);
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
     * Check if window has valid size for displaying sidebar
     */
    private hasValidWindowSize(): boolean {
        if (!this.mainWindow) return false;
        const [, height] = this.mainWindow.getSize();
        return height >= MIN_VALID_HEIGHT;
    }

    /**
     * Animate bounds from start to end x position
     * Optimized to:
     * 1. Use view's current bounds height (prevents overwriting correct bounds with wrong getSize)
     * 2. Use setImmediate for more precise timing when possible
     * 3. Skip intermediate frames if animation is behind schedule
     *
     * CRITICAL FIX: Uses view's current bounds height instead of getSize().
     * This prevents the narrow strip bug where getSize() returns wrong value
     * during first load but view was already set with correct bounds.
     */
    private animateBounds(startX: number, endX: number): Promise<void> {
        return new Promise((resolve) => {
            if (!this.mainWindow || !this.sidebarView) {
                resolve();
                return;
            }

            const duration = this.config.animationDuration;
            const startTime = Date.now();
            const frameInterval = 1000 / 60; // ~16.67ms for 60fps

            // CRITICAL FIX: Use view's CURRENT bounds height (set correctly during init)
            // instead of getSize() which may return wrong value on first load
            const currentBounds = this.sidebarView.getBounds();
            let windowHeight = currentBounds.height;

            // Only fall back to getSize() if current bounds are invalid
            if (windowHeight < MIN_VALID_HEIGHT) {
                const [, windowSizeHeight] = this.mainWindow.getSize();
                windowHeight = windowSizeHeight >= MIN_VALID_HEIGHT ? windowSizeHeight : FALLBACK_HEIGHT;
            }

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
     * Re-raise sidebar overlay to the top of the z-order.
     * Must be called after any other WebContentsView is added to the window
     * (e.g., after BrowserService.setActiveView) to maintain the invariant:
     * sidebar overlay is ALWAYS at the highest z-order when visible.
     *
     * Without this, addChildView(browserView) pushes the browser ABOVE the
     * sidebar, causing the sidebar to be covered (only top strip visible).
     */
    raiseToTop(): void {
        if (!this.sidebarView || !this.mainWindow || !this.isVisible) {
            return;
        }

        try {
            // Re-adding an already-attached child view moves it to the end
            // (highest z-order) without triggering detach/reattach lifecycle
            this.mainWindow.contentView.addChildView(this.sidebarView);
        } catch (error) {
            console.warn('[SidebarOverlayService] Error raising to top:', error);
        }
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
     * Called when sidebar overlay signals that React has rendered with correct dimensions
     */
    handleSidebarReady(): void {
        this.isSidebarReactReady = true;
        if (this.sidebarReadyResolver) {
            this.sidebarReadyResolver();
            this.sidebarReadyResolver = null;
        }
    }

    /**
     * Wait for sidebar React to be ready (rendered with correct dimensions)
     * NOTE: This is kept for potential future use but currently animation starts immediately
     */
    private waitForSidebarReady(): Promise<void> {
        if (this.isSidebarReactReady) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.warn('[SidebarOverlayService] SIDEBAR_READY timeout');
                this.sidebarReadyResolver = null;
                resolve();
            }, 5000);

            this.sidebarReadyResolver = () => {
                clearTimeout(timeout);
                resolve();
            };
        });
    }

    /**
     * Handle system resume (wake from sleep)
     * Hides the overlay, re-validates bounds, and restarts mouse tracking
     * This prevents the narrow strip bug after sleep and ensures clean state
     */
    handleSystemResume(): void {
        if (!this.sidebarView || !this.mainWindow) {
            return;
        }

        console.log('[SidebarOverlayService] Handling system resume...');

        // Stop any ongoing animations
        this.isAnimating = false;

        // Stop mouse tracking temporarily
        this.stopMouseTracking();

        // If overlay was visible, hide it (collapse on resume = fresh start behavior)
        if (this.isVisible) {
            try {
                this.mainWindow.contentView.removeChildView(this.sidebarView);
            } catch (error) {
                console.warn('[SidebarOverlayService] View was not attached on resume:', error);
            }

            this.sidebarView.setVisible(false);
            this.isVisible = false;
        }

        // Re-validate bounds with current window height (may have changed during sleep)
        const [, windowHeight] = this.mainWindow.getSize();
        const safeHeight = windowHeight >= MIN_VALID_HEIGHT ? windowHeight : FALLBACK_HEIGHT;

        this.sidebarView.setBounds({
            x: -(this.config.width + SHADOW_MARGIN), // Off-screen
            y: 0,
            width: this.config.width + SHADOW_MARGIN,
            height: safeHeight,
        });

        // Restart mouse tracking if in floating mode
        // This allows user to re-show sidebar by hovering left edge
        if (this.isFloatingMode) {
            this.startMouseTracking();
        }

        console.log('[SidebarOverlayService] System resume handled - overlay hidden, bounds re-validated');
    }

    /**
     * Handle renderer reload (CMD+R)
     * Resets view state and re-attaches views if they were visible
     */
    handleRendererReload(): void {
        if (!this.sidebarView || !this.mainWindow) {
            return;
        }

        console.log('[SidebarOverlayService] handleRendererReload() — isVisible:', this.isVisible, 'isFloatingMode:', this.isFloatingMode);

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

                // Re-add the view at highest z-order (always above browser views)
                this.mainWindow.contentView.addChildView(this.sidebarView);

                // Update bounds to correct position
                this.updateBounds(0);
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
                this.updateBounds(-(this.config.width + SHADOW_MARGIN));

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
