import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useBrowserUiStore, initializeBrowserEventSubscriptions } from '../../stores/browserUiStore';
import { BrowserLoadingBar } from './BrowserLoadingBar';
import { BrowserErrorOverlay } from './BrowserErrorOverlay';
import { BrowserTabBar, BrowserTab } from './BrowserTabBar';
import { BrowserToolbar } from './BrowserToolbar';
import styles from './BrowserArea.module.css';

export interface BrowserAreaProps {
    /**
     * Additional left offset for the WebContentsView.
     * - In floating mode: Pass sidebar width (e.g., 320) to leave space for sidebar overlay
     * - In fixed mode: Pass 0 (DOM layout already positions content after sidebar)
     */
    sidebarWidth: number;
    /** Height of any top chrome (tab bar, nav bar) in pixels */
    topOffset?: number;
    /** Additional class name */
    className?: string;
}

// Heights for the chrome elements
const TAB_BAR_HEIGHT = 36;
const TOOLBAR_HEIGHT = 40;
const TOTAL_CHROME_HEIGHT = TAB_BAR_HEIGHT + TOOLBAR_HEIGHT;

/**
 * Container for the browser WebContentsView
 * Spec 019: Single Tab Browser MVP
 *
 * The actual web content is rendered by the main process WebContentsView,
 * positioned to match this component's bounds. This component:
 * 1. Displays tab bar and navigation toolbar
 * 2. Calculates and reports content bounds to main process
 * 3. Shows loading progress
 * 4. Shows error overlay when needed
 * 5. Initializes browser on mount
 */
// Sidebar animation duration (must match CSS transition in Sidebar.module.css)
const SIDEBAR_ANIMATION_DURATION = 250;

export function BrowserArea({
    sidebarWidth,
    topOffset = 0,
    className,
}: BrowserAreaProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const boundsUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const sidebarAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevSidebarWidthRef = useRef<number>(sidebarWidth);
    // Track if sidebar animation is in progress to suppress intermediate updates
    const isAnimatingRef = useRef<boolean>(false);
    // Track last sent bounds to avoid redundant updates
    const lastBoundsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

    const {
        activeViewId,
        views,
        isInitialized,
        initError,
        initialize,
        updateBounds,
        loadURL,
        goBack,
        goForward,
        reload,
        stop,
        clearError,
    } = useBrowserUiStore();

    // Get active view state
    const activeView = useBrowserUiStore((state) => {
        if (!state.activeViewId) return null;
        return state.views.get(state.activeViewId) ?? null;
    });

    // Convert views map to tabs array
    const tabs: BrowserTab[] = useMemo(() => {
        return Array.from(views.values()).map((view) => ({
            id: view.id,
            title: view.title || 'New Tab',
            faviconUrl: view.faviconUrl,
            isLoading: view.isLoading,
        }));
    }, [views]);

    // Calculate and send bounds to main process with debouncing to prevent flickering
    // sidebarWidth is the additional left offset to apply:
    // - In floating mode: App passes sidebar width (320) so WebContentsView doesn't cover sidebar
    // - In fixed mode: App passes 0 (DOM layout already positions content after sidebar)
    const sendBoundsImmediate = useCallback(() => {
        if (!contentRef.current || !activeViewId) return;

        // Skip intermediate updates during sidebar animation to prevent flickering
        if (isAnimatingRef.current) return;

        const rect = contentRef.current.getBoundingClientRect();

        // Only update if we have valid dimensions
        if (rect.width > 0 && rect.height > 0) {
            // Use rect.x directly (already correct from DOM layout)
            // Add sidebarWidth offset only when App tells us to (floating mode)
            const adjustedX = Math.round(rect.x) + sidebarWidth;
            const adjustedWidth = Math.round(rect.width) - sidebarWidth;

            const newBounds = {
                x: adjustedX,
                y: Math.round(rect.y),
                width: Math.max(adjustedWidth, 100), // Minimum width to prevent negative/zero
                height: Math.round(rect.height),
            };

            // Only update if bounds actually changed (prevents redundant IPC calls)
            const lastBounds = lastBoundsRef.current;
            if (
                !lastBounds ||
                lastBounds.x !== newBounds.x ||
                lastBounds.y !== newBounds.y ||
                lastBounds.width !== newBounds.width ||
                lastBounds.height !== newBounds.height
            ) {
                lastBoundsRef.current = newBounds;
                updateBounds(newBounds);
            }
        }
    }, [activeViewId, updateBounds, sidebarWidth]);

    // Debounced version to prevent flickering during rapid sidebar toggling
    const sendBounds = useCallback(() => {
        if (boundsUpdateTimeoutRef.current) {
            clearTimeout(boundsUpdateTimeoutRef.current);
        }
        // Small debounce to batch rapid updates (e.g., during sidebar animation)
        boundsUpdateTimeoutRef.current = setTimeout(() => {
            sendBoundsImmediate();
        }, 16); // ~1 frame at 60fps
    }, [sendBoundsImmediate]);

    // Initialize browser and event subscriptions on mount
    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const setup = async () => {
            // Initialize event subscriptions
            cleanup = initializeBrowserEventSubscriptions();

            // Initialize browser store (creates first view)
            await initialize();

            setIsReady(true);
        };

        setup();

        return () => {
            if (cleanup) cleanup();
            // Clean up debounce timeout
            if (boundsUpdateTimeoutRef.current) {
                clearTimeout(boundsUpdateTimeoutRef.current);
            }
        };
    }, [initialize]);

    // Update bounds when container size changes
    useEffect(() => {
        if (!isReady) return;

        // Initial bounds
        sendBounds();

        // Listen for resize
        const handleResize = () => {
            requestAnimationFrame(sendBounds);
        };

        window.addEventListener('resize', handleResize);

        // ResizeObserver for container-specific changes
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(sendBounds);
        });

        if (contentRef.current) {
            resizeObserver.observe(contentRef.current);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
        };
    }, [isReady, sendBounds]);

    // Update bounds when sidebar width changes - with animation delay to prevent flicker
    useEffect(() => {
        if (!isReady) return;

        const prevWidth = prevSidebarWidthRef.current;
        const widthChanged = prevWidth !== sidebarWidth;
        prevSidebarWidthRef.current = sidebarWidth;

        // If sidebar width changed, delay bounds update to let sidebar animation complete
        // This prevents the WebContentsView from flickering during the 250ms sidebar transition
        if (widthChanged) {
            // Mark animation as in progress to suppress intermediate updates from resize events
            isAnimatingRef.current = true;

            // Clear any pending animation timeout
            if (sidebarAnimationTimeoutRef.current) {
                clearTimeout(sidebarAnimationTimeoutRef.current);
            }

            // Wait for sidebar animation to complete before updating bounds
            sidebarAnimationTimeoutRef.current = setTimeout(() => {
                // Animation complete, allow normal updates again
                isAnimatingRef.current = false;
                // Force update bounds after animation
                lastBoundsRef.current = null; // Reset to ensure update happens
                sendBoundsImmediate();
            }, SIDEBAR_ANIMATION_DURATION);
        }

        return () => {
            if (sidebarAnimationTimeoutRef.current) {
                clearTimeout(sidebarAnimationTimeoutRef.current);
                isAnimatingRef.current = false;
            }
        };
    }, [sidebarWidth, isReady, sendBoundsImmediate]);

    // Update bounds when top offset changes (immediate, no animation needed)
    useEffect(() => {
        if (isReady) {
            sendBounds();
        }
    }, [topOffset, isReady, sendBounds]);

    // Handlers for tab bar
    const handleTabClick = useCallback((tabId: string) => {
        // For MVP with single tab, this is a no-op
        // In multi-tab future, would call setActiveView
        console.log('[BrowserArea] Tab clicked:', tabId);
    }, []);

    // Handlers for toolbar
    const handleBack = useCallback(() => {
        if (activeViewId) goBack();
    }, [activeViewId, goBack]);

    const handleForward = useCallback(() => {
        if (activeViewId) goForward();
    }, [activeViewId, goForward]);

    const handleReload = useCallback(() => {
        if (activeViewId) reload();
    }, [activeViewId, reload]);

    const handleStop = useCallback(() => {
        if (activeViewId) stop();
    }, [activeViewId, stop]);

    const handleNavigate = useCallback((url: string) => {
        if (activeViewId) loadURL(url);
    }, [activeViewId, loadURL]);

    const handleRetry = useCallback(() => {
        if (activeViewId && activeView?.url) {
            clearError(activeViewId);
            loadURL(activeView.url);
        }
    }, [activeViewId, activeView?.url, clearError, loadURL]);

    const handleGoToGoogle = useCallback(() => {
        if (activeViewId) {
            clearError(activeViewId);
        }
        loadURL('https://www.google.com');
    }, [activeViewId, clearError, loadURL]);

    // Show initialization error
    if (initError) {
        return (
            <div
                className={`${styles.browserArea} ${styles.error} ${className ?? ''}`}
            >
                <div className={styles.errorContent}>
                    <h3>Failed to initialize browser</h3>
                    <p>{initError}</p>
                    <button
                        className={styles.retryButton}
                        onClick={() => window.location.reload()}
                    >
                        Reload Application
                    </button>
                </div>
            </div>
        );
    }

    // Show loading state while initializing
    if (!isInitialized || !isReady) {
        return (
            <div
                className={`${styles.browserArea} ${styles.loading} ${className ?? ''}`}
            >
                <div className={styles.loadingContent}>
                    <div className={styles.spinner} />
                    <span>Initializing browser...</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${styles.browserArea} ${className ?? ''}`}
            data-testid="browser-area"
        >
            {/* Tab bar */}
            <BrowserTabBar
                tabs={tabs}
                activeTabId={activeViewId}
                onTabClick={handleTabClick}
                className={styles.tabBar}
            />

            {/* Navigation toolbar */}
            <BrowserToolbar
                url={activeView?.url ?? ''}
                isLoading={activeView?.isLoading ?? false}
                canGoBack={activeView?.canGoBack ?? false}
                canGoForward={activeView?.canGoForward ?? false}
                isSecure={activeView?.isSecure ?? false}
                onBack={handleBack}
                onForward={handleForward}
                onReload={handleReload}
                onStop={handleStop}
                onNavigate={handleNavigate}
                className={styles.toolbar}
            />

            {/* Content area - WebContentsView renders here */}
            <div
                ref={contentRef}
                className={styles.content}
                data-testid="browser-content"
            >
                {/* Loading progress bar */}
                {activeView?.isLoading && (
                    <BrowserLoadingBar progress={activeView.loadingProgress} />
                )}

                {/* Error overlay */}
                {activeView?.errorCode && (
                    <BrowserErrorOverlay
                        errorCode={activeView.errorCode}
                        errorDescription={activeView.errorDescription ?? 'Unknown error'}
                        url={activeView.url}
                        onRetry={handleRetry}
                        onGoToGoogle={handleGoToGoogle}
                    />
                )}

                {/*
                    Placeholder div - the actual WebContentsView is positioned by the main process
                    to match this container's bounds. This div exists to:
                    1. Provide layout context
                    2. Allow click-through to WebContentsView
                    3. Show when no view is active
                */}
                {!activeViewId && (
                    <div className={styles.placeholder}>
                        <span>No browser view active</span>
                    </div>
                )}
            </div>
        </div>
    );
}
