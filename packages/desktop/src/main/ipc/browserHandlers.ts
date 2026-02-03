import { ipcMain, BrowserWindow } from 'electron';
import { getBrowserService, ViewBounds, CreateViewOptions } from '../services/BrowserService';
import { getSidebarOverlayService } from '../services/SidebarOverlayService';

/**
 * Register all browser-related IPC handlers
 */
export function registerBrowserHandlers(mainWindow: BrowserWindow): void {
    const browserService = getBrowserService();
    browserService.initialize(mainWindow);

    ipcMain.handle('browser:createView', async (_, id: string, options?: CreateViewOptions) => {
        try {
            return { success: true, viewId: browserService.createView(id, options) };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('browser:destroyView', async (_, id: string) => {
        try {
            browserService.destroyView(id);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('browser:setActiveView', async (_, id: string) => {
        try {
            const result = browserService.setActiveView(id);

            // B012-FIX: Re-raise sidebar overlay to maintain z-order invariant.
            // setActiveView calls addChildView(browserView) which puts the browser
            // ABOVE the sidebar. We must re-raise the sidebar to stay on top.
            getSidebarOverlayService().raiseToTop();

            return { success: result };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('browser:getActiveViewId', async () => {
        return { success: true, viewId: browserService.getActiveViewId() };
    });

    ipcMain.handle('browser:setBounds', async (_, bounds: ViewBounds) => {
        try {
            browserService.setBounds(bounds);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('browser:loadURL', async (_, id: string, url: string) => {
        try {
            await browserService.loadURL(id, url);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('browser:goBack', async (_, id: string) => {
        try {
            await browserService.goBack(id);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('browser:goForward', async (_, id: string) => {
        try {
            await browserService.goForward(id);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('browser:reload', async (_, id: string) => {
        try {
            await browserService.reload(id);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('browser:stop', async (_, id: string) => {
        try {
            browserService.stop(id);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('browser:getViewState', async (_, id: string) => {
        try {
            const state = browserService.getViewState(id);
            return { success: true, state };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('browser:setVisibility', async (_, id: string, visible: boolean) => {
        try {
            browserService.setViewVisibility(id, visible);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('browser:getViewCount', async () => {
        return { success: true, count: browserService.getViewCount() };
    });

    console.log('[BrowserHandlers] Registered');
}

/**
 * Unregister browser IPC handlers (for testing/cleanup)
 */
export function unregisterBrowserHandlers(): void {
    const channels = [
        'browser:createView',
        'browser:destroyView',
        'browser:setActiveView',
        'browser:getActiveViewId',
        'browser:setBounds',
        'browser:loadURL',
        'browser:goBack',
        'browser:goForward',
        'browser:reload',
        'browser:stop',
        'browser:getViewState',
        'browser:setVisibility',
        'browser:getViewCount',
    ];

    for (const channel of channels) {
        ipcMain.removeHandler(channel);
    }

    console.log('[BrowserHandlers] Unregistered');
}
