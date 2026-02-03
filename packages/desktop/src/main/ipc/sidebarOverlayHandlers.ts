import { ipcMain, BrowserWindow } from 'electron';
import { getSidebarOverlayService } from '../services/SidebarOverlayService';

/**
 * State payload for sidebar overlay synchronization
 */
export interface SidebarStatePayload {
    spaces: Array<{
        id: string;
        name: string;
        icon: string;
        color?: string;
    }>;
    activeSpaceId: string | null;
    activeSpaceIndex: number;
    selectedItemId: string | null;
    expandedIds: string[];
    sidebarMode: 'floating' | 'fixed';
    activeTab: string;
    hasClipboard?: boolean; // For context menu paste option
    enableAutoShow?: boolean; // FRESH START FIX: Disable auto-show on fresh app start
}

/**
 * Action payload from sidebar overlay
 */
export interface SidebarActionPayload {
    type:
        | 'SELECT_SPACE'
        | 'TAB_CHANGE'
        | 'MODE_TOGGLE'
        | 'ITEM_CLICK'
        | 'ITEM_CONTEXT_MENU'
        | 'PINNED_ITEM_CONTEXT_MENU'
        | 'CREATE_SPACE'
        | 'ADD_FOLDER'
        | 'ADD_LINK'
        | 'CREATE_ITEM'
        | 'RENAME_ITEM'
        | 'EDIT_SPACE'
        | 'SETTINGS_CLICK'
        | 'FOCUS_CHANGE'
        | 'COPY_SELECTED'
        | 'PASTE_TO_SELECTED'
        | 'ITEM_DROP'
        | 'ITEM_MOVE_ARBORIST'
        | 'ROOT_CONTEXT_MENU'
        | 'REORDER_SPACES'
        | 'PIN_ITEM'
        | 'REORDER_PINS'
        | 'EXPANDED_IDS_CHANGE'
        | 'REQUEST_STATE_SYNC' // Added: Sidebar overlay requests state refresh after loading
        | 'SIDEBAR_READY' // Added: Sidebar overlay signals React has rendered with correct dimensions
        | 'VISIBILITY_CHANGE'; // Added: Sidebar overlay notifies visibility change (for persisting collapsed state)
    payload: unknown;
}

/**
 * Register sidebar overlay IPC handlers
 */
export function registerSidebarOverlayHandlers(mainWindow: BrowserWindow): void {
    const service = getSidebarOverlayService();

    // Initialize service with main window
    service.initialize(mainWindow);

    // Show sidebar overlay
    ipcMain.handle('sidebar-overlay:show', async () => {
        console.log('[SidebarOverlayHandlers] show() IPC called');
        try {
            await service.show();
            const isVisible = service.getIsVisible();
            console.log('[SidebarOverlayHandlers] show() completed, isVisible:', isVisible);
            return { success: true, isVisible };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[SidebarOverlayHandlers] show() error:', message);
            return { success: false, error: message };
        }
    });

    // Hide sidebar overlay
    ipcMain.handle('sidebar-overlay:hide', async () => {
        try {
            await service.hide();
            return { success: true, isVisible: service.getIsVisible() };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    // Toggle sidebar overlay
    ipcMain.handle('sidebar-overlay:toggle', async () => {
        try {
            const isVisible = await service.toggle();
            return { success: true, isVisible };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    // Get visibility state
    ipcMain.handle('sidebar-overlay:getVisibility', () => {
        const isVisible = service.getIsVisible();
        console.log('[SidebarOverlayHandlers] getVisibility called, returning:', isVisible);
        return { success: true, isVisible };
    });

    // Show instantly without animation (B010: for tab switches into overlay mode)
    ipcMain.handle('sidebar-overlay:showInstant', async () => {
        console.log('[SidebarOverlayHandlers] showInstant() IPC called');
        try {
            await service.showInstant();
            const isVisible = service.getIsVisible();
            console.log('[SidebarOverlayHandlers] showInstant() completed, isVisible:', isVisible);
            return { success: true, isVisible };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[SidebarOverlayHandlers] showInstant() error:', message);
            return { success: false, error: message };
        }
    });

    // Hide instantly (for mode switches)
    ipcMain.handle('sidebar-overlay:hideInstant', () => {
        try {
            service.hideInstant();
            return { success: true, isVisible: service.getIsVisible() };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    // Sync state from main renderer to sidebar overlay
    ipcMain.on('sidebar-overlay:sync-state', (_event, state: SidebarStatePayload) => {
        console.log('[SidebarOverlayHandlers] sync-state called with:', {
            sidebarMode: state.sidebarMode,
            activeTab: state.activeTab,
            enableAutoShow: state.enableAutoShow,
        });

        service.sendStateUpdate(state);

        // Update floating mode state for mouse tracking
        // Mouse tracking is only active when:
        // 1. In floating mode with browser tab active
        // 2. Auto-show is enabled (NOT on fresh app start)
        // FRESH START FIX: enableAutoShow is false on fresh app start to prevent
        // sidebar from appearing when user's mouse is near left edge during startup
        const isOverlayMode = state.sidebarMode === 'floating' && state.activeTab === 'browser';
        const shouldEnableTracking = isOverlayMode && state.enableAutoShow !== false;
        console.log('[SidebarOverlayHandlers] Setting floating mode:', shouldEnableTracking, '(overlay:', isOverlayMode, ', autoShow:', state.enableAutoShow, ')');
        service.setFloatingMode(shouldEnableTracking);
    });

    // Forward action from sidebar overlay to main renderer
    // Special handling for SIDEBAR_READY - route to service instead of renderer
    ipcMain.on('sidebar-overlay:action', (_event, action: SidebarActionPayload) => {
        if (action.type === 'SIDEBAR_READY') {
            // SIDEBAR_READY is handled by the service to unblock show() animation
            console.log('[SidebarOverlayHandlers] SIDEBAR_READY received, routing to service');
            service.handleSidebarReady();
            return;
        }
        mainWindow.webContents.send('sidebar:action', action);
    });

    // Set sidebar mode (for mouse tracking)
    ipcMain.on('sidebar-overlay:set-mode', (_event, mode: 'fixed' | 'floating') => {
        service.setFloatingMode(mode === 'floating');
    });

    console.log('[SidebarOverlayHandlers] Registered');
}

/**
 * Unregister sidebar overlay IPC handlers
 */
export function unregisterSidebarOverlayHandlers(): void {
    const service = getSidebarOverlayService();
    service.destroy();

    const handleChannels = [
        'sidebar-overlay:show',
        'sidebar-overlay:showInstant',
        'sidebar-overlay:hide',
        'sidebar-overlay:hideInstant',
        'sidebar-overlay:toggle',
        'sidebar-overlay:getVisibility',
    ];

    for (const channel of handleChannels) {
        ipcMain.removeHandler(channel);
    }

    ipcMain.removeAllListeners('sidebar-overlay:sync-state');
    ipcMain.removeAllListeners('sidebar-overlay:action');
    ipcMain.removeAllListeners('sidebar-overlay:set-mode');

    console.log('[SidebarOverlayHandlers] Unregistered');
}
