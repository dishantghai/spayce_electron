import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar, type SidebarMode } from '@spayce/react-ui';
import type { Space, SpaceItem, SidebarTabId } from '@spayce/react-ui';
import type { SidebarStatePayload } from '../preload/types';
import type { DropPosition } from '@spayce/react-ui/stores';

/**
 * Sidebar Overlay Application
 *
 * This is a separate React application that runs in the sidebar WebContentsView overlay.
 * It receives full state from the main renderer via IPC and renders the actual Sidebar component.
 * All user actions are forwarded back to the main renderer for processing.
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

            // Convert expandedIds array to Map
            if (state.spaces && state.expandedIds) {
                const newMap = new Map<string, Set<string>>();
                state.spaces.forEach((space: any) => {
                    newMap.set(space.id, new Set(state.expandedIds));
                });
                setExpandedIdsMap(newMap);
            }
        });

        setConnectionStatus('connected');
        console.log('[SidebarOverlay] Connected successfully');

        return () => {
            unsubscribe();
            console.log('[SidebarOverlay] Cleanup complete');
        };
    }, []);

    // Send action to main renderer
    const sendAction = useCallback((type: string, payload: any) => {
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
        sendAction('MODE_TOGGLE', {});
    }, [sendAction]);

    const handleVisibilityChange = useCallback((visible: boolean) => {
        if (!visible) {
            // Hide sidebar overlay
            window.electronAPI?.sidebarOverlay.hide();
        }
    }, []);

    const handleItemClick = useCallback((item: SpaceItem, spaceId: string) => {
        sendAction('ITEM_CLICK', { itemId: item.id, spaceId });
    }, [sendAction]);

    const handleItemContextMenu = useCallback((item: SpaceItem, spaceId: string, event: React.MouseEvent) => {
        sendAction('ITEM_CONTEXT_MENU', { itemId: item.id, spaceId, x: event.clientX, y: event.clientY });
    }, [sendAction]);

    const handlePinnedItemContextMenu = useCallback((item: SpaceItem, spaceId: string, event: React.MouseEvent) => {
        sendAction('PINNED_ITEM_CONTEXT_MENU', { itemId: item.id, spaceId, x: event.clientX, y: event.clientY });
    }, [sendAction]);

    const handleCreateSpace = useCallback((spaceData: { name: string; iconName: string; accentColor: string }) => {
        sendAction('CREATE_SPACE', spaceData);
    }, [sendAction]);

    const handleAddFolder = useCallback((spaceId: string) => {
        sendAction('ADD_FOLDER', { spaceId });
    }, [sendAction]);

    const handleAddLink = useCallback((spaceId: string) => {
        sendAction('ADD_LINK', { spaceId });
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
        sendAction('ITEM_DROP', { itemId, targetId, position, spaceId });
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
        sendAction('ROOT_CONTEXT_MENU', { spaceId, x: event.clientX, y: event.clientY });
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

    const handleExpandedIdsMapChange = useCallback((map: Map<string, Set<string>>) => {
        setExpandedIdsMap(map);
        // Convert map to serializable format and sync
        const expandedArray: string[] = [];
        map.forEach((ids) => {
            expandedArray.push(...Array.from(ids));
        });
        sendAction('EXPANDED_IDS_CHANGE', { expandedIds: expandedArray });
    }, [sendAction]);

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
