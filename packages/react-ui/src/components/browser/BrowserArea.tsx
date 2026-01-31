import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useBrowserUiStore, initializeBrowserEventSubscriptions } from '../../stores/browserUiStore';
import { BrowserLoadingBar } from './BrowserLoadingBar';
import { BrowserErrorOverlay } from './BrowserErrorOverlay';
import { BrowserTabBar, BrowserTab } from './BrowserTabBar';
import { BrowserToolbar } from './BrowserToolbar';
import styles from './BrowserArea.module.css';

export interface BrowserAreaProps {
    /** Width of the sidebar in pixels */
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
export function BrowserArea({
    sidebarWidth,
    topOffset = 0,
    className,
}: BrowserAreaProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

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

    // Calculate and send bounds to main process
    const sendBounds = useCallback(() => {
        if (!contentRef.current || !activeViewId) return;

        const rect = contentRef.current.getBoundingClientRect();

        // Only update if we have valid dimensions
        if (rect.width > 0 && rect.height > 0) {
            updateBounds({
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            });
        }
    }, [activeViewId, updateBounds]);

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

    // Update bounds when sidebar width or top offset changes
    useEffect(() => {
        if (isReady) {
            sendBounds();
        }
    }, [sidebarWidth, topOffset, isReady, sendBounds]);

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
        if (activeView?.url) {
            clearError();
            loadURL(activeView.url);
        }
    }, [activeView?.url, clearError, loadURL]);

    const handleGoToGoogle = useCallback(() => {
        clearError();
        loadURL('https://www.google.com');
    }, [clearError, loadURL]);

    // Show initialization error
    if (initError) {
        return (
            <div
                className={`${styles.browserArea} ${styles.error} ${className ?? ''}`}
                style={{ left: sidebarWidth, top: topOffset }}
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
                style={{ left: sidebarWidth, top: topOffset }}
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
            style={{
                left: sidebarWidth,
                top: topOffset,
                right: 0,
                bottom: 0,
            }}
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
