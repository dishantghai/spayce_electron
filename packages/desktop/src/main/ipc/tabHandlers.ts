/**
 * Tab IPC Handlers
 * Story F037: Tab CRUD Infrastructure
 *
 * Handles tab CRUD operations via IPC, coordinating between
 * the TabsFacade (persistence) and BrowserService (WebContentsView lifecycle).
 */

import { ipcMain } from 'electron';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { TabsFacade } from '@spayce/core/application';
import { getBrowserService } from '../services/BrowserService';
import { getSidebarOverlayService } from '../services/SidebarOverlayService';

const TAB_CHANNELS = [
    'tabs:getAll',
    'tabs:getActive',
    'tabs:create',
    'tabs:close',
    'tabs:switch',
    'tabs:update',
    'tabs:reorder',
] as const;

export function registerTabHandlers(): void {
    // Remove existing handlers first (idempotent registration)
    unregisterTabHandlers();

    const tabsFacade = serviceRegistry.get<TabsFacade>(SERVICE_KEYS.TABS_FACADE);
    const browserService = getBrowserService();

    // Get all tabs
    ipcMain.handle('tabs:getAll', async () => {
        return tabsFacade.getTabs();
    });

    // Get active tab
    ipcMain.handle('tabs:getActive', async () => {
        return tabsFacade.getActiveTab();
    });

    // Create new tab
    ipcMain.handle('tabs:create', async (_, input?: {
        url?: string;
        title?: string;
        originSpaceId?: string;
        originSpaceItemId?: string;
        faviconUrl?: string;
    }) => {
        const result = await tabsFacade.createTab(input ?? {});

        if (result.success && result.data) {
            const tab = result.data;
            try {
                // Create corresponding WebContentsView
                browserService.createView(tab.id, { url: tab.url });
                browserService.setActiveView(tab.id);

                // Re-raise sidebar overlay z-order
                getSidebarOverlayService().raiseToTop();
            } catch (error) {
                console.error('[TabHandlers] Failed to create browser view for tab:', error);
            }
        }

        return result;
    });

    // Close tab
    ipcMain.handle('tabs:close', async (_, tabId: string) => {
        // Destroy WebContentsView first
        try {
            browserService.destroyView(tabId);
        } catch (error) {
            console.error('[TabHandlers] Failed to destroy browser view:', error);
        }

        const result = await tabsFacade.closeTab(tabId);

        // If closing was successful, show the new active tab's view
        if (result.success) {
            const activeResult = await tabsFacade.getActiveTab();
            if (activeResult.success && activeResult.data) {
                try {
                    browserService.setActiveView(activeResult.data.id);
                    getSidebarOverlayService().raiseToTop();
                } catch (error) {
                    console.error('[TabHandlers] Failed to activate view after close:', error);
                }
            }
        }

        return result;
    });

    // Switch to tab
    ipcMain.handle('tabs:switch', async (_, tabId: string) => {
        const result = await tabsFacade.switchTab(tabId);

        if (result.success) {
            try {
                browserService.setActiveView(tabId);
                getSidebarOverlayService().raiseToTop();
            } catch (error) {
                console.error('[TabHandlers] Failed to switch browser view:', error);
            }
        }

        return result;
    });

    // Update tab
    ipcMain.handle('tabs:update', async (_, input: {
        id: string;
        url?: string;
        title?: string;
        faviconUrl?: string;
        isTracked?: boolean;
    }) => {
        return tabsFacade.updateTab(input);
    });

    // Reorder tabs
    ipcMain.handle('tabs:reorder', async (_, orderedIds: string[]) => {
        return tabsFacade.reorderTabs(orderedIds);
    });

    console.log('[Spayce] Tab IPC handlers registered');
}

export function unregisterTabHandlers(): void {
    for (const channel of TAB_CHANNELS) {
        ipcMain.removeHandler(channel);
    }
}
