import { useEffect, useRef, useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBrowserUiStore, initializeBrowserEventSubscriptions, ensureBrowserViewsExist } from '../../stores/browserUiStore';
import { useTabStore } from '../../stores/tabStore';
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
    /**
     * B025: When true, disables -webkit-app-region: drag on the tab bar.
     * This prevents the drag region from intercepting clicks on the sidebar
     * overlay WebContentsView that floats above this component.
     */
    sidebarOverlayActive?: boolean;
}

// Heights for the chrome elements
const TAB_BAR_HEIGHT = 36;
const TOOLBAR_HEIGHT = 40;
const TOTAL_CHROME_HEIGHT = TAB_BAR_HEIGHT + TOOLBAR_HEIGHT;

/**
 * Container for the browser WebContentsView
 * Phase 2: Multi-Tab Browser (F038 integration)
 *
 * The actual web content is rendered by the main process WebContentsView,
 * positioned to match this component's bounds. This component:
 * 1. Displays multi-tab bar from tabStore
 * 2. Displays navigation toolbar from browserUiStore (active view state)
 * 3. Calculates and reports content bounds to main process
 * 4. Shows loading progress and error overlays
 * 5. Initializes both tabStore and browserUiStore on mount
 */
// Sidebar animation duration (must match CSS transition in Sidebar.module.css)
const SIDEBAR_ANIMATION_DURATION = 250;

export function BrowserArea({
    sidebarWidth,
    topOffset = 0,
    className,
    sidebarOverlayActive = false,
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

    // B023 fix: Use selectors to avoid re-rendering on every browser event.
    // Bare useBrowserUiStore()/useTabStore() subscribed to ALL state changes,
    // causing 100-300 unnecessary re-renders per page load from browser events.

    // browserUiStore: state (only re-renders when activeViewId changes)
    const activeViewId = useBrowserUiStore((state) => state.activeViewId);

    // browserUiStore: actions (stable references — useShallow prevents object identity re-renders)
    const {
        updateBounds,
        loadURL,
        goBack,
        goForward,
        reload,
        stop,
        clearError,
        registerView,
        unregisterView,
    } = useBrowserUiStore(useShallow((state) => ({
        updateBounds: state.updateBounds,
        loadURL: state.loadURL,
        goBack: state.goBack,
        goForward: state.goForward,
        reload: state.reload,
        stop: state.stop,
        clearError: state.clearError,
        registerView: state.registerView,
        unregisterView: state.unregisterView,
    })));

    // tabStore: state (re-renders when tabs/activeTab/init changes, NOT on every event)
    const {
        tabs: tabList,
        activeTabId,
        isInitialized: tabsInitialized,
        initError: tabsInitError,
    } = useTabStore(useShallow((state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        isInitialized: state.isInitialized,
        initError: state.initError,
    })));

    // tabStore: actions (stable references)
    const {
        initialize: initializeTabs,
        createTab,
        closeTab,
        switchTab,
        reorderTabs,
    } = useTabStore(useShallow((state) => ({
        initialize: state.initialize,
        createTab: state.createTab,
        closeTab: state.closeTab,
        switchTab: state.switchTab,
        reorderTabs: state.reorderTabs,
    })));

    // Get active view state from browserUiStore (for toolbar/loading/error display)
    // B018 fix: Use activeTabId as the view ID since tab.id === view.id
    const activeView = useBrowserUiStore((state) => {
        const viewId = state.activeViewId;
        if (!viewId) return null;
        return state.views.get(viewId) ?? null;
    });

    // Convert tabStore tabs to BrowserTab[] for the tab bar
    const tabs: BrowserTab[] = tabList.map((tab) => ({
        id: tab.id,
        title: tab.title || 'New Tab',
        faviconUrl: tab.faviconUrl,
        isLoading: tab.isLoading,
    }));

    // Initialization state - only depends on tabStore now (browserUiStore is driven by tab operations)
    const isInitialized = tabsInitialized;
    const initError = tabsInitError;

    // Calculate and send bounds to main process with debouncing to prevent flickering
    const sendBoundsImmediate = useCallback(() => {
        const viewId = activeViewId ?? activeTabId;
        if (!contentRef.current || !viewId) return;

        // Skip intermediate updates during sidebar animation to prevent flickering
        if (isAnimatingRef.current) return;

        const rect = contentRef.current.getBoundingClientRect();

        // Only update if we have valid dimensions
        if (rect.width > 0 && rect.height > 0) {
            const adjustedX = Math.round(rect.x) + sidebarWidth;
            const adjustedWidth = Math.round(rect.width) - sidebarWidth;

            const newBounds = {
                x: adjustedX,
                y: Math.round(rect.y),
                width: Math.max(adjustedWidth, 100),
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
    }, [activeViewId, activeTabId, updateBounds, sidebarWidth]);

    // Debounced version to prevent flickering during rapid sidebar toggling
    const sendBounds = useCallback(() => {
        if (boundsUpdateTimeoutRef.current) {
            clearTimeout(boundsUpdateTimeoutRef.current);
        }
        boundsUpdateTimeoutRef.current = setTimeout(() => {
            sendBoundsImmediate();
        }, 16);
    }, [sendBoundsImmediate]);

    // Initialize tab store and bridge event subscriptions on mount
    // B018 fix: No longer calls browserUiStore.initialize() independently.
    // Instead, tab operations drive view creation, and events bridge to both stores.
    // B021 fix: Uses cancellation flag to prevent stale async work after unmount
    // (React strict mode double-mounts components).
    useEffect(() => {
        let cancelled = false;
        let eventCleanup: (() => void) | undefined;

        const setup = async () => {
            // Set up event subscriptions that forward to BOTH stores
            eventCleanup = initializeBrowserEventSubscriptions((viewId, updates) => {
                useTabStore.getState().updateTabFromEvent(viewId, updates);
            });

            // If unmounted during setup (strict mode), clean up and bail
            if (cancelled) {
                eventCleanup();
                eventCleanup = undefined;
                return;
            }

            // Initialize tabStore (loads tabs from DB, creates default if empty)
            await initializeTabs();
            if (cancelled) return;

            // B020 fix: Ensure WebContentsViews exist in main process for all tabs.
            // On app restart, BrowserService has no views (freshly initialized).
            // This creates them. Idempotent: no-op if view already exists (first run).
            const { tabs: loadedTabs, activeTabId: activeId } = useTabStore.getState();
            await ensureBrowserViewsExist(loadedTabs, activeId);
            if (cancelled) return;

            // Register all loaded tabs as views in browserUiStore
            for (const tab of loadedTabs) {
                registerView(tab.id, tab.url);
            }

            // Set active view in browserUiStore to match active tab
            if (activeId) {
                useBrowserUiStore.setState({
                    activeViewId: activeId,
                    isInitialized: true,
                });
            }

            setIsReady(true);
        };

        setup();

        return () => {
            cancelled = true;
            if (eventCleanup) eventCleanup();
            if (boundsUpdateTimeoutRef.current) {
                clearTimeout(boundsUpdateTimeoutRef.current);
            }
        };
    }, [initializeTabs, registerView]);

    // Update bounds when container size changes
    useEffect(() => {
        if (!isReady) return;

        sendBounds();

        const handleResize = () => {
            requestAnimationFrame(sendBounds);
        };

        window.addEventListener('resize', handleResize);

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

        if (widthChanged) {
            isAnimatingRef.current = true;

            if (sidebarAnimationTimeoutRef.current) {
                clearTimeout(sidebarAnimationTimeoutRef.current);
            }

            sidebarAnimationTimeoutRef.current = setTimeout(() => {
                isAnimatingRef.current = false;
                lastBoundsRef.current = null;
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

    // Tab bar handlers - wired to tabStore with browserUiStore sync (B018 fix)
    const handleTabClick = useCallback(async (tabId: string) => {
        await switchTab(tabId);
        // Sync browserUiStore active view
        useBrowserUiStore.setState({ activeViewId: tabId });
    }, [switchTab]);

    const handleTabClose = useCallback(async (tabId: string) => {
        unregisterView(tabId);
        await closeTab(tabId);
        // After close, sync the new active tab's view
        const { activeTabId: newActiveId } = useTabStore.getState();
        if (newActiveId) {
            registerView(newActiveId, useTabStore.getState().tabs.find(t => t.id === newActiveId)?.url);
            useBrowserUiStore.setState({ activeViewId: newActiveId });
        }
    }, [closeTab, registerView, unregisterView]);

    const handleNewTab = useCallback(async () => {
        const newTabId = await createTab();
        if (newTabId) {
            // Register the new view in browserUiStore and set as active
            const newTab = useTabStore.getState().tabs.find(t => t.id === newTabId);
            registerView(newTabId, newTab?.url);
            useBrowserUiStore.setState({ activeViewId: newTabId });
        }
    }, [createTab, registerView]);

    const handleReorder = useCallback((orderedIds: string[]) => {
        reorderTabs(orderedIds);
    }, [reorderTabs]);

    // Toolbar handlers - wired to browserUiStore
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
            {/* Tab bar - driven by tabStore */}
            <BrowserTabBar
                tabs={tabs}
                activeTabId={activeTabId}
                onTabClick={handleTabClick}
                onTabClose={handleTabClose}
                onNewTab={handleNewTab}
                onReorder={handleReorder}
                className={styles.tabBar}
                sidebarOverlayActive={sidebarOverlayActive}
            />

            {/* Navigation toolbar - driven by browserUiStore */}
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

                {/* Placeholder when no view is active */}
                {!activeViewId && !activeTabId && (
                    <div className={styles.placeholder}>
                        <span>No browser view active</span>
                    </div>
                )}
            </div>
        </div>
    );
}
