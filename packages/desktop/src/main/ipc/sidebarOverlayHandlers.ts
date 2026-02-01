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
        | 'EXPANDED_IDS_CHANGE';
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
        try {
            await service.show();
            return { success: true, isVisible: service.getIsVisible() };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
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
        return { success: true, isVisible: service.getIsVisible() };
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
        service.sendStateUpdate(state);

        // Update floating mode state for mouse tracking
        // Mouse tracking is only active when in floating mode with browser tab active
        // Spec 020: Context menus now render in overlay, so they don't interfere with mouse tracking
        const isOverlayMode = state.sidebarMode === 'floating' && state.activeTab === 'browser';
        service.setFloatingMode(isOverlayMode);
    });

    // Forward action from sidebar overlay to main renderer
    ipcMain.on('sidebar-overlay:action', (_event, action: SidebarActionPayload) => {
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
