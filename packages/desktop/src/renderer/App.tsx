import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    SpayceColors,
    SpaceItemType,
    ContextMenu,
    Sidebar,
    SpacesScreen,
    BrowserArea,
} from '@spayce/react-ui';
import { useClipboardStore, useInlineInputStore, useSelectionStore, useDragDropUiStore, useBrowserUiStore } from '@spayce/react-ui/stores';
import type { DropPosition, DragData } from '@spayce/react-ui/stores';
import { collectLinksRecursive, hasLinksRecursive, extractUrlsFromText } from '@spayce/react-ui/utils';
import type { SpaceItem, ContextMenuItem, Space, SidebarMode, SidebarTabId } from '@spayce/react-ui';
import * as LucideIcons from 'lucide-react';
import { useSpacesData } from './hooks/useSpacesData';
import { itemsApi } from './ipc/spacesApi';
import {
    usePersistedState,
    usePersistedExpandedIdsMap,
    STORAGE_KEYS,
} from '@spayce/react-ui';

// Helper to recursively find all pinned items from the entire tree
const findAllPinnedItems = (items: SpaceItem[]): SpaceItem[] => {
    const pinned: SpaceItem[] = [];
    const traverse = (itemList: SpaceItem[]) => {
        for (const item of itemList) {
            if (item.isPinned) {
                pinned.push(item);
            }
            if (item.children && item.children.length > 0) {
                traverse(item.children);
            }
        }
    };
    traverse(items);
    return pinned;
};

// Loading skeleton for spaces
function SpacesLoadingSkeleton(): React.ReactElement {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: SpayceColors.textSecondary,
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: `3px solid ${SpayceColors.borderSubtle}`,
                    borderTopColor: SpayceColors.primary,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px',
                }} />
                <p>Loading spaces...</p>
            </div>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// Error display component
function SpacesError({ error, onRetry }: { error: Error; onRetry: () => void }): React.ReactElement {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: SpayceColors.textSecondary,
        }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: SpayceColors.error, marginBottom: 8 }}>Failed to load spaces</h2>
                <p style={{ marginBottom: 16 }}>{error.message}</p>
                <button
                    onClick={onRetry}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: SpayceColors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                    }}
                >
                    Retry
                </button>
            </div>
        </div>
    );
}

// Helper to paste items - folders are pasted with all descendants, links are pasted alone
async function pasteItem(
    spaceId: string,
    parentId: string | null,
    sourceItem: SpaceItem
): Promise<void> {
    console.log('[F010-pasteItem] Creating item:', sourceItem.name, 'type:', sourceItem.type, 'in space:', spaceId, 'parent:', parentId);

    // Create new item with new ID
    const result = await itemsApi.create({
        spaceId,
        parentId: parentId || undefined,
        name: sourceItem.name,
        path: sourceItem.path,
        type: sourceItem.type,
    });

    console.log('[F010-pasteItem] itemsApi.create result:', result);

    // For folders, recursively paste all children to preserve folder structure
    if ((sourceItem.type === 'folder' || sourceItem.type === 'localFolder') &&
        result.success && result.data &&
        sourceItem.children && sourceItem.children.length > 0) {
        const newFolderId = result.data.id;
        console.log('[F010-pasteItem] Folder created with ID:', newFolderId, '- pasting', sourceItem.children.length, 'children');
        for (const child of sourceItem.children) {
            await pasteItem(spaceId, newFolderId, child);
        }
    }
}

// Helper to generate context menu items based on item type
// B001: Added context parameter to conditionally exclude Rename for pinned items in pins grid
function getContextMenuItems(item: SpaceItem, hasClipboard: boolean, context?: 'sidebar' | 'card' | 'pins-grid'): ContextMenuItem[] {
    const items: ContextMenuItem[] = [];

    if (item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder) {
        const isLocalFolder = item.type === SpaceItemType.localFolder;

        // Group 1: Creation actions
        items.push(
            { id: 'new_folder', label: 'New Folder', icon: LucideIcons.FolderPlus },
            { id: 'new_link', label: 'Add Link', icon: LucideIcons.Link },
            { id: 'divider1', label: '', icon: LucideIcons.Minus, isDivider: true },
        );

        // Group 2: Import actions (disabled for now)
        items.push(
            { id: 'import_folder', label: 'Import Local Folder', icon: LucideIcons.FolderOpen, isDisabled: true },
            { id: 'import_file', label: 'Import Local File', icon: LucideIcons.File, isDisabled: true },
            { id: 'divider2', label: '', icon: LucideIcons.Minus, isDivider: true },
        );

        // Group 3: Edit and clipboard actions
        items.push(
            { id: 'rename', label: 'Rename', icon: LucideIcons.Pencil },
            { id: 'copy_folder', label: 'Copy Folder', icon: LucideIcons.Copy },
        );

        // Conditionally add "Copy All Links" if folder has links
        if (hasLinksRecursive(item)) {
            items.push({ id: 'copy_links', label: 'Copy All Links', icon: LucideIcons.Link2 });
        }

        // Always show "Paste" - handler will check internal clipboard first, then system clipboard
        items.push({ id: 'paste', label: 'Paste', icon: LucideIcons.ClipboardPaste });

        items.push({ id: 'divider3', label: '', icon: LucideIcons.Minus, isDivider: true });

        // Group 4: Advanced actions
        // Refresh only for local folders
        if (isLocalFolder) {
            items.push({ id: 'refresh', label: 'Refresh', icon: LucideIcons.RefreshCw });
        }

        items.push(
            { id: 'open_workspace', label: 'Open in Workspace', icon: LucideIcons.PanelLeft, isDisabled: true },
            { id: 'delete', label: 'Delete', icon: LucideIcons.Trash2, isDestructive: true },
        );
    } else if (item.type === SpaceItemType.link) {
        // B001: Don't show rename for pinned items in pins grid
        if (context !== 'pins-grid') {
            items.push({ id: 'rename', label: 'Rename', icon: LucideIcons.Pencil });
        }
        items.push(
            { id: 'copy_link', label: 'Copy Link', icon: LucideIcons.Copy },
            { id: 'divider1', label: '', icon: LucideIcons.Minus, isDivider: true }
        );

        // Pin/Unpin based on current state
        if (item.isPinned) {
            items.push({ id: 'unpin', label: 'Unpin', icon: LucideIcons.PinOff });
        } else {
            items.push({ id: 'pin', label: 'Pin to Top', icon: LucideIcons.Pin });
        }

        items.push(
            { id: 'divider2', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'delete', label: 'Delete', icon: LucideIcons.Trash2, isDestructive: true }
        );
    }

    return items;
}

export function App(): React.ReactElement {
    // Use the data hook to fetch spaces from the database
    const {
        spaces,
        loading,
        error,
        refetch,
        setSpaces,
        createSpace,
        updateSpace,
        reorderSpaces,
    } = useSpacesData();

    // Independent selection states for sidebar and space cards (transient - not persisted)
    const [sidebarSelectedId, setSidebarSelectedId] = useState<string | null>(null);
    const [cardSelectedId, setCardSelectedId] = useState<string | null>(null);

    // B003: Persisted UI state - survives page refresh
    // Sidebar and SpacesScreen have independent active space indices
    const [sidebarActiveSpaceIndex, setSidebarActiveSpaceIndex] = usePersistedState<number>(
        STORAGE_KEYS.SIDEBAR_ACTIVE_SPACE_INDEX, 0
    );
    const [spacesScreenActiveSpaceIndex, setSpacesScreenActiveSpaceIndex] = usePersistedState<number>(
        STORAGE_KEYS.SPACES_SCREEN_ACTIVE_SPACE_INDEX, 0
    );
    const [sidebarMode, setSidebarMode] = usePersistedState<SidebarMode>(
        STORAGE_KEYS.SIDEBAR_MODE, 'fixed'
    );
    const [activeTab, setActiveTab] = usePersistedState<SidebarTabId>(
        STORAGE_KEYS.ACTIVE_TAB, 'spaces'
    );

    // FRESH APP START FIX: Start with sidebar collapsed in floating mode on fresh app start
    // Uses sessionStorage with timestamp to distinguish between fresh app start and page refresh.
    // In Electron dev mode, sessionStorage can persist across app restarts, so we use
    // a timestamp to detect stale sessions (> 5 seconds old = fresh start)
    const [freshStartOverrideActive, setFreshStartOverrideActive] = useState(() => {
        const SESSION_FLAG_KEY = 'spayce_session_started';
        const SESSION_TIMESTAMP_KEY = 'spayce_session_timestamp';
        const STALE_SESSION_THRESHOLD_MS = 5000; // 5 seconds - if session is older than this, treat as fresh start

        const storedTimestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
        const currentTimestamp = Date.now();

        // Check if this is a fresh start:
        // 1. No timestamp stored (first ever load)
        // 2. Timestamp is stale (app was restarted in Electron dev mode)
        const isFreshStart = !storedTimestamp ||
            (currentTimestamp - parseInt(storedTimestamp, 10)) > STALE_SESSION_THRESHOLD_MS;

        // Always update the timestamp to current time
        sessionStorage.setItem(SESSION_TIMESTAMP_KEY, String(currentTimestamp));
        sessionStorage.setItem(SESSION_FLAG_KEY, 'true');

        if (isFreshStart) {
            console.log('[App] Fresh app start detected - sidebar will start collapsed in floating mode');
            console.log('[App] (storedTimestamp:', storedTimestamp, ', age:', storedTimestamp ? currentTimestamp - parseInt(storedTimestamp, 10) : 'N/A', 'ms)');
            return true; // Override is active until user shows sidebar
        }
        console.log('[App] Page refresh detected - respecting persisted sidebar state');
        console.log('[App] (session age:', currentTimestamp - parseInt(storedTimestamp!, 10), 'ms)');
        return false; // No override on refresh
    });

    // Persisted sidebar visibility (stores user preference)
    const [persistedSidebarVisible, setPersistedSidebarVisible] = usePersistedState<boolean>(
        STORAGE_KEYS.SIDEBAR_VISIBLE, true
    );

    // Effective sidebar visibility: respects fresh start override
    // On fresh start + floating mode: start collapsed, override deactivates when user shows sidebar
    // On refresh or fixed mode: use persisted value
    const shouldOverrideToCollapsed = freshStartOverrideActive && sidebarMode === 'floating';
    const sidebarVisible = shouldOverrideToCollapsed ? false : persistedSidebarVisible;

    // Wrapper to update both the effective and persisted values
    // Also deactivates the fresh start override when user explicitly shows sidebar
    const setSidebarVisible = useCallback((visible: boolean | ((prev: boolean) => boolean)) => {
        const newValue = typeof visible === 'function' ? visible(persistedSidebarVisible) : visible;

        // Deactivate fresh start override when user shows sidebar
        if (newValue && freshStartOverrideActive) {
            console.log('[App] User showed sidebar - deactivating fresh start override');
            setFreshStartOverrideActive(false);
        }

        setPersistedSidebarVisible(newValue);
    }, [persistedSidebarVisible, setPersistedSidebarVisible, freshStartOverrideActive]);

    // Sidebar overlay state (Spec 020)
    // When in floating mode with browser tab, use WebContentsView overlay instead of React sidebar
    const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
    const prevUseOverlayMode = useRef(useOverlayMode);
    const prevSidebarMode = useRef(sidebarMode);

    // Track overlay transition state to prevent double sidebar
    const [isOverlayTransitioning, setIsOverlayTransitioning] = useState(false);
    const [overlayActuallyVisible, setOverlayActuallyVisible] = useState(false);
    const [isModeSwitch, setIsModeSwitch] = useState(false);

    // B003-FIX: Track if initial overlay sync has completed (STATE not ref for proper effect ordering)
    const [hasCompletedInitialSync, setHasCompletedInitialSync] = useState(false);

    // Track what the React sidebar visibility should be during mode switches
    // B003-FIX: When in overlay mode on mount, React sidebar should be hidden
    // (the overlay WebContentsView will show the sidebar instead)
    const [reactSidebarVisible, setReactSidebarVisible] = useState(() => {
        // On initial mount, if we're in overlay mode, React sidebar should be hidden
        const initialUseOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
        return initialUseOverlayMode ? false : sidebarVisible;
    });

    // B003: Focus context - persisted to maintain user's navigation context
    // Rule 0: Default to 'sidebar' on app open
    const [focusContext, setFocusContext] = usePersistedState<'sidebar' | 'spacesScreen'>(
        STORAGE_KEYS.FOCUS_CONTEXT, 'sidebar'
    );

    // B003: Sidebar expanded IDs map - persisted to maintain folder expansion state
    // Lifted to App level to persist across Sidebar remounts (caused by refetch)
    const [sidebarExpandedIdsMap, setSidebarExpandedIdsMap] = usePersistedExpandedIdsMap(
        STORAGE_KEYS.SIDEBAR_EXPANDED_IDS, new Map()
    );

    const [contextMenu, setContextMenu] = useState<{
        item: SpaceItem;
        spaceId: string;
        position: { x: number; y: number };
        context: 'sidebar' | 'card' | 'pins-grid';
    } | null>(null);

    // F034/F035: Root context menu state (for empty area clicks)
    const [rootContextMenu, setRootContextMenu] = useState<{
        spaceId: string;
        position: { x: number; y: number };
    } | null>(null);

    // Clipboard store for copy/paste functionality
    const clipboardStore = useClipboardStore();
    const hasClipboard = clipboardStore.hasItems();

    // Inline input store for rename and create functionality
    const {
        setSidebarRenameItemId,
        setCardRenameItemId,
        setSidebarInput,
        setCardInput,
    } = useInlineInputStore();

    // Browser visibility control - hide WebContentsView when not on browser tab
    const { setVisibility: setBrowserVisibility } = useBrowserUiStore();

    // B003: Validate persisted space indices when spaces change
    // Clamp indices to valid range if spaces were deleted
    useEffect(() => {
        if (spaces.length > 0) {
            if (sidebarActiveSpaceIndex >= spaces.length) {
                setSidebarActiveSpaceIndex(Math.max(0, spaces.length - 1));
            }
            if (spacesScreenActiveSpaceIndex >= spaces.length) {
                setSpacesScreenActiveSpaceIndex(Math.max(0, spaces.length - 1));
            }
        }
    }, [spaces.length, sidebarActiveSpaceIndex, spacesScreenActiveSpaceIndex, setSidebarActiveSpaceIndex, setSpacesScreenActiveSpaceIndex]);

    // Hide/show browser WebContentsView based on active tab and context menu state
    // WebContentsView is a native Electron view that renders on top of ALL React/HTML elements,
    // so we need to hide it when context menus are open to prevent clipping
    // 
    // B005 FIX: In fixed sidebar mode, context menus appear in the sidebar area (LEFT side)
    // which does NOT overlap with browser WebContentsView (RIGHT side). So we keep browser visible.
    // In floating/overlay mode, browser also stays visible (overlay handles z-index separately).
    // Only hide browser when context menu would actually overlap with browser area.
    useEffect(() => {
        // In fixed mode, sidebar is on LEFT, browser on RIGHT - no overlap with context menus
        const isFixedSidebarMode = sidebarMode === 'fixed';

        // In overlay mode (floating + browser tab), browser stays visible as backdrop
        // Context menus in overlay don't conflict with browser WebContentsView

        // B005: Keep browser visible in fixed mode (context menus don't overlap browser area)
        // Also keep visible in overlay mode (existing fix)
        const shouldShowBrowser =
            activeTab === 'browser' &&
            ((!contextMenu && !rootContextMenu) || useOverlayMode || isFixedSidebarMode);

        setBrowserVisibility(shouldShowBrowser);
    }, [activeTab, contextMenu, rootContextMenu, sidebarMode, useOverlayMode, setBrowserVisibility]);

    // Handle sidebar visibility changes (Rule 3 & 4)
    // Note: Overlay show/hide is handled automatically by the overlay visibility useEffect
    const handleSidebarVisibilityChange = useCallback((visible: boolean) => {
        setSidebarVisible(visible);

        // Update focus context when sidebar visibility changes
        if (sidebarMode === 'floating') {
            if (visible) {
                setFocusContext('sidebar');
            } else {
                if (activeTab === 'spaces') {
                    setFocusContext('spacesScreen');
                }
            }
        }
    }, [sidebarMode, activeTab]);

    // Sync reactSidebarVisible with sidebarVisible, except during overlay mode
    // B006-FIX: Always sync when not in overlay mode to fix drag-drop being blocked
    useEffect(() => {
        // B003-FIX: When in overlay mode, React sidebar should stay hidden
        if (useOverlayMode) {
            setReactSidebarVisible(false);
            return;
        }
        // B006-FIX: Always sync with sidebarVisible when not in overlay mode
        // Previously this was gated by !isModeSwitch, which could leave reactSidebarVisible
        // stale after tab switches, causing drag-drop events to be blocked
        setReactSidebarVisible(sidebarVisible);
    }, [sidebarVisible, isModeSwitch, useOverlayMode]);

    // B003-FIX: On initial mount, reset main process overlay state to ensure sync
    // This handles the case where renderer refreshes but main process overlay state is stale
    // FRESH START FIX: Also check freshStartOverrideActive to prevent showing on app start
    useEffect(() => {
        if (!window.electronAPI?.sidebarOverlay) return;
        if (hasCompletedInitialSync) return; // Only run once

        const syncOverlayOnMount = async () => {
            console.log('[App] Initial mount - syncing overlay state with main process');
            console.log('[App] useOverlayMode:', useOverlayMode, 'sidebarVisible:', sidebarVisible, 'freshStartOverrideActive:', freshStartOverrideActive);

            try {
                // Check main process overlay state
                const { isVisible: mainProcessVisible } = await window.electronAPI.sidebarOverlay.getVisibility();
                console.log('[App] Main process overlay visible:', mainProcessVisible);

                // FRESH START FIX: Never show on fresh app start in floating mode
                // The fresh start override takes precedence over persisted visibility
                const shouldShowOverlay = useOverlayMode && sidebarVisible && !freshStartOverrideActive;

                // If we're in overlay mode and sidebar should be visible
                if (shouldShowOverlay) {
                    // Ensure overlay is shown (handles case where main process already has it visible)
                    if (!mainProcessVisible) {
                        console.log('[App] Showing overlay (was hidden)');
                        await window.electronAPI.sidebarOverlay.show();
                    } else {
                        console.log('[App] Overlay already visible, no action needed');
                    }
                    setOverlayActuallyVisible(true);
                } else {
                    // If overlay is visible but shouldn't be, hide it
                    if (mainProcessVisible) {
                        console.log('[App] Hiding overlay (should not be visible, freshStartOverride:', freshStartOverrideActive, ')');
                        await window.electronAPI.sidebarOverlay.hideInstant();
                    }
                    setOverlayActuallyVisible(false);
                }

                // Mark initial sync as complete - triggers overlay visibility effect
                setHasCompletedInitialSync(true);
            } catch (error) {
                console.error('[App] Initial overlay sync error:', error);
                setHasCompletedInitialSync(true); // Still mark as complete to unblock
            }
        };

        syncOverlayOnMount();
    }, [useOverlayMode, sidebarVisible, hasCompletedInitialSync, freshStartOverrideActive]);

    // Handle overlay visibility based on useOverlayMode (Spec 020)
    // Hide overlay when not in overlay mode (fixed mode or non-browser tab)
    useEffect(() => {
        if (!window.electronAPI?.sidebarOverlay) return;
        // B003-FIX: Skip until initial sync is complete
        if (!hasCompletedInitialSync) return;

        const handleOverlayVisibility = async () => {
            // Detect if this is a transition OUT of overlay mode (to fixed or other tabs)
            const wasOverlayMode = prevUseOverlayMode.current;
            const wasSidebarMode = prevSidebarMode.current;
            const isTransitioningOut = wasOverlayMode === true && useOverlayMode === false;
            const isFloatingToFixed = wasSidebarMode === 'floating' && sidebarMode === 'fixed';

            // Set React sidebar visibility for mode transitions
            if (isFloatingToFixed) {
                // When switching to fixed mode, preserve current sidebar visibility
                setReactSidebarVisible(sidebarVisible);
            }

            try {
                // Build state payload
                const expandedIdsForSpace = Array.from(
                    sidebarExpandedIdsMap.get(spaces[sidebarActiveSpaceIndex]?.id) || []
                );

                const statePayload = {
                    spaces: spaces as unknown[],
                    activeSpaceId: spaces[sidebarActiveSpaceIndex]?.id || null,
                    activeSpaceIndex: sidebarActiveSpaceIndex,
                    selectedItemId: sidebarSelectedId,
                    expandedIds: expandedIdsForSpace,
                    sidebarMode,
                    activeTab,
                    userName: 'dishant ghai',
                    // FRESH START FIX: Disable auto-show on fresh app start
                    // This prevents sidebar from appearing when mouse is near left edge during startup
                    enableAutoShow: !freshStartOverrideActive,
                };

                // Handle different visibility scenarios
                if (useOverlayMode && sidebarVisible) {
                    // In overlay mode and sidebar should be visible - show it
                    window.electronAPI.sidebarOverlay.syncState(statePayload);
                    setIsOverlayTransitioning(true);
                    await window.electronAPI.sidebarOverlay.show();
                    setOverlayActuallyVisible(true);
                    setIsOverlayTransitioning(false);
                } else if (isTransitioningOut) {
                    // Transitioning out of overlay mode (pinning or tab change)
                    // React sidebar is now visible (handleModeToggle set reactSidebarVisible=true)
                    // Now safe to hide the overlay - this prevents flicker
                    setIsOverlayTransitioning(true);

                    // Sync state first to disable mouse tracking
                    window.electronAPI.sidebarOverlay.syncState(statePayload);

                    // Hide overlay instantly - React sidebar is already visible so no gap
                    await window.electronAPI.sidebarOverlay.hideInstant();

                    setOverlayActuallyVisible(false);
                    setIsOverlayTransitioning(false);
                } else {
                    // Normal hide with animation (user closed sidebar with X or Cmd+B)
                    window.electronAPI.sidebarOverlay.syncState(statePayload);
                    setIsOverlayTransitioning(true);
                    await window.electronAPI.sidebarOverlay.hide();
                    setOverlayActuallyVisible(false);
                    setIsOverlayTransitioning(false);
                }
            } catch (error) {
                console.error('[App] Overlay visibility error:', error);
                setOverlayActuallyVisible(false);
                setIsOverlayTransitioning(false);
            }

            // Update previous state
            prevUseOverlayMode.current = useOverlayMode;
            prevSidebarMode.current = sidebarMode;
        };

        handleOverlayVisibility();
    }, [hasCompletedInitialSync, useOverlayMode, sidebarVisible, sidebarMode, activeTab, spaces, sidebarActiveSpaceIndex, sidebarSelectedId, sidebarExpandedIdsMap]);

    // Sync state changes to sidebar overlay (Spec 020)
    // This runs whenever content changes (spaces, selections, expanded state, etc.)
    // FRESH START FIX: Wait for initial sync to complete before syncing state
    // This prevents mouse tracking from starting before we've decided initial visibility
    useEffect(() => {
        if (!window.electronAPI?.sidebarOverlay || !useOverlayMode) return;
        if (!hasCompletedInitialSync) return; // Don't sync until initial visibility is decided

        const expandedIdsForSpace = Array.from(
            sidebarExpandedIdsMap.get(spaces[sidebarActiveSpaceIndex]?.id) || []
        );

        window.electronAPI.sidebarOverlay.syncState({
            spaces: spaces as unknown[],
            activeSpaceId: spaces[sidebarActiveSpaceIndex]?.id || null,
            activeSpaceIndex: sidebarActiveSpaceIndex,
            selectedItemId: sidebarSelectedId,
            expandedIds: expandedIdsForSpace,
            sidebarMode,
            activeTab,
            userName: 'dishant ghai',
            // FRESH START FIX: Disable auto-show on fresh app start
            enableAutoShow: !freshStartOverrideActive,
        });
    }, [
        useOverlayMode,
        spaces,
        sidebarActiveSpaceIndex,
        sidebarSelectedId,
        sidebarExpandedIdsMap,
        sidebarMode,
        activeTab,
        hasCompletedInitialSync,
        freshStartOverrideActive,
    ]);

    // Keyboard shortcut: Cmd+B to toggle sidebar (Spec 020)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+B (Mac) or Ctrl+B (Windows/Linux) to toggle sidebar
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                e.preventDefault();
                handleSidebarVisibilityChange(!sidebarVisible);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [sidebarVisible, handleSidebarVisibilityChange]);

    const handleItemClick = (item: SpaceItem, spaceId: string) => {
        console.log('Item clicked:', item.name, 'in space:', spaceId);
        setSidebarSelectedId(item.id);
        setFocusContext('sidebar');
    };

    // Sidebar context menu handler
    const handleSidebarContextMenu = (item: SpaceItem, spaceId: string, event: React.MouseEvent) => {
        setSidebarSelectedId(item.id); // Focus the item when context menu opens
        setContextMenu({
            item,
            spaceId,
            position: { x: event.clientX, y: event.clientY },
            context: 'sidebar',
        });
    };

    // B001: Pins grid context menu handler - pins are references, not renameable
    const handlePinsGridContextMenu = (item: SpaceItem, spaceId: string, event: React.MouseEvent) => {
        setSidebarSelectedId(item.id);
        setContextMenu({
            item,
            spaceId,
            position: { x: event.clientX, y: event.clientY },
            context: 'pins-grid',
        });
    };

    // SpaceCard context menu handler
    const handleCardContextMenu = (item: SpaceItem, spaceId: string, event: React.MouseEvent) => {
        setCardSelectedId(item.id); // Focus the item when context menu opens
        setContextMenu({
            item,
            spaceId,
            position: { x: event.clientX, y: event.clientY },
            context: 'card',
        });
    };

    const handleContextMenuItemClick = async (actionId: string) => {
        if (!contextMenu) return;

        const { item, spaceId } = contextMenu;

        switch (actionId) {
            case 'new_folder': {
                // Trigger inline input for subfolder (same as hover action)
                if (contextMenu.context === 'sidebar') {
                    setSidebarInput({ spaceId, parentId: item.id, type: 'folder' });
                } else {
                    setCardInput({ spaceId, parentId: item.id, type: 'folder' });
                }
                break;
            }
            case 'add_link':
            case 'new_link': {
                // Trigger inline input for link (same as hover action)
                if (contextMenu.context === 'sidebar') {
                    setSidebarInput({ spaceId, parentId: item.id, type: 'link' });
                } else {
                    setCardInput({ spaceId, parentId: item.id, type: 'link' });
                }
                break;
            }
            case 'rename': {
                // Use inline rename instead of prompt dialog
                if (contextMenu.context === 'sidebar') {
                    setSidebarRenameItemId(item.id);
                } else {
                    setCardRenameItemId(item.id);
                }
                break;
            }
            case 'copy_folder': {
                // Copy folder to internal clipboard
                clipboardStore.copyItems([item], spaceId);
                break;
            }
            case 'copy_links': {
                // Recursively collect all links and copy to system clipboard
                const links = collectLinksRecursive(item);

                if (links.length > 0) {
                    // Copy URLs to system clipboard (newline separated)
                    const urls = links.map((link: SpaceItem) => link.path).join('\n');
                    try {
                        await window.electronAPI.clipboard.writeText(urls);
                        // Also copy to internal clipboard
                        clipboardStore.copyItems(links, spaceId);
                        console.log(`Copied ${links.length} link(s) to clipboard`);
                    } catch (err) {
                        console.error('Failed to copy links:', err);
                    }
                }
                break;
            }
            case 'paste': {
                // Paste items from clipboard into folder
                if (clipboardStore.hasItems()) {
                    try {
                        // Get clipboard items
                        const clipboardItems = clipboardStore.getItems();

                        // Paste each item recursively
                        for (const sourceItem of clipboardItems) {
                            await pasteItem(spaceId, item.id, sourceItem);
                        }

                        // Clear clipboard after successful paste
                        clipboardStore.clear();

                        await refetch(); // Refresh data
                    } catch (err) {
                        console.error('Failed to paste items:', err);
                    }
                } else {
                    // If internal clipboard empty, check system clipboard for URLs
                    try {
                        const text = await window.electronAPI.clipboard.readText();
                        const urls = extractUrlsFromText(text);

                        if (urls.length > 0) {
                            // Create links immediately (non-blocking)
                            for (const url of urls) {
                                const result = await itemsApi.create({
                                    spaceId,
                                    parentId: item.id,
                                    name: url,
                                    path: url,
                                    type: SpaceItemType.link,
                                });

                                // Fetch metadata asynchronously in background
                                if (result.success && result.data) {
                                    const itemId = result.data.id;

                                    window.electronAPI.metadata.extract(url).then(async (metadata) => {
                                        if (metadata?.success && metadata?.data) {
                                            // Update title if available
                                            if (metadata.data.title) {
                                                await window.electronAPI.items.rename(itemId, metadata.data.title);
                                            }
                                            // Save favicon data (base64) - bypasses CORS
                                            const faviconToSave = metadata.data.faviconData || metadata.data.faviconUrl;
                                            if (faviconToSave) {
                                                await window.electronAPI.items.updateMetadata(itemId, {
                                                    faviconUrl: faviconToSave,
                                                });
                                            }
                                            await refetch();
                                        }
                                    }).catch(() => {
                                        // Metadata fetch failed - keep URL as name
                                    });
                                }
                            }

                            await refetch(); // Refresh to show created links
                        }
                    } catch (err) {
                        console.error('Failed to paste from system clipboard:', err);
                    }
                }
                break;
            }
            case 'refresh': {
                // For local folders, refresh the folder contents
                if (item.type === SpaceItemType.localFolder) {
                    try {
                        await (window as any).electronAPI?.items?.refreshLocalFolder(item.id);
                        await refetch();
                        console.log('Local folder refreshed');
                    } catch (err) {
                        console.error('Failed to refresh local folder:', err);
                    }
                }
                break;
            }
            case 'copy_link': {
                // Copy link URL to system clipboard AND internal clipboard
                try {
                    await window.electronAPI.clipboard.writeText(item.path);
                    clipboardStore.copyItems([item], spaceId);
                    console.log('Link copied to clipboard');
                } catch (err) {
                    console.error('Failed to copy link:', err);
                }
                break;
            }
            case 'pin': {
                // Pin item to top
                const result = await (window as any).electronAPI?.items?.pin(item.id);
                if (result?.success) {
                    await refetch();
                }
                break;
            }
            case 'unpin': {
                // Unpin item
                const result = await (window as any).electronAPI?.items?.unpin(item.id);
                if (result?.success) {
                    await refetch();
                }
                break;
            }
            case 'delete':
            case 'remove': {
                // Only show confirmation for folders (which may have children)
                // Links can be deleted without confirmation
                const needsConfirmation = item.type === SpaceItemType.folder ||
                    item.type === SpaceItemType.localFolder;

                const shouldDelete = needsConfirmation
                    ? confirm(`Delete "${item.name}"?`)
                    : true;

                if (shouldDelete) {
                    const result = await (window as any).electronAPI?.items?.delete(item.id);
                    if (result?.success) {
                        await refetch();
                        console.log(`${item.type === SpaceItemType.link ? 'Link' : 'Folder'} deleted:`, item.name);
                    }
                }
                break;
            }
            case 'copy-url': {
                if (item.path) {
                    await (window as any).electronAPI?.clipboard?.writeText(item.path);
                }
                break;
            }
            case 'open-new-tab': {
                if (item.path) {
                    window.open(item.path, '_blank');
                }
                break;
            }
            default:
                console.log('Unhandled context menu action:', actionId, item.name);
        }

        setContextMenu(null);
    };

    const handleModeToggle = useCallback(() => {
        // Set mode switch flag IMMEDIATELY to disable transitions BEFORE re-render
        setIsModeSwitch(true);

        setSidebarMode((prev: SidebarMode) => {
            const newMode = prev === 'fixed' ? 'floating' : 'fixed';

            // When switching FROM fixed TO floating, collapse the sidebar
            // This matches Arc browser behavior: unpinning collapses the sidebar
            if (prev === 'fixed' && newMode === 'floating') {
                setSidebarVisible(false);
            }

            // When switching FROM floating TO fixed (pinning), show the sidebar
            // The sidebar was hidden in floating mode, needs to be visible in fixed mode
            if (prev === 'floating' && newMode === 'fixed') {
                setSidebarVisible(true);
                // Also set reactSidebarVisible directly to avoid timing gap with effect
                // This prevents the sidebar from being "locked" (pointerEvents: none)
                setReactSidebarVisible(true);
            }

            return newMode;
        });

        // Reset mode switch flag after render + one frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsModeSwitch(false);
            });
        });
    }, []);

    const handleAddFolder = async (spaceId: string, parentId?: string | null) => {
        // Use inline input store - determine context based on focus
        if (focusContext === 'sidebar') {
            setSidebarInput({ spaceId, parentId: parentId ?? null, type: 'folder' });
        } else {
            setCardInput({ spaceId, parentId: parentId ?? null, type: 'folder' });
        }
    };

    const handleAddLink = async (spaceId: string, parentId?: string | null) => {
        // Use inline input store - determine context based on focus
        if (focusContext === 'sidebar') {
            setSidebarInput({ spaceId, parentId: parentId ?? null, type: 'link' });
        } else {
            setCardInput({ spaceId, parentId: parentId ?? null, type: 'link' });
        }
    };

    const handleCreateItem = async (input: {
        spaceId: string;
        parentId: string | null;
        name: string;
        path: string;
        type: string;
        faviconUrl?: string | null;
    }) => {
        const result = await (window as any).electronAPI?.items?.create({
            spaceId: input.spaceId,
            parentId: input.parentId || undefined,
            name: input.name,
            path: input.path,
            type: input.type,
            faviconUrl: input.faviconUrl,
        });

        if (result?.success) {
            await refetch();

            // For links, fetch metadata asynchronously and update title + favicon
            if (input.type === 'link' && result.data?.id) {
                const itemId = result.data.id;
                (window as any).electronAPI?.metadata?.extract(input.path)
                    .then(async (metadata: any) => {
                        if (metadata?.success && metadata?.data) {
                            let needsRefetch = false;

                            // Update title if extracted
                            if (metadata.data.title && metadata.data.title !== input.name) {
                                await (window as any).electronAPI?.items?.rename(itemId, metadata.data.title);
                                needsRefetch = true;
                            }
                            // Update favicon if we got base64 data
                            if (metadata.data.faviconData) {
                                await (window as any).electronAPI?.items?.updateMetadata(itemId, {
                                    faviconUrl: metadata.data.faviconData,
                                });
                                needsRefetch = true;
                            }

                            // Only refetch if we actually updated something
                            if (needsRefetch) {
                                await refetch();
                            }
                        }
                    })
                    .catch((err: unknown) => {
                        console.error('Failed to fetch metadata for link:', err);
                        // Silently fail - item already created with URL as name
                    });
            }
        }
    };

    const handleRenameItem = async (itemId: string, newName: string) => {
        const result = await (window as any).electronAPI?.items?.rename(itemId, newName);

        if (result?.success) {
            await refetch();
        }
    };

    const handleCreateSpace = async (spaceData: {
        name: string;
        iconName: string;
        accentColor: string;
    }) => {
        const newSpace = await createSpace(spaceData);
        if (newSpace) {
            setSidebarActiveSpaceIndex(spaces.length);
            console.log('Created new space:', newSpace);
        }
    };

    const handleUpdateSpace = async (space: Space, spaceData: {
        name: string;
        iconName: string;
        accentColor: string;
    }) => {
        await updateSpace(space.id, spaceData);
        console.log('Updated space:', space.name, 'to', spaceData);
    };

    const handleSettingsClick = () => {
        console.log('Settings clicked');
    };

    const handleReorderSpaces = async (oldIndex: number, newIndex: number) => {
        console.log('[F036-App] handleReorderSpaces called:', oldIndex, '->', newIndex);
        console.log('[F036-App] Current spaces:', spaces.map(s => s.name));

        if (oldIndex === newIndex) {
            console.log('[F036-App] No change needed, indices are same');
            return;
        }

        // F036: Preserve selection by tracking space IDs before reorder
        const sidebarActiveSpaceId = spaces[sidebarActiveSpaceIndex]?.id;
        const spacesScreenActiveSpaceId = spaces[spacesScreenActiveSpaceIndex]?.id;
        console.log('[F036-App] Preserving selections - sidebar:', sidebarActiveSpaceId, 'screen:', spacesScreenActiveSpaceId);

        const newOrder = [...spaces];
        const [removed] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, removed);

        console.log('[F036-App] New order:', newOrder.map(s => s.name));
        console.log('[F036-App] Calling reorderSpaces API...');

        await reorderSpaces(newOrder.map(s => s.id));

        console.log('[F036-App] Reorder complete');

        // F036: After reorder, update indices to point to the same space IDs
        // Note: spaces array will update after refetch, so we use newOrder to calculate
        if (sidebarActiveSpaceId) {
            const newSidebarIndex = newOrder.findIndex(s => s.id === sidebarActiveSpaceId);
            if (newSidebarIndex !== -1) {
                console.log('[F036-App] Updating sidebar index:', sidebarActiveSpaceIndex, '->', newSidebarIndex);
                setSidebarActiveSpaceIndex(newSidebarIndex);
            }
        }

        if (spacesScreenActiveSpaceId) {
            const newScreenIndex = newOrder.findIndex(s => s.id === spacesScreenActiveSpaceId);
            if (newScreenIndex !== -1) {
                console.log('[F036-App] Updating screen index:', spacesScreenActiveSpaceIndex, '->', newScreenIndex);
                setSpacesScreenActiveSpaceIndex(newScreenIndex);
            }
        }
    };

    const getItemsByIds = useCallback((space: Space, ids: string[]): SpaceItem[] => {
        const items: SpaceItem[] = [];

        function findItems(node: SpaceItem) {
            if (ids.includes(node.id)) {
                items.push(node);
            }
            if (node.children) {
                node.children.forEach(findItems);
            }
        }

        space.rootItems.forEach(findItems);
        return items;
    }, []);

    // Get currently selected item based on focus context
    const getSelectedItem = useCallback((): SpaceItem | null => {
        const selectedId = focusContext === 'sidebar' ? sidebarSelectedId : cardSelectedId;
        if (!selectedId) return null;

        const activeSpaceIndex = focusContext === 'sidebar' ? sidebarActiveSpaceIndex : spacesScreenActiveSpaceIndex;
        const activeSpace = spaces[activeSpaceIndex];
        if (!activeSpace) return null;

        const items = getItemsByIds(activeSpace, [selectedId]);
        return items[0] || null;
    }, [focusContext, sidebarSelectedId, cardSelectedId, sidebarActiveSpaceIndex, spacesScreenActiveSpaceIndex, spaces, getItemsByIds]);

    // Handle copy selected items (Cmd+C / Ctrl+C)
    // Priority: multi-selection > keyboard-focused item (from Sidebar/SpacesScreen) > clicked selection
    // Hover state is ignored - only actual selection/focus matters
    // F033: Accepts optional spaceId for SpacesScreen calls
    const handleCopySelected = useCallback((keyboardFocusedId: string | null, spaceId?: string) => {
        console.log('[F033-App] handleCopySelected called!');
        console.log('[F033-App] keyboardFocusedId:', keyboardFocusedId);
        console.log('[F033-App] spaceId param:', spaceId);
        console.log('[F033-App] sidebarSelectedId (clicked):', sidebarSelectedId);

        // F033: Use provided spaceId if available (from SpacesScreen), otherwise determine from focus context
        let activeSpace: Space | undefined;
        let activeSpaceId: string | undefined;

        if (spaceId) {
            activeSpace = spaces.find(s => s.id === spaceId);
            activeSpaceId = spaceId;
        } else {
            const activeSpaceIndex = focusContext === 'sidebar' ? sidebarActiveSpaceIndex : spacesScreenActiveSpaceIndex;
            activeSpace = spaces[activeSpaceIndex];
            activeSpaceId = activeSpace?.id;
        }

        if (!activeSpace || !activeSpaceId) {
            console.error('[F010-App] ERROR: No active space or spaceId!');
            return;
        }

        // Check for multi-selection first (from selectionStore)
        const selectionState = useSelectionStore.getState();
        const selectedIds = selectionState.getSelectedItems();
        console.log('[F010-App] Multi-selection selectedIds:', selectedIds);

        if (selectedIds.length > 0) {
            // Multi-selection copy
            console.log('[F010-App] Using multi-selection path');
            const items = getItemsByIds(activeSpace, selectedIds);
            if (items.length > 0) {
                console.log('[F010-App] Copying', items.length, 'items:', items.map(i => i.name));
                clipboardStore.copyItems(items, activeSpaceId);

                // If single link, also copy URL to system clipboard
                if (items.length === 1 && items[0].type === 'link') {
                    window.electronAPI.clipboard.writeText(items[0].path);
                }
            }
        } else {
            // Single selection - use keyboard-focused item (priority over clicked selection)
            const itemIdToCopy = keyboardFocusedId || sidebarSelectedId;
            console.log('[F010-App] Using single selection - itemIdToCopy:', itemIdToCopy);

            if (itemIdToCopy) {
                const items = getItemsByIds(activeSpace, [itemIdToCopy]);
                const selectedItem = items[0];
                console.log('[F010-App] Found item to copy:', selectedItem?.name, selectedItem?.type);

                if (selectedItem) {
                    clipboardStore.copyItems([selectedItem], activeSpaceId);

                    // If link, also copy URL to system clipboard
                    if (selectedItem.type === 'link') {
                        console.log('[F010-App] Copying link URL to system clipboard:', selectedItem.path);
                        window.electronAPI.clipboard.writeText(selectedItem.path);
                    }
                } else {
                    console.warn('[F010-App] Item not found for ID:', itemIdToCopy);
                }
            } else {
                console.warn('[F010-App] No item to copy - no keyboard focus or selection');
            }
        }

        // Verify clipboard state after copy
        console.log('[F033-App] Clipboard items after copy:', clipboardStore.getItems().map(i => i.name));
    }, [focusContext, sidebarActiveSpaceIndex, spacesScreenActiveSpaceIndex, spaces, getItemsByIds, clipboardStore, sidebarSelectedId]);

    // Handle paste (Cmd+V / Ctrl+V)
    // Supports both internal clipboard (SpaceItems) and system clipboard (URLs)
    // Uses keyboard-focused item as paste target (if it's a folder)
    // F033: Accepts optional spaceId for SpacesScreen calls
    const handlePasteToSelected = useCallback(async (keyboardFocusedId: string | null, spaceId?: string) => {
        console.log('[F033-App] handlePasteToSelected called!');
        console.log('[F033-App] keyboardFocusedId:', keyboardFocusedId);
        console.log('[F033-App] spaceId param:', spaceId);

        // F033: Use provided spaceId if available (from SpacesScreen), otherwise determine from focus context
        let activeSpace: Space | undefined;
        let activeSpaceId: string | undefined;

        if (spaceId) {
            activeSpace = spaces.find(s => s.id === spaceId);
            activeSpaceId = spaceId;
        } else {
            const activeSpaceIndex = focusContext === 'sidebar' ? sidebarActiveSpaceIndex : spacesScreenActiveSpaceIndex;
            activeSpace = spaces[activeSpaceIndex];
            activeSpaceId = activeSpace?.id;
        }

        if (!activeSpace || !activeSpaceId) {
            console.error('[F010-App] ERROR: No active space for paste!');
            return;
        }

        // Get the target item - use keyboard-focused item if available, else clicked selection
        const targetItemId = keyboardFocusedId || sidebarSelectedId;
        let targetItem: SpaceItem | null = null;
        if (targetItemId) {
            const items = getItemsByIds(activeSpace, [targetItemId]);
            targetItem = items[0] || null;
        }

        console.log('[F010-App] Paste - targetItem:', targetItem?.name, targetItem?.type);
        console.log('[F010-App] Paste - clipboardStore.hasItems():', clipboardStore.hasItems());

        // If folder selected, paste into it; otherwise paste at root
        const targetParentId = targetItem?.type === 'folder' || targetItem?.type === 'localFolder'
            ? targetItem.id
            : null;
        console.log('[F010-App] Paste - targetParentId:', targetParentId);

        // First try internal clipboard (SpaceItems)
        if (clipboardStore.hasItems()) {
            console.log('[F010-App] Pasting from internal clipboard');
            try {
                const clipboardItems = clipboardStore.getItems();
                console.log('[F010-App] Clipboard items to paste:', clipboardItems.map(i => ({ name: i.name, type: i.type })));

                for (const sourceItem of clipboardItems) {
                    console.log('[F010-App] Pasting item:', sourceItem.name);
                    await pasteItem(activeSpaceId, targetParentId, sourceItem);
                    console.log('[F010-App] Item pasted successfully:', sourceItem.name);
                }

                console.log('[F010-App] Clearing clipboard and refetching...');
                clipboardStore.clear();
                await refetch();
                console.log('[F010-App] Paste completed successfully!');
            } catch (err) {
                console.error('[F010-App] Failed to paste items:', err);
            }
            return;
        }

        // Fallback to system clipboard (external URLs)
        try {
            const clipboardText = await window.electronAPI.clipboard.readText();
            if (clipboardText) {
                const text = clipboardText.trim();
                // Check if it looks like a URL
                const isUrl = text.startsWith('http://') ||
                    text.startsWith('https://') ||
                    (text.includes('.') && !text.includes(' ') && text.length > 3);

                if (isUrl) {
                    const url = text.startsWith('http://') || text.startsWith('https://')
                        ? text
                        : `https://${text}`;

                    // Extract domain name for link name
                    let name = text;
                    try {
                        const urlObj = new URL(url);
                        name = urlObj.hostname;
                    } catch {
                        // Keep original text as name
                    }

                    // Create new link from URL
                    await itemsApi.create({
                        spaceId: activeSpaceId,
                        parentId: targetParentId ?? undefined,
                        name,
                        path: url,
                        type: 'link',
                        faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=32`,
                    });

                    await refetch();
                }
            }
        } catch (err) {
            console.error('Failed to paste from system clipboard:', err);
        }
    }, [focusContext, sidebarActiveSpaceIndex, spacesScreenActiveSpaceIndex, spaces, clipboardStore, refetch, sidebarSelectedId, getItemsByIds]);

    // F034/F035: Handle root context menu for Space Cards and Sidebar
    const handleRootContextMenu = useCallback((spaceId: string, event: React.MouseEvent) => {
        const space = spaces.find(s => s.id === spaceId);
        if (!space) return;

        setRootContextMenu({
            spaceId,
            position: { x: event.clientX, y: event.clientY },
        });
    }, [spaces]);

    // Get root context menu items
    const getRootContextMenuItems = useCallback((spaceId: string) => {
        const hasClipboard = clipboardStore.hasItems();
        const items: ContextMenuItem[] = [
            { id: 'new-folder', label: 'New Folder', icon: LucideIcons.FolderPlus },
            { id: 'new-link', label: 'Add Link', icon: LucideIcons.Link },
            { id: 'divider1', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'import-folder', label: 'Import Local Folder', icon: LucideIcons.FolderInput, isDisabled: true },
            { id: 'import-file', label: 'Import Local File', icon: LucideIcons.FileInput, isDisabled: true },
        ];

        if (hasClipboard) {
            items.push(
                { id: 'divider2', label: '', icon: LucideIcons.Minus, isDivider: true },
                { id: 'paste', label: 'Paste', icon: LucideIcons.ClipboardPaste },
            );
        }

        return items;
    }, [clipboardStore]);

    // Handle root context menu actions
    const handleRootContextMenuAction = useCallback(async (actionId: string) => {
        if (!rootContextMenu) return;
        const { spaceId } = rootContextMenu;

        switch (actionId) {
            case 'new-folder':
                handleAddFolder(spaceId, null);
                break;
            case 'new-link':
                handleAddLink(spaceId, null);
                break;
            case 'import-folder':
                console.log('Import folder at root - not yet implemented');
                break;
            case 'import-file':
                console.log('Import file at root - not yet implemented');
                break;
            case 'paste':
                // Paste to root level (parentId = null)
                if (clipboardStore.hasItems()) {
                    try {
                        const clipboardItems = clipboardStore.getItems();
                        for (const sourceItem of clipboardItems) {
                            await pasteItem(spaceId, null, sourceItem);
                        }
                        clipboardStore.clear();
                        await refetch();
                    } catch (err) {
                        console.error('Failed to paste items to root:', err);
                    }
                }
                break;
        }
        setRootContextMenu(null);
    }, [rootContextMenu, clipboardStore, handleAddFolder, handleAddLink, pasteItem, refetch]);

    // F022: Handle pinning an item to the pins grid
    // Uses optimistic pattern: return immediately, persist in background
    const handlePinItem = useCallback(async (itemId: string, position: number, spaceId: string): Promise<boolean> => {
        console.log('[F022] Pin item:', itemId, 'at position:', position, 'in space:', spaceId);

        // Fire-and-forget: persist in background, refetch will update UI
        itemsApi.pin(itemId, position)
            .then(result => {
                if (result?.success) {
                    console.log('[F022] ✓ Item pinned successfully');
                    // Background refetch - don't await
                    refetch();
                } else {
                    console.error('[F022] ✗ Failed to pin item:', result);
                    refetch(); // Revert on error
                }
            })
            .catch(error => {
                console.error('[F022] ✗ Error pinning item:', error);
                refetch(); // Revert on error
            });

        // Return immediately for responsive UI
        return true;
    }, [refetch]);

    // F022/F023: Handle reordering pins in the grid
    // Uses optimistic pattern: update UI immediately, persist in background
    const handleReorderPins = useCallback((oldIndex: number, newIndex: number, spaceId: string): void => {
        // Find the space and ALL its pinned items (including nested in folders)
        const space = spaces.find(s => s.id === spaceId);
        if (!space) return;

        // Use recursive search to match Sidebar's view of pinned items
        const pinnedItems = findAllPinnedItems(space.rootItems)
            .sort((a, b) => (a.pinPosition ?? 0) - (b.pinPosition ?? 0));

        if (oldIndex < 0 || oldIndex >= pinnedItems.length) return;
        if (newIndex < 0 || newIndex >= pinnedItems.length) return;
        if (oldIndex === newIndex) return;

        // Calculate new order of IDs using proper array move logic
        const orderedIds = pinnedItems.map(p => p.id);
        // Remove item from old position
        const [movedId] = orderedIds.splice(oldIndex, 1);
        // Insert at new position (array is now shorter by 1, so newIndex is correct for final position)
        orderedIds.splice(newIndex, 0, movedId);

        console.log('[F023] Reorder pins:', oldIndex, '->', newIndex, 'new order:', orderedIds);

        // F023: Optimistic UI update - update local state immediately
        // Recursively update pinPosition for all pinned items (including nested)
        const updateItemsRecursively = (items: SpaceItem[]): SpaceItem[] => {
            return items.map(item => {
                let updatedItem = item;
                if (item.isPinned) {
                    const newPosition = orderedIds.indexOf(item.id);
                    if (newPosition !== -1) {
                        updatedItem = { ...item, pinPosition: newPosition };
                    }
                }
                if (updatedItem.children && updatedItem.children.length > 0) {
                    updatedItem = { ...updatedItem, children: updateItemsRecursively(updatedItem.children) };
                }
                return updatedItem;
            });
        };

        setSpaces(prevSpaces => prevSpaces.map(s => {
            if (s.id !== spaceId) return s;
            return {
                ...s,
                rootItems: updateItemsRecursively(s.rootItems),
            };
        }));

        // Fire-and-forget: persist in background
        itemsApi.reorderPins(spaceId, orderedIds)
            .then(result => {
                if (result?.success) {
                    console.log('[F023] ✓ Pins reordered successfully');
                } else {
                    console.error('[F023] ✗ Failed to reorder pins:', result);
                    refetch(); // Revert on error
                }
            })
            .catch(error => {
                console.error('[F023] ✗ Error reordering pins:', error);
                refetch(); // Revert on error
            });
    }, [spaces, refetch]);

    // F030: Handle cross-card drag-drop (move items between space cards)
    const handleCrossCardMove = useCallback(async (dragData: DragData, targetSpaceId: string) => {
        console.log('[F030] ========== CROSS-CARD MOVE START ==========');
        console.log('[F030] Source space:', dragData.spaceId);
        console.log('[F030] Target space:', targetSpaceId);

        // Get all items to move (multi-select or single)
        const itemsToMove = dragData.items && dragData.items.length > 0 ? dragData.items : [dragData.item];
        console.log('[F030] Items to move:', itemsToMove.map((i: SpaceItem) => i.name).join(', '));

        // Move each item to target space root
        for (const item of itemsToMove) {
            console.log('[F030] Moving item:', item.name, 'to space:', targetSpaceId);
            const result = await itemsApi.move(item.id, targetSpaceId, undefined, undefined);
            if (result?.success) {
                console.log('[F030] ✓ Item moved successfully:', item.name);
            } else {
                console.error('[F030] ✗ Failed to move item:', item.name, result);
            }
        }

        console.log('[F030] ========== CROSS-CARD MOVE END ==========');

        // Refresh data to update both source and target spaces
        await refetch();
    }, [refetch]);

    // Handle drag-drop item movement (supports multi-select F020)
    const dragDropStore = useDragDropUiStore();
    const selectionStore = useSelectionStore();
    const handleItemDrop = useCallback(async (targetId: string, _targetId2: string, position: DropPosition, spaceId: string, externalDragData?: any) => {
        // Story B002: Use dragData from overlay if provided, otherwise use main renderer's store
        const dragData = externalDragData || dragDropStore.dragData;
        if (!dragData) {
            console.error('[Drop] No drag data available');
            return;
        }

        // F020: Get all items to move (multi-select or single)
        const itemsToMove = dragData.items && dragData.items.length > 0 ? dragData.items : [dragData.item];
        const isMultiDrag = itemsToMove.length > 1;

        console.log('[Drop] ========== DROP OPERATION START ==========');
        console.log('[Drop] Source:', dragData.source);
        console.log('[Drop] Items to move:', itemsToMove.length, isMultiDrag ? '(multi-select)' : '(single)');
        console.log('[Drop] Items:', itemsToMove.map(i => i.name).join(', '));
        console.log('[Drop] Target:', targetId, 'Position:', position);

        // If dragging from pins grid, unpin items first
        const isFromPinsGrid = dragData.source === 'pins-grid';
        if (isFromPinsGrid) {
            console.log('[Drop] Unpinning items from pins grid');
            for (const item of itemsToMove) {
                if (item.isPinned) {
                    const result = await itemsApi.unpin(item.id);
                    if (!result?.success) {
                        console.error('[Drop] Failed to unpin item:', item.name);
                    }
                }
            }
        }

        // Find item info including parent, siblings, and index
        const findItemInfo = (items: SpaceItem[], itemId: string, parentId: string | null = null): { item: SpaceItem; parent: string | null; siblings: SpaceItem[]; index: number } | undefined => {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.id === itemId) {
                    return { item, parent: parentId, siblings: items, index: i };
                }
                if (item.children) {
                    const found = findItemInfo(item.children, itemId, item.id);
                    if (found) return found;
                }
            }
            return undefined;
        };

        // F030: Check if this is a cross-space drop
        const isCrossSpaceDrop = dragData.spaceId !== spaceId;
        console.log('[Drop] Cross-space drop:', isCrossSpaceDrop);
        console.log('[Drop] Source space:', dragData.spaceId, 'Target space:', spaceId);

        const targetSpace = spaces.find(s => s.id === spaceId);
        if (!targetSpace) {
            console.error('[Drop] Target space not found:', spaceId);
            return;
        }

        // Find target item info in target space
        const targetInfo = findItemInfo(targetSpace.rootItems, targetId);
        if (!targetInfo) {
            console.error('[Drop] Target item not found:', targetId);
            return;
        }

        // F030: For cross-space drops, skip validation in source space
        // Just verify items exist in dragData
        if (isCrossSpaceDrop) {
            console.log('[Drop] Cross-space drop - using items from dragData directly');
            // Items are already validated in dragData, no need to find them in source space
        } else {
            // Same-space drop: validate dragged item exists in target space
            const firstItem = itemsToMove[0];
            const draggedInfo = findItemInfo(targetSpace.rootItems, firstItem.id);
            if (!draggedInfo) {
                console.error('[Drop] First dragged item not found in tree:', firstItem.id);
                return;
            }
            console.log('[Drop] First item current parent:', draggedInfo.parent, 'index:', draggedInfo.index);
        }

        console.log('[Drop] Target item parent:', targetInfo.parent, 'index:', targetInfo.index);

        // Calculate target parent and position based on drop position
        let targetParentId: string | null = null;
        let toPosition = 0;

        if (position === 'inside') {
            // Drop inside folder - becomes first child
            targetParentId = targetId;
            toPosition = 0;
            console.log('[Drop] Inside drop: inserting at position 0');
        } else {
            // Drop before/after - same parent as target
            targetParentId = targetInfo.parent;

            if (position === 'before') {
                toPosition = targetInfo.index;
                // F030: For same-space drops, adjust for removal shifting indices
                if (!isCrossSpaceDrop) {
                    const firstItem = itemsToMove[0];
                    const draggedInfo = findItemInfo(targetSpace.rootItems, firstItem.id);
                    const isSameParent = draggedInfo?.parent === targetParentId;
                    if (isSameParent && draggedInfo && draggedInfo.index < targetInfo.index) {
                        toPosition = targetInfo.index - 1;
                        console.log('[Drop] Before: Adjusted for same-parent move:', toPosition);
                    } else {
                        console.log('[Drop] Before: Position:', toPosition);
                    }
                } else {
                    console.log('[Drop] Before (cross-space): Position:', toPosition);
                }
            } else {
                // after
                toPosition = targetInfo.index + 1;
                // F030: For same-space drops, adjust for removal shifting indices
                if (!isCrossSpaceDrop) {
                    const firstItem = itemsToMove[0];
                    const draggedInfo = findItemInfo(targetSpace.rootItems, firstItem.id);
                    const isSameParent = draggedInfo?.parent === targetParentId;
                    if (isSameParent && draggedInfo && draggedInfo.index < targetInfo.index) {
                        // removal shifts indices, so final position is targetIndex (not +1)
                        toPosition = targetInfo.index;
                        console.log('[Drop] After: Adjusted for same-parent move:', toPosition);
                    } else {
                        console.log('[Drop] After: Position:', toPosition);
                    }
                } else {
                    console.log('[Drop] After (cross-space): Position:', toPosition);
                }
            }
        }

        console.log('[Drop] Final calculation - Parent:', targetParentId, 'Position:', toPosition);

        // F020: Move all items (multi-select support)
        // Move items in sequence, adjusting position for each subsequent item
        let currentPosition = toPosition;
        let allSucceeded = true;

        for (let i = 0; i < itemsToMove.length; i++) {
            const itemToMove = itemsToMove[i];
            console.log(`[Drop] Moving item ${i + 1}/${itemsToMove.length}: ${itemToMove.name} to position ${currentPosition}`);

            const result = await itemsApi.move(itemToMove.id, spaceId, targetParentId || undefined, currentPosition);
            if (result?.success) {
                console.log(`[Drop] ✓ Item ${itemToMove.name} moved successfully`);
                // Increment position for next item so they stay in order
                currentPosition++;
            } else {
                console.error(`[Drop] ✗ Failed to move item ${itemToMove.name}:`, result);
                allSucceeded = false;
            }
        }

        if (allSucceeded) {
            console.log('[Drop] ✓ All items moved successfully');
            // Set flash item to highlight the first dropped item
            dragDropStore.setFlashItem(itemsToMove[0].id);
        } else {
            console.error('[Drop] ✗ Some items failed to move');
        }

        // F020: Clear selection after drop
        selectionStore.clearSelection();

        console.log('[Drop] ========== DROP OPERATION END ==========');

        // Refetch to update UI with new data
        refetch();
    }, [dragDropStore, selectionStore, spaces, refetch]);

    // Handle Arborist drag-drop item movement (new implementation)
    // Arborist computes the position, we just persist to backend
    const handleItemMoveArborist = useCallback(async (
        draggedItemId: string,
        newParentId: string | null,
        newIndex: number,
        spaceId: string
    ): Promise<boolean> => {
        console.log('[Arborist Move] ========== MOVE OPERATION START ==========');
        console.log('[Arborist Move] Item:', draggedItemId);
        console.log('[Arborist Move] New Parent:', newParentId);
        console.log('[Arborist Move] New Index:', newIndex);
        console.log('[Arborist Move] Space:', spaceId);

        try {
            // Call move API - Arborist already computed the correct position
            const result = await itemsApi.move(
                draggedItemId,
                spaceId,
                newParentId || undefined,
                newIndex
            );

            if (result?.success) {
                console.log('[Arborist Move] ✓ Backend update successful');
                console.log('[Arborist Move] ========== MOVE OPERATION END ==========');

                // Refresh data to sync UI with backend
                await refetch();
                return true;
            } else {
                console.error('[Arborist Move] ✗ Backend update failed:', result);
                console.log('[Arborist Move] ========== MOVE OPERATION END ==========');

                // Refresh to rollback UI to backend state
                await refetch();
                return false;
            }
        } catch (error) {
            console.error('[Arborist Move] ✗ Error:', error);
            console.log('[Arborist Move] ========== MOVE OPERATION END ==========');

            // Refresh to rollback UI to backend state
            await refetch();
            return false;
        }
    }, [refetch]);

    // Handle actions from sidebar overlay (Spec 020)
    // This must be AFTER all handler functions are defined
    useEffect(() => {
        if (!window.electronAPI?.sidebarOverlay) return;

        const unsubscribe = window.electronAPI.sidebarOverlay.onAction((action: any) => {
            console.log('[App] Overlay action received:', action.type, action.payload);

            switch (action.type) {
                case 'SELECT_SPACE':
                    setSidebarActiveSpaceIndex(action.payload.index);
                    setFocusContext('sidebar');
                    break;

                case 'TAB_CHANGE':
                    setActiveTab(action.payload.tab);
                    break;

                case 'MODE_TOGGLE':
                    handleModeToggle();
                    break;

                case 'ITEM_CLICK':
                    // Story B002: Clear inline input state before selection
                    clearSidebarInput();
                    setSidebarRenameItemId(null);
                    setSidebarSelectedId(action.payload.itemId);
                    setFocusContext('sidebar');
                    break;

                case 'ITEM_CONTEXT_MENU':
                    // Find item and trigger context menu
                    {
                        // Story B002: Clear inline input state before opening context menu
                        clearSidebarInput();
                        setSidebarRenameItemId(null);

                        const space = spaces.find((s) => s.id === action.payload.spaceId);
                        if (space) {
                            const findItem = (items: SpaceItem[]): SpaceItem | null => {
                                for (const item of items) {
                                    if (item.id === action.payload.itemId) return item;
                                    if (item.children) {
                                        const found = findItem(item.children);
                                        if (found) return found;
                                    }
                                }
                                return null;
                            };
                            const item = findItem(space.rootItems);
                            if (item) {
                                setSidebarSelectedId(item.id);
                                setContextMenu({
                                    item,
                                    spaceId: action.payload.spaceId,
                                    position: { x: action.payload.x, y: action.payload.y },
                                    context: 'sidebar',
                                });
                            }
                        }
                    }
                    break;

                case 'PINNED_ITEM_CONTEXT_MENU':
                    // Same as ITEM_CONTEXT_MENU but with pins-grid context
                    {
                        // Story B002: Clear inline input state before opening context menu
                        clearSidebarInput();
                        setSidebarRenameItemId(null);

                        const space = spaces.find((s) => s.id === action.payload.spaceId);
                        if (space) {
                            const findItem = (items: SpaceItem[]): SpaceItem | null => {
                                for (const item of items) {
                                    if (item.id === action.payload.itemId) return item;
                                    if (item.children) {
                                        const found = findItem(item.children);
                                        if (found) return found;
                                    }
                                }
                                return null;
                            };
                            const item = findItem(space.rootItems);
                            if (item) {
                                setSidebarSelectedId(item.id);
                                setContextMenu({
                                    item,
                                    spaceId: action.payload.spaceId,
                                    position: { x: action.payload.x, y: action.payload.y },
                                    context: 'pins-grid',
                                });
                            }
                        }
                    }
                    break;

                case 'CREATE_SPACE':
                    handleCreateSpace(action.payload);
                    break;

                case 'ADD_FOLDER':
                    handleAddFolder(action.payload.spaceId);
                    break;

                case 'ADD_LINK':
                    handleAddLink(action.payload.spaceId);
                    break;

                case 'CREATE_ITEM':
                    handleCreateItem(action.payload);
                    break;

                case 'RENAME_ITEM':
                    handleRenameItem(action.payload.itemId, action.payload.newName);
                    break;

                case 'EDIT_SPACE':
                    {
                        const space = spaces.find((s) => s.id === action.payload.spaceId);
                        if (space) {
                            handleUpdateSpace(space, {
                                name: action.payload.name,
                                iconName: action.payload.iconName,
                                accentColor: action.payload.accentColor,
                            });
                        }
                    }
                    break;

                case 'SETTINGS_CLICK':
                    handleSettingsClick();
                    break;

                case 'COPY_SELECTED':
                    handleCopySelected(action.payload.focusedItemId);
                    break;

                case 'PASTE_TO_SELECTED':
                    handlePasteToSelected(action.payload.focusedItemId);
                    break;

                case 'ITEM_DROP':
                    // Story B002: Pass dragData from overlay if provided
                    handleItemDrop(
                        action.payload.itemId,
                        action.payload.targetId,
                        action.payload.position,
                        action.payload.spaceId,
                        action.payload.dragData
                    );
                    break;

                case 'ITEM_MOVE_ARBORIST':
                    handleItemMoveArborist(
                        action.payload.draggedItemId,
                        action.payload.newParentId,
                        action.payload.newIndex,
                        action.payload.spaceId
                    );
                    break;

                case 'ROOT_CONTEXT_MENU':
                    // Story B002: Clear inline input state before opening root context menu
                    clearSidebarInput();
                    setSidebarRenameItemId(null);

                    setRootContextMenu({
                        spaceId: action.payload.spaceId,
                        position: { x: action.payload.x, y: action.payload.y },
                    });
                    break;

                case 'REORDER_SPACES':
                    handleReorderSpaces(action.payload.oldIndex, action.payload.newIndex);
                    break;

                case 'PIN_ITEM':
                    handlePinItem(action.payload.itemId, action.payload.position, action.payload.spaceId);
                    break;

                case 'REORDER_PINS':
                    handleReorderPins(action.payload.oldIndex, action.payload.newIndex, action.payload.spaceId);
                    break;

                case 'EXPANDED_IDS_CHANGE':
                    // Update expanded IDs from overlay
                    {
                        const activeSpaceId = spaces[sidebarActiveSpaceIndex]?.id;
                        if (activeSpaceId) {
                            setSidebarExpandedIdsMap((prev) => {
                                const newMap = new Map(prev);
                                newMap.set(activeSpaceId, new Set(action.payload.expandedIds));
                                return newMap;
                            });
                        }
                    }
                    break;

                case 'FOCUS_CHANGE':
                    // Update focus context when sidebar overlay gains focus
                    if (action.payload.hasFocus) {
                        setFocusContext('sidebar');
                    }
                    break;

                case 'CLEAR_INLINE_STATE':
                    // Clear inline input state when requested by overlay (Story B002)
                    console.log('[App] Clearing inline input state');
                    clearSidebarInput();
                    setSidebarRenameItemId(null);
                    break;

                case 'CONTEXT_MENU_ACTION':
                    // Handle context menu actions forwarded from overlay (Story B002)
                    {
                        const { actionId, itemId, spaceId, context } = action.payload;
                        console.log('[App] CONTEXT_MENU_ACTION received:', { actionId, itemId, spaceId, context });

                        // Find the item
                        const space = spaces.find((s) => s.id === spaceId);
                        if (space) {
                            const findItem = (items: SpaceItem[]): SpaceItem | null => {
                                for (const item of items) {
                                    if (item.id === itemId) return item;
                                    if (item.children) {
                                        const found = findItem(item.children);
                                        if (found) return found;
                                    }
                                }
                                return null;
                            };
                            const item = findItem(space.rootItems);

                            if (item) {
                                console.log('[App] 🎯 Executing action:', actionId, 'on item:', item.name);

                                switch (actionId) {
                                    case 'delete': {
                                        const needsConfirmation = item.type === SpaceItemType.folder ||
                                            item.type === SpaceItemType.localFolder;
                                        const shouldDelete = needsConfirmation
                                            ? confirm(`Delete "${item.name}"?`)
                                            : true;
                                        if (shouldDelete) {
                                            (window as any).electronAPI?.items?.delete(item.id)
                                                .then((result: any) => {
                                                    if (result?.success) {
                                                        refetch();
                                                        console.log('[App] ✅ Action completed: delete');
                                                    }
                                                });
                                        }
                                        break;
                                    }
                                    case 'copy-folder': {
                                        clipboardStore.copyItems([item], spaceId);
                                        console.log('[App] ✅ Action completed: copy-folder');
                                        break;
                                    }
                                    case 'copy-all-links': {
                                        const collectLinksRecursive = (item: SpaceItem): SpaceItem[] => {
                                            let links: SpaceItem[] = [];
                                            if (item.type === SpaceItemType.link) {
                                                links.push(item);
                                            }
                                            if (item.children) {
                                                for (const child of item.children) {
                                                    links = links.concat(collectLinksRecursive(child));
                                                }
                                            }
                                            return links;
                                        };
                                        const links = collectLinksRecursive(item);
                                        if (links.length > 0) {
                                            const urls = links.map((link) => link.path).join('\n');
                                            window.electronAPI.clipboard.writeText(urls)
                                                .then(() => {
                                                    clipboardStore.copyItems(links, spaceId);
                                                    console.log(`[App] ✅ Copied ${links.length} link(s) to clipboard`);
                                                });
                                        }
                                        break;
                                    }
                                    case 'copy-link': {
                                        window.electronAPI.clipboard.writeText(item.path)
                                            .then(() => {
                                                clipboardStore.copyItems([item], spaceId);
                                                console.log('[App] ✅ Action completed: copy-link');
                                            });
                                        break;
                                    }
                                    case 'paste': {
                                        if (clipboardStore.hasItems()) {
                                            const clipboardItems = clipboardStore.getItems();
                                            const pasteItem = async (targetSpaceId: string, targetParentId: string | null, sourceItem: SpaceItem): Promise<void> => {
                                                const result = await (window as any).electronAPI?.items?.create({
                                                    spaceId: targetSpaceId,
                                                    parentId: targetParentId || undefined,
                                                    name: sourceItem.name,
                                                    path: sourceItem.path,
                                                    type: sourceItem.type,
                                                    faviconUrl: sourceItem.faviconUrl,
                                                });
                                                if (result?.success && result.data && sourceItem.children) {
                                                    for (const child of sourceItem.children) {
                                                        await pasteItem(targetSpaceId, result.data.id, child);
                                                    }
                                                }
                                            };
                                            Promise.all(clipboardItems.map(sourceItem => pasteItem(spaceId, item.id, sourceItem)))
                                                .then(() => {
                                                    clipboardStore.clear();
                                                    refetch();
                                                    console.log('[App] ✅ Action completed: paste');
                                                });
                                        } else {
                                            window.electronAPI.clipboard.readText().then(async (text: string) => {
                                                const extractUrlsFromText = (text: string): string[] => {
                                                    const urlRegex = /https?:\/\/[^\s]+/g;
                                                    return text.match(urlRegex) || [];
                                                };
                                                const urls = extractUrlsFromText(text);
                                                if (urls.length > 0) {
                                                    for (const url of urls) {
                                                        await (window as any).electronAPI?.items?.create({
                                                            spaceId,
                                                            parentId: item.id,
                                                            name: url,
                                                            path: url,
                                                            type: SpaceItemType.link,
                                                        });
                                                    }
                                                    await refetch();
                                                    console.log('[App] ✅ Action completed: paste from system clipboard');
                                                }
                                            });
                                        }
                                        break;
                                    }
                                    case 'refresh-folder': {
                                        if (item.type === SpaceItemType.localFolder) {
                                            (window as any).electronAPI?.items?.refreshLocalFolder(item.id)
                                                .then(() => {
                                                    refetch();
                                                    console.log('[App] ✅ Action completed: refresh-folder');
                                                });
                                        }
                                        break;
                                    }
                                    case 'pin-to-top': {
                                        const apiMethod = item.isPinned ? 'unpin' : 'pin';
                                        (window as any).electronAPI?.items?.[apiMethod](item.id)
                                            .then((result: any) => {
                                                if (result?.success) {
                                                    refetch();
                                                    console.log('[App] ✅ Action completed: pin-to-top');
                                                }
                                            });
                                        break;
                                    }
                                    default:
                                        console.log('[App] ❌ UNKNOWN ACTION:', actionId);
                                }
                            } else {
                                console.error('[App] Item not found:', itemId);
                            }
                        } else {
                            console.error('[App] Space not found:', spaceId);
                        }
                    }
                    break;

                case 'ROOT_CONTEXT_MENU_ACTION':
                    // Handle root context menu actions forwarded from overlay (Story B002)
                    {
                        const { actionId, spaceId } = action.payload;
                        console.log('[App] ROOT_CONTEXT_MENU_ACTION received:', { actionId, spaceId });

                        switch (actionId) {
                            case 'paste': {
                                if (clipboardStore.hasItems()) {
                                    const clipboardItems = clipboardStore.getItems();
                                    const pasteItem = async (targetSpaceId: string, targetParentId: string | null, sourceItem: SpaceItem): Promise<void> => {
                                        const result = await (window as any).electronAPI?.items?.create({
                                            spaceId: targetSpaceId,
                                            parentId: targetParentId || undefined,
                                            name: sourceItem.name,
                                            path: sourceItem.path,
                                            type: sourceItem.type,
                                            faviconUrl: sourceItem.faviconUrl,
                                        });
                                        if (result?.success && result.data && sourceItem.children) {
                                            for (const child of sourceItem.children) {
                                                await pasteItem(targetSpaceId, result.data.id, child);
                                            }
                                        }
                                    };
                                    Promise.all(clipboardItems.map(sourceItem => pasteItem(spaceId, null, sourceItem)))
                                        .then(() => {
                                            clipboardStore.clear();
                                            refetch();
                                            console.log('[App] ✅ Root action completed: paste');
                                        });
                                } else {
                                    window.electronAPI.clipboard.readText().then(async (text: string) => {
                                        const extractUrlsFromText = (text: string): string[] => {
                                            const urlRegex = /https?:\/\/[^\s]+/g;
                                            return text.match(urlRegex) || [];
                                        };
                                        const urls = extractUrlsFromText(text);
                                        if (urls.length > 0) {
                                            for (const url of urls) {
                                                await (window as any).electronAPI?.items?.create({
                                                    spaceId,
                                                    parentId: null,
                                                    name: url,
                                                    path: url,
                                                    type: SpaceItemType.link,
                                                });
                                            }
                                            await refetch();
                                            console.log('[App] ✅ Root action completed: paste from system clipboard');
                                        }
                                    });
                                }
                                break;
                            }
                            default:
                                console.log('[App] ❌ UNKNOWN ROOT ACTION:', actionId);
                        }
                    }
                    break;

                case 'REQUEST_STATE_SYNC':
                    // Sidebar overlay requested state sync after it finished loading
                    // This ensures it gets current state even if early syncs were missed
                    console.log('[App] REQUEST_STATE_SYNC received, syncing state to overlay');
                    {
                        const expandedIdsForSpace = Array.from(
                            sidebarExpandedIdsMap.get(spaces[sidebarActiveSpaceIndex]?.id) || []
                        );
                        window.electronAPI.sidebarOverlay.syncState({
                            spaces: spaces as unknown[],
                            activeSpaceId: spaces[sidebarActiveSpaceIndex]?.id || null,
                            activeSpaceIndex: sidebarActiveSpaceIndex,
                            selectedItemId: sidebarSelectedId,
                            expandedIds: expandedIdsForSpace,
                            sidebarMode,
                            activeTab,
                            userName: 'dishant ghai',
                            // FRESH START FIX: Disable auto-show on fresh app start
                            enableAutoShow: !freshStartOverrideActive,
                        });
                    }
                    break;

                case 'VISIBILITY_CHANGE':
                    // Sidebar overlay notifies when it hides (via mouse leave)
                    // This persists the visibility state to localStorage for refresh
                    console.log('[App] VISIBILITY_CHANGE received:', action.payload.visible);
                    setSidebarVisible(action.payload.visible);
                    break;

                default:
                    console.warn('[App] Unknown overlay action:', action.type);
            }
        });

        return unsubscribe;
    }, [
        spaces,
        sidebarActiveSpaceIndex,
        handleModeToggle,
        handleCreateSpace,
        handleAddFolder,
        handleAddLink,
        handleCreateItem,
        handleRenameItem,
        handleUpdateSpace,
        handleSettingsClick,
        handleCopySelected,
        handlePasteToSelected,
        handleItemDrop,
        handleItemMoveArborist,
        handleReorderSpaces,
        handlePinItem,
        handleReorderPins,
        setFocusContext,
        setSidebarVisible, // Required for VISIBILITY_CHANGE handler
    ]);

    // Handle auto-show notification from mouse tracking (Spec 020)
    // When overlay auto-shows via left edge hover, update sidebarVisible to trigger state sync
    // This ensures expandedIdsMap is synced before user interacts with overlay
    // FRESH START FIX: Add startup cooldown to prevent auto-show from triggering immediately
    // This gives user time to move mouse away from left edge on app start
    const autoShowCooldownRef = useRef(freshStartOverrideActive ? Date.now() : 0);
    const AUTO_SHOW_COOLDOWN_MS = 1500; // 1.5 seconds cooldown on fresh start

    useEffect(() => {
        if (!window.electronAPI?.sidebarOverlay) return;

        const handleAutoShow = async () => {
            // Check startup cooldown - prevent auto-show during first 1.5s on fresh start
            const cooldownRemaining = AUTO_SHOW_COOLDOWN_MS - (Date.now() - autoShowCooldownRef.current);
            if (cooldownRemaining > 0) {
                console.log('[App] Auto-show blocked by startup cooldown, remaining:', cooldownRemaining, 'ms - hiding overlay');
                // Main process already showed the overlay, so we need to hide it
                try {
                    await window.electronAPI.sidebarOverlay.hideInstant();
                } catch (error) {
                    console.error('[App] Failed to hide overlay during cooldown:', error);
                }
                return;
            }

            console.log('[App] Overlay auto-shown via mouse tracking - updating sidebarVisible');
            setSidebarVisible(true);
        };

        const unsubscribe = window.electronAPI.sidebarOverlay.onAutoShowTriggered(handleAutoShow);

        return unsubscribe;
    }, [setSidebarVisible]);

    // B008: Handle system resume (wake from sleep)
    // Collapses sidebar in floating mode (same as fresh start behavior)
    // Main process already hid the overlay; this syncs renderer state
    useEffect(() => {
        if (!window.electronAPI?.app?.onSystemResumed) return;

        const handleResume = () => {
            console.log('[App] System resumed from sleep - collapsing sidebar');

            // Activate fresh start override to collapse sidebar in floating mode
            setFreshStartOverrideActive(true);

            // Reset auto-show cooldown to prevent immediate re-show
            autoShowCooldownRef.current = Date.now();

            // Hide React sidebar (main process already hid overlay)
            setReactSidebarVisible(false);
            setOverlayActuallyVisible(false);
        };

        const unsubscribe = window.electronAPI.app.onSystemResumed(handleResume);
        return unsubscribe;
    }, []);

    // Show loading state only on initial load (not during refetch)
    // This prevents Sidebar from unmounting/remounting during refetch
    // The useSpaces hook now uses isRefetching flag for refetches, keeping loading=false
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                width: '100vw',
                height: '100vh',
                backgroundColor: SpayceColors.backgroundDark,
            }}>
                <SpacesLoadingSkeleton />
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div style={{
                display: 'flex',
                width: '100vw',
                height: '100vh',
                backgroundColor: SpayceColors.backgroundDark,
            }}>
                <SpacesError error={error} onRetry={refetch} />
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                width: '100vw',
                height: '100vh',
                backgroundColor: SpayceColors.backgroundDark,
            }}
        >
            {/* Sidebar with F001 component - position absolute when floating to not take space */}
            {/* ALWAYS RENDER to maintain state, but hide completely when in overlay mode */}
            {/* This prevents CSS animations from firing when switching from overlay to React sidebar */}
            <div
                className={isModeSwitch ? 'no-transitions' : ''}
                style={{
                    ...(sidebarMode === 'floating' ? {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        zIndex: 100,
                    } : {}),
                    height: '100%',
                    // Show/hide based on overlay mode
                    opacity: useOverlayMode ? 0 : 1,
                    visibility: useOverlayMode ? 'hidden' : 'visible',
                    pointerEvents: (useOverlayMode || !reactSidebarVisible) ? 'none' : 'auto',
                    boxShadow: (useOverlayMode || !reactSidebarVisible) ? 'none' : '10px 0 30px -5px rgba(0, 0, 0, 0.5)',
                    // Force no transitions on wrapper during mode switch
                    transition: isModeSwitch ? 'none' : undefined,
                }}
            >
                <Sidebar
                    key="main-sidebar"
                    spaces={spaces}
                    activeSpaceIndex={sidebarActiveSpaceIndex}
                    selectedItemId={sidebarSelectedId}
                    mode={sidebarMode}
                    activeTab={activeTab}
                    userName="dishant ghai"
                    isVisible={reactSidebarVisible}
                    hasFocus={!useOverlayMode && focusContext === 'sidebar'}
                    onSpaceSelect={setSidebarActiveSpaceIndex}
                    onTabChange={setActiveTab}
                    onModeToggle={handleModeToggle}
                    onVisibilityChange={handleSidebarVisibilityChange}
                    onItemClick={handleItemClick}
                    onItemContextMenu={handleSidebarContextMenu}
                    onPinnedItemContextMenu={handlePinsGridContextMenu}
                    onCreateSpace={handleCreateSpace}
                    onAddFolder={handleAddFolder}
                    onAddLink={handleAddLink}
                    onCreateItem={handleCreateItem}
                    onRenameItem={handleRenameItem}
                    onEditSpace={handleUpdateSpace}
                    onSettingsClick={handleSettingsClick}
                    onFocusChange={(hasFocus: boolean) => {
                        if (hasFocus) setFocusContext('sidebar');
                    }}
                    onCopySelected={handleCopySelected}
                    onPasteToSelected={handlePasteToSelected}
                    onItemDrop={handleItemDrop}
                    onItemMoveArborist={handleItemMoveArborist}
                    onRootContextMenu={handleRootContextMenu}
                    onReorderSpaces={handleReorderSpaces}
                    onPinItem={handlePinItem}
                    onReorderPins={handleReorderPins}
                    expandedIdsMap={sidebarExpandedIdsMap}
                    onExpandedIdsMapChange={setSidebarExpandedIdsMap}
                />
            </div>

            {/* Main content area */}
            <main
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: SpayceColors.backgroundDark,
                    overflow: 'hidden',
                }}
            >
                {activeTab === 'spaces' ? (
                    <SpacesScreen
                        spaces={spaces}
                        activeSpaceIndex={spacesScreenActiveSpaceIndex}
                        selectedItemId={cardSelectedId}
                        hasFocus={focusContext === 'spacesScreen'}
                        onSpaceSelect={(index: number) => {
                            setSpacesScreenActiveSpaceIndex(index);
                            setFocusContext('spacesScreen');
                        }}
                        onItemClick={(item: SpaceItem, spaceId: string) => {
                            console.log('SpacesScreen item clicked:', item.name, 'in space:', spaceId);
                            setCardSelectedId(item.id);
                            setFocusContext('spacesScreen');
                        }}
                        onItemContextMenu={handleCardContextMenu}
                        onAddSpace={() => {
                            console.log('Add space clicked from SpacesScreen');
                        }}
                        onAddFolder={handleAddFolder}
                        onAddLink={handleAddLink}
                        onRenameItem={handleRenameItem}
                        onReorderSpaces={handleReorderSpaces}
                        onFocusChange={(hasFocus: boolean) => {
                            if (hasFocus) setFocusContext('spacesScreen');
                        }}
                        onItemDrop={handleItemDrop}
                        onItemMoveArborist={handleItemMoveArborist}
                        onRootContextMenu={handleRootContextMenu}
                        onCrossCardMove={handleCrossCardMove}
                        onCopySelected={handleCopySelected}
                        onPasteToSelected={handlePasteToSelected}
                    />
                ) : activeTab === 'browser' ? (
                    <BrowserArea
                        // Spec 020: In overlay mode, sidebar is a WebContentsView on top of browser
                        // Browser NEVER moves - always full width (sidebarWidth=0)
                        // In fixed mode: 0 (DOM layout already positions content after sidebar)
                        // The useOverlayMode ensures browser stays stable when sidebar opens/closes
                        sidebarWidth={0}
                    />
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <h2
                                style={{
                                    fontSize: 24,
                                    fontWeight: 600,
                                    color: SpayceColors.textPrimary,
                                }}
                            >
                                {activeTab === 'workspace' ? 'Workspace View' : 'Settings'}
                            </h2>
                            <p
                                style={{
                                    fontSize: 14,
                                    color: SpayceColors.textSecondary,
                                    marginTop: 8,
                                }}
                            >
                                {activeTab === 'workspace' ? 'Code workspace will appear here' : 'Application settings'}
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    items={getContextMenuItems(contextMenu.item, hasClipboard, contextMenu.context)}
                    position={contextMenu.position}
                    onItemClick={handleContextMenuItemClick}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {/* F034/F035: Root Context Menu (for empty area clicks) */}
            {rootContextMenu && (
                <ContextMenu
                    items={getRootContextMenuItems(rootContextMenu.spaceId)}
                    position={rootContextMenu.position}
                    onItemClick={handleRootContextMenuAction}
                    onClose={() => setRootContextMenu(null)}
                />
            )}

            {/* Hover trigger for floating sidebar - rendered at App level to avoid pointer-events issues */}
            {/* Only for React sidebar (non-overlay mode) - overlay mode uses native mouse tracking */}
            {sidebarMode === 'floating' && !sidebarVisible && !useOverlayMode && (
                <div
                    style={{
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 10,
                        zIndex: 1000,
                        pointerEvents: 'all',
                    }}
                    onMouseEnter={() => handleSidebarVisibilityChange(true)}
                />
            )}
        </div>
    );
}
