import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar, ContextMenu, type SidebarMode, type ContextMenuItem, SpaceItemType } from '@spayce/react-ui';
import type { Space, SpaceItem, SidebarTabId } from '@spayce/react-ui';
import type { SidebarStatePayload } from '../preload/types';
import type { DropPosition } from '@spayce/react-ui/stores';
import { useInlineInputStore, useDragDropUiStore } from '@spayce/react-ui/stores';
import * as LucideIcons from 'lucide-react';

/**
 * Helper to generate context menu items based on item type
 * Copied from App.tsx to make overlay self-contained
 */
function getContextMenuItems(item: SpaceItem, hasClipboard: boolean, context?: 'sidebar' | 'card' | 'pins-grid'): ContextMenuItem[] {
    const items: ContextMenuItem[] = [];

    if (item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder) {
        const isLocalFolder = item.type === SpaceItemType.localFolder;

        // B001: Exclude Rename for pinned items in pins grid
        if (context !== 'pins-grid') {
            items.push({ id: 'rename', label: 'Rename', icon: LucideIcons.Edit });
        }

        if (isLocalFolder) {
            items.push({ id: 'refresh-folder', label: 'Refresh Folder', icon: LucideIcons.RefreshCw });
        }

        items.push(
            { id: 'divider1', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'new-folder', label: 'New Folder', icon: LucideIcons.FolderPlus },
            { id: 'new-link', label: 'Add Link', icon: LucideIcons.Link },
            { id: 'divider2', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'copy-folder', label: 'Copy Folder', icon: LucideIcons.Copy }
        );

        if (hasLinksRecursive(item)) {
            items.push({ id: 'copy-all-links', label: 'Copy All Links', icon: LucideIcons.Link });
        }

        if (hasClipboard) {
            items.push({ id: 'paste', label: 'Paste', icon: LucideIcons.Clipboard });
        }

        items.push(
            { id: 'pin-to-top', label: item.isPinned ? 'Unpin from Top' : 'Pin to Top', icon: LucideIcons.Pin },
            { id: 'divider3', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'delete', label: 'Delete Folder', icon: LucideIcons.Trash2, isDestructive: true }
        );
    } else if (item.type === SpaceItemType.link) {
        if (context !== 'pins-grid') {
            items.push({ id: 'rename', label: 'Rename', icon: LucideIcons.Edit });
        }

        items.push(
            { id: 'copy-link', label: 'Copy Link', icon: LucideIcons.Copy },
            { id: 'pin-to-top', label: item.isPinned ? 'Unpin from Top' : 'Pin to Top', icon: LucideIcons.Pin },
            { id: 'divider1', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'delete', label: 'Delete', icon: LucideIcons.Trash2, isDestructive: true }
        );
    }

    return items;
}

// Helper from App.tsx
function hasLinksRecursive(item: SpaceItem): boolean {
    if (item.type === SpaceItemType.link) return true;
    if (!item.children || item.children.length === 0) return false;
    return item.children.some(child => hasLinksRecursive(child));
}

/**
 * Sidebar Overlay Application
 *
 * This is a separate React application that runs in the sidebar WebContentsView overlay.
 * It receives full state from the main renderer via IPC and renders the actual Sidebar component.
 * All user actions are forwarded back to the main renderer for processing.
 *
 * Spec 020: Context menus render in overlay to fix z-index issues with WebContentsView.
 */
function SidebarOverlayApp() {
    // Full state synced from main renderer
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [activeSpaceIndex, setActiveSpaceIndex] = useState(0);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>('floating');
    const [activeTab, setActiveTab] = useState<SidebarTabId>('spaces');
    const [userName, setUserName] = useState<string>('User');

    const [expandedIdsMap, setExpandedIdsMap] = useState<Map<string, Set<string>>>(new Map());
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

    // Track last user interaction time to prevent spurious mouseleave from hiding sidebar
    // When clicking tree items, DOM changes can trigger false mouseleave events
    const lastInteractionTimeRef = useRef<number>(0);
    const INTERACTION_GRACE_PERIOD = 300; // ms to ignore mouseleave after interaction

    // Context menu state (Spec 020: Render in overlay to fix z-index)
    const [contextMenu, setContextMenu] = useState<{
        item: SpaceItem;
        spaceId: string;
        position: { x: number; y: number };
        context: 'sidebar' | 'pins-grid';
    } | null>(null);

    const [rootContextMenu, setRootContextMenu] = useState<{
        spaceId: string;
        position: { x: number; y: number };
    } | null>(null);

    // Track clipboard state from main renderer (for context menu items)
    const [hasClipboard, setHasClipboard] = useState(false);

    // Initialize IPC subscriptions
    useEffect(() => {
        console.log('[SidebarOverlay] Initializing...');

        // Check if electronAPI is available
        if (!window.electronAPI?.sidebarOverlay) {
            console.error('[SidebarOverlay] electronAPI.sidebarOverlay not available');
            setConnectionStatus('error');
            return;
        }

        // Subscribe to state updates from main renderer
        const unsubscribe = window.electronAPI.sidebarOverlay.onStateUpdate((state: SidebarStatePayload) => {
            console.log('[SidebarOverlay] State update received:', state);

            // Update all state from main renderer
            if (state.spaces) setSpaces(state.spaces as Space[]);
            setActiveSpaceIndex(state.activeSpaceIndex);
            setSelectedItemId(state.selectedItemId);
            setExpandedIds(state.expandedIds);
            setSidebarMode(state.sidebarMode);
            setActiveTab(state.activeTab as SidebarTabId);
            if (state.userName) setUserName(state.userName);
            if (state.hasClipboard !== undefined) setHasClipboard(state.hasClipboard);

            // CRITICAL: Do NOT sync inline input state from main to overlay
            // Overlay manages inline input state completely independently
            // Main renderer setting inline inputs is for the React sidebar (non-overlay mode)
            // Overlay's inline inputs are triggered locally (context menu, hover actions)
            console.log('[SidebarOverlay] State synced - inline input state managed locally (not synced)');

            // Convert expandedIds array to Map for active space only
            // Preserve expanded state for other spaces to avoid unwanted collapses
            if (state.activeSpaceId && state.expandedIds) {
                setExpandedIdsMap((prevMap) => {
                    const newMap = new Map(prevMap);
                    newMap.set(state.activeSpaceId, new Set(state.expandedIds));
                    return newMap;
                });
            }
        });

        setConnectionStatus('connected');
        console.log('[SidebarOverlay] Connected successfully');

        return () => {
            unsubscribe();
            console.log('[SidebarOverlay] Cleanup complete');
        };
    }, []);

    // Send action to main renderer and track interaction time
    const sendAction = useCallback((type: string, payload: any) => {
        // Track interaction time to prevent spurious mouseleave events from hiding sidebar
        lastInteractionTimeRef.current = Date.now();
        if (window.electronAPI?.sidebarOverlay) {
            window.electronAPI.sidebarOverlay.sendAction({ type, payload });
        }
    }, []);

    // Event handlers - forward to main renderer
    const handleSpaceSelect = useCallback((index: number) => {
        sendAction('SELECT_SPACE', { index });
    }, [sendAction]);

    const handleTabChange = useCallback((tab: SidebarTabId) => {
        sendAction('TAB_CHANGE', { tab });
    }, [sendAction]);

    const handleModeToggle = useCallback(() => {
        // Send mode toggle action to main renderer
        // App.tsx will update state first (making React sidebar visible)
        // Then hide the overlay in the visibility effect - this ordering prevents flicker
        sendAction('MODE_TOGGLE', {});
    }, [sendAction]);

    const handleVisibilityChange = useCallback(async (visible: boolean) => {
        console.log('[SidebarOverlay] Visibility change requested:', visible, 'mode:', sidebarMode);

        // In overlay context, we need to communicate visibility changes to main process
        // When visible=false (mouse leave), hide the overlay with animation
        // When visible=true, the main process handles showing via mouse tracking
        if (!visible && window.electronAPI?.sidebarOverlay) {
            // Check if user interacted recently - if so, ignore spurious mouseleave
            // DOM changes from tree expansion/collapse can trigger false mouseleave events
            const timeSinceInteraction = Date.now() - lastInteractionTimeRef.current;
            if (timeSinceInteraction < INTERACTION_GRACE_PERIOD) {
                console.log('[SidebarOverlay] Ignoring mouseleave during grace period:', timeSinceInteraction, 'ms');
                return;
            }

            try {
                // Hide overlay with animation when mouse leaves
                await window.electronAPI.sidebarOverlay.hide();
                console.log('[SidebarOverlay] Hidden via mouse leave');
            } catch (error) {
                console.error('[SidebarOverlay] Failed to hide:', error);
            }
        }
        // Note: We don't call show() here because showing is handled by:
        // 1. Mouse tracking in SidebarOverlayService (auto-show on left edge hover)
        // 2. Main App's overlay visibility effect
    }, [sidebarMode]);

    const handleItemClick = useCallback((item: SpaceItem, spaceId: string) => {
        console.log('[SidebarOverlay] Item clicked:', item.name, '- clearing inline states');

        // CRITICAL FIX: Clear inline input state when clicking any item
        // Clicking should cancel any pending rename/create actions
        useInlineInputStore.getState().clearSidebarInput();
        useInlineInputStore.getState().setSidebarRenameItemId(null);

        sendAction('ITEM_CLICK', { itemId: item.id, spaceId });
    }, [sendAction]);

    const handleItemContextMenu = useCallback((item: SpaceItem, spaceId: string, event: React.MouseEvent) => {
        console.log('═══════════════════════════════════════════');
        console.log('[SidebarOverlay] 🖱️ RIGHT-CLICK on item:', item.name);

        // Check current state BEFORE clearing
        const currentRenameId = useInlineInputStore.getState().sidebarRenameItemId;
        const currentInput = useInlineInputStore.getState().sidebarInput;
        console.log('[SidebarOverlay] Current inline states BEFORE clear:', {
            sidebarRenameItemId: currentRenameId,
            sidebarInput: currentInput,
        });

        // CRITICAL FIX: Clear inline input state IMMEDIATELY in overlay
        console.log('[SidebarOverlay] 🧹 Clearing stale inline input state locally...');
        useInlineInputStore.getState().clearSidebarInput();
        useInlineInputStore.getState().setSidebarRenameItemId(null);

        // ALSO notify main renderer to clear its state (prevent re-sync of stale state)
        console.log('[SidebarOverlay] 📤 Sending CLEAR_INLINE_STATE to main renderer');
        sendAction('CLEAR_INLINE_STATE', { context: 'sidebar' });

        // Verify state was cleared
        const afterClearRenameId = useInlineInputStore.getState().sidebarRenameItemId;
        const afterClearInput = useInlineInputStore.getState().sidebarInput;
        console.log('[SidebarOverlay] States AFTER clear:', {
            sidebarRenameItemId: afterClearRenameId,
            sidebarInput: afterClearInput,
        });
        console.log('═══════════════════════════════════════════');

        // Spec 020: Set local context menu state (render in overlay for z-index)
        setContextMenu({
            item,
            spaceId,
            position: { x: event.clientX, y: event.clientY },
            context: 'sidebar',
        });
    }, [sendAction]);

    const handlePinnedItemContextMenu = useCallback((item: SpaceItem, spaceId: string, event: React.MouseEvent) => {
        console.log('[SidebarOverlay] Pinned item context menu requested:', item.name);
        console.log('[SidebarOverlay] Clearing stale inline input state locally');

        // CRITICAL FIX: Clear inline input state
        useInlineInputStore.getState().clearSidebarInput();
        useInlineInputStore.getState().setSidebarRenameItemId(null);

        // Notify main renderer to clear its state
        console.log('[SidebarOverlay] 📤 Sending CLEAR_INLINE_STATE to main renderer');
        sendAction('CLEAR_INLINE_STATE', { context: 'pins-grid' });

        // Spec 020: Set local context menu state with pins-grid context
        setContextMenu({
            item,
            spaceId,
            position: { x: event.clientX, y: event.clientY },
            context: 'pins-grid',
        });
    }, [sendAction]);

    const handleCreateSpace = useCallback((spaceData: { name: string; iconName: string; accentColor: string }) => {
        sendAction('CREATE_SPACE', spaceData);
    }, [sendAction]);

    const handleAddFolder = useCallback((spaceId: string, parentId?: string | null) => {
        console.log('[SidebarOverlay] 🎯 HOVER ADD FOLDER triggered');
        console.log('[SidebarOverlay] parentId:', parentId, 'spaceId:', spaceId);

        // CRITICAL: Notify main renderer to clear stale state IMMEDIATELY
        // This must happen BEFORE Sidebar component sets new input state
        console.log('[SidebarOverlay] 📤 Sending CLEAR_INLINE_STATE to main (hover add folder)');
        sendAction('CLEAR_INLINE_STATE', { context: 'sidebar', source: 'hover-add-folder' });

        // Also forward the ADD_FOLDER action if it's from space header (no parentId)
        if (parentId === null || parentId === undefined) {
            sendAction('ADD_FOLDER', { spaceId });
        }
        // If parentId exists, it's from tree item hover - Sidebar handles it locally
    }, [sendAction]);

    const handleAddLink = useCallback((spaceId: string, parentId?: string | null) => {
        console.log('[SidebarOverlay] 🎯 HOVER ADD LINK triggered');
        console.log('[SidebarOverlay] parentId:', parentId, 'spaceId:', spaceId);

        // CRITICAL: Notify main renderer to clear stale state IMMEDIATELY
        console.log('[SidebarOverlay] 📤 Sending CLEAR_INLINE_STATE to main (hover add link)');
        sendAction('CLEAR_INLINE_STATE', { context: 'sidebar', source: 'hover-add-link' });

        // Forward ADD_LINK action if from space header
        if (parentId === null || parentId === undefined) {
            sendAction('ADD_LINK', { spaceId });
        }
        // If parentId exists, it's from tree item hover - Sidebar handles locally
    }, [sendAction]);

    const handleCreateItem = useCallback(async (input: {
        spaceId: string;
        parentId: string | null;
        name: string;
        path: string;
        type: string;
        faviconUrl?: string | null;
    }) => {
        sendAction('CREATE_ITEM', input);
    }, [sendAction]);

    const handleRenameItem = useCallback(async (itemId: string, newName: string) => {
        sendAction('RENAME_ITEM', { itemId, newName });
    }, [sendAction]);

    const handleEditSpace = useCallback((space: Space, spaceData: { name: string; iconName: string; accentColor: string }) => {
        sendAction('EDIT_SPACE', { spaceId: space.id, ...spaceData });
    }, [sendAction]);

    const handleSettingsClick = useCallback(() => {
        sendAction('SETTINGS_CLICK', {});
    }, [sendAction]);

    const handleFocusChange = useCallback((hasFocus: boolean) => {
        sendAction('FOCUS_CHANGE', { hasFocus });
    }, [sendAction]);

    const handleCopySelected = useCallback((focusedItemId: string | null) => {
        sendAction('COPY_SELECTED', { focusedItemId });
    }, [sendAction]);

    const handlePasteToSelected = useCallback(async (focusedItemId: string | null) => {
        sendAction('PASTE_TO_SELECTED', { focusedItemId });
    }, [sendAction]);

    const handleItemDrop = useCallback((itemId: string, targetId: string, position: DropPosition, spaceId: string) => {
        console.log('[SidebarOverlay] 🎯 Item drop:', { itemId, targetId, position, spaceId });

        // CRITICAL FIX: Get drag data from overlay's local store and send it with the action
        // Main renderer needs this data to process the drop
        const dragData = useDragDropUiStore.getState().dragData;

        if (!dragData) {
            console.error('[SidebarOverlay] No drag data in local store!');
            return;
        }

        console.log('[SidebarOverlay] Drag data:', {
            itemCount: dragData.items?.length || 1,
            source: dragData.source,
        });

        // Send drop action WITH drag data to main renderer
        sendAction('ITEM_DROP', {
            itemId,
            targetId,
            position,
            spaceId,
            dragData, // Include drag data from overlay's store
        });
    }, [sendAction]);

    const handleItemMoveArborist = useCallback(async (
        draggedItemId: string,
        newParentId: string | null,
        newIndex: number,
        spaceId: string
    ): Promise<boolean> => {
        sendAction('ITEM_MOVE_ARBORIST', { draggedItemId, newParentId, newIndex, spaceId });
        return true; // Optimistic
    }, [sendAction]);

    const handleRootContextMenu = useCallback((spaceId: string, event: React.MouseEvent) => {
        console.log('[SidebarOverlay] Root context menu requested for space:', spaceId);
        console.log('[SidebarOverlay] Clearing stale inline input state locally');

        // CRITICAL FIX: Clear inline input state when opening root context menu
        useInlineInputStore.getState().clearSidebarInput();
        useInlineInputStore.getState().setSidebarRenameItemId(null);

        // Notify main renderer to clear its state
        console.log('[SidebarOverlay] 📤 Sending CLEAR_INLINE_STATE to main renderer');
        sendAction('CLEAR_INLINE_STATE', { context: 'root' });

        // Spec 020: Set local root context menu state
        setRootContextMenu({
            spaceId,
            position: { x: event.clientX, y: event.clientY },
        });
    }, [sendAction]);

    const handleReorderSpaces = useCallback((oldIndex: number, newIndex: number) => {
        sendAction('REORDER_SPACES', { oldIndex, newIndex });
    }, [sendAction]);

    const handlePinItem = useCallback(async (itemId: string, position: number, spaceId: string): Promise<boolean> => {
        sendAction('PIN_ITEM', { itemId, position, spaceId });
        return true; // Optimistic
    }, [sendAction]);

    const handleReorderPins = useCallback((oldIndex: number, newIndex: number, spaceId: string) => {
        sendAction('REORDER_PINS', { oldIndex, newIndex, spaceId });
    }, [sendAction]);

    // Context menu action handler (Spec 020)
    const handleContextMenuItemClick = useCallback((actionId: string) => {
        if (!contextMenu) return;

        console.log('[SidebarOverlay] Context menu action:', actionId, contextMenu.item.name);

        // CRITICAL: Handle inline input actions LOCALLY in overlay
        // Only send to main for data operations (delete, copy, paste, etc.)
        if (actionId === 'rename') {
            console.log('[SidebarOverlay] Handling rename locally');
            // Clear old state first
            useInlineInputStore.getState().clearSidebarInput();
            useInlineInputStore.getState().setSidebarRenameItemId(null);
            // Force toggle
            setTimeout(() => {
                useInlineInputStore.getState().setSidebarRenameItemId(contextMenu.item.id);
                console.log('[SidebarOverlay] ✅ Rename state set locally:', contextMenu.item.id);
            }, 0);
        } else if (actionId === 'new-folder') {
            console.log('[SidebarOverlay] Handling new-folder locally');
            useInlineInputStore.getState().setSidebarRenameItemId(null);
            useInlineInputStore.getState().clearSidebarInput();
            setTimeout(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: contextMenu.spaceId,
                    parentId: contextMenu.item.id,
                    type: 'folder',
                });
                console.log('[SidebarOverlay] ✅ Folder input set locally');
            }, 0);
        } else if (actionId === 'new-link') {
            console.log('[SidebarOverlay] Handling new-link locally');
            useInlineInputStore.getState().setSidebarRenameItemId(null);
            useInlineInputStore.getState().clearSidebarInput();
            setTimeout(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: contextMenu.spaceId,
                    parentId: contextMenu.item.id,
                    type: 'link',
                });
                console.log('[SidebarOverlay] ✅ Link input set locally');
            }, 0);
        } else {
            // All other actions forward to main renderer for execution
            console.log('[SidebarOverlay] Forwarding action to main:', actionId);
            sendAction('CONTEXT_MENU_ACTION', {
                actionId,
                itemId: contextMenu.item.id,
                spaceId: contextMenu.spaceId,
                context: contextMenu.context,
            });
        }

        // Close context menu immediately
        setContextMenu(null);
    }, [contextMenu, sendAction]);

    // Root context menu action handler (Spec 020)
    const handleRootContextMenuAction = useCallback((actionId: string) => {
        if (!rootContextMenu) return;

        console.log('[SidebarOverlay] Root context menu action:', actionId);

        // Handle inline input actions locally
        if (actionId === 'new-folder') {
            console.log('[SidebarOverlay] Handling new-folder at root locally');
            useInlineInputStore.getState().setSidebarRenameItemId(null);
            useInlineInputStore.getState().clearSidebarInput();
            setTimeout(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: rootContextMenu.spaceId,
                    parentId: null,
                    type: 'folder',
                });
                console.log('[SidebarOverlay] ✅ Root folder input set locally');
            }, 0);
        } else if (actionId === 'new-link') {
            console.log('[SidebarOverlay] Handling new-link at root locally');
            useInlineInputStore.getState().setSidebarRenameItemId(null);
            useInlineInputStore.getState().clearSidebarInput();
            setTimeout(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: rootContextMenu.spaceId,
                    parentId: null,
                    type: 'link',
                });
                console.log('[SidebarOverlay] ✅ Root link input set locally');
            }, 0);
        } else {
            // Forward other actions to main renderer (paste, etc.)
            console.log('[SidebarOverlay] Forwarding root action to main:', actionId);
            sendAction('ROOT_CONTEXT_MENU_ACTION', {
                actionId,
                spaceId: rootContextMenu.spaceId,
            });
        }

        // Close context menu
        setRootContextMenu(null);
    }, [rootContextMenu, sendAction]);

    // Get root context menu items
    const getRootContextMenuItems = useCallback((spaceId: string): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [
            { id: 'new-folder', label: 'New Folder', icon: LucideIcons.FolderPlus },
            { id: 'new-link', label: 'Add Link', icon: LucideIcons.Link },
            { id: 'divider1', label: '', icon: LucideIcons.Minus, isDivider: true },
        ];

        if (hasClipboard) {
            items.push({ id: 'paste', label: 'Paste', icon: LucideIcons.ClipboardPaste });
        }

        return items;
    }, [hasClipboard]);

    const handleExpandedIdsMapChange = useCallback((map: Map<string, Set<string>>) => {
        setExpandedIdsMap(map);
        // Send only the active space's expanded IDs, not all spaces combined
        const activeSpaceId = spaces[activeSpaceIndex]?.id;
        if (activeSpaceId) {
            const expandedArray = Array.from(map.get(activeSpaceId) || []);
            sendAction('EXPANDED_IDS_CHANGE', { expandedIds: expandedArray });
        }
    }, [sendAction, spaces, activeSpaceIndex]);

    // Render loading state
    if (connectionStatus === 'connecting') {
        return (
            <div style={loadingContainerStyle}>
                <div style={spinnerStyle} />
                <span style={loadingTextStyle}>Connecting...</span>
            </div>
        );
    }

    // Render error state
    if (connectionStatus === 'error') {
        return (
            <div style={errorContainerStyle}>
                <span style={errorTextStyle}>Failed to connect to main window</span>
            </div>
        );
    }

    // Render full Sidebar component
    return (
        <div style={containerStyle}>
            <Sidebar
                spaces={spaces}
                activeSpaceIndex={activeSpaceIndex}
                selectedItemId={selectedItemId}
                mode={sidebarMode}
                activeTab={activeTab}
                userName={userName}
                isVisible={true}
                hasFocus={true}
                expandedIdsMap={expandedIdsMap}
                onExpandedIdsMapChange={handleExpandedIdsMapChange}
                onSpaceSelect={handleSpaceSelect}
                onTabChange={handleTabChange}
                onModeToggle={handleModeToggle}
                onVisibilityChange={handleVisibilityChange}
                onItemClick={handleItemClick}
                onItemContextMenu={handleItemContextMenu}
                onPinnedItemContextMenu={handlePinnedItemContextMenu}
                onCreateSpace={handleCreateSpace}
                onAddFolder={handleAddFolder}
                onAddLink={handleAddLink}
                onCreateItem={handleCreateItem}
                onRenameItem={handleRenameItem}
                onEditSpace={handleEditSpace}
                onSettingsClick={handleSettingsClick}
                onFocusChange={handleFocusChange}
                onCopySelected={handleCopySelected}
                onPasteToSelected={handlePasteToSelected}
                onItemDrop={handleItemDrop}
                onItemMoveArborist={handleItemMoveArborist}
                onRootContextMenu={handleRootContextMenu}
                onReorderSpaces={handleReorderSpaces}
                onPinItem={handlePinItem}
                onReorderPins={handleReorderPins}
            />

            {/* Spec 020: Context menus render in overlay for correct z-index */}
            {contextMenu && (
                <ContextMenu
                    items={getContextMenuItems(contextMenu.item, hasClipboard, contextMenu.context)}
                    position={contextMenu.position}
                    onItemClick={handleContextMenuItemClick}
                    onClose={() => {
                        console.log('[SidebarOverlay] Context menu closed');
                        setContextMenu(null);
                    }}
                />
            )}

            {rootContextMenu && (
                <ContextMenu
                    items={getRootContextMenuItems(rootContextMenu.spaceId)}
                    position={rootContextMenu.position}
                    onItemClick={handleRootContextMenuAction}
                    onClose={() => {
                        console.log('[SidebarOverlay] Root context menu closed');
                        setRootContextMenu(null);
                    }}
                />
            )}
        </div>
    );
}

// Styles
const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#131020',
};

const loadingContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '16px',
    backgroundColor: '#131020',
};

const spinnerStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    border: '2px solid #2D2640',
    borderTopColor: '#6D5AE6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
};

const loadingTextStyle: React.CSSProperties = {
    color: '#9CA3AF',
    fontSize: '14px',
};

const errorContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '24px',
    textAlign: 'center',
    backgroundColor: '#131020',
};

const errorTextStyle: React.CSSProperties = {
    color: '#EF4444',
    fontSize: '14px',
};

// Add keyframes for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

// Mount React app
console.log('[SidebarOverlay] Starting initialization...');

const container = document.getElementById('sidebar-root');
if (!container) {
    console.error('[SidebarOverlay] Root element not found!');
    throw new Error('Root element not found');
}

console.log('[SidebarOverlay] Root element found, creating React root...');

const root = createRoot(container);

// Add global error handler
window.addEventListener('error', (e) => {
    console.error('[SidebarOverlay] Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('[SidebarOverlay] Unhandled rejection:', e.reason);
});

try {
    root.render(
        <React.StrictMode>
            <SidebarOverlayApp />
        </React.StrictMode>
    );
    console.log('[SidebarOverlay] App render completed');
} catch (error) {
    console.error('[SidebarOverlay] Error during render:', error);
    throw error;
}
