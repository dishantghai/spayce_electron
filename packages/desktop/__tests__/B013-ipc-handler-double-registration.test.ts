import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * B013: IPC Handler Double-Registration Crash After macOS Hibernation + CMD+R
 *
 * Root Cause: registerBrowserHandlers() and registerSidebarOverlayHandlers() are called
 * twice — once in app.whenReady() -> initialize(), and again in app.on('activate') when
 * macOS destroys the window during prolonged hibernation. Electron's ipcMain.handle()
 * throws "Attempted to register a second handler" if a handler already exists for a channel.
 *
 * Fix: Make both register functions idempotent by removing existing handlers before
 * registering new ones.
 *
 * Evidence:
 * - Error: "Attempted to register a second handler for 'browser:createView'"
 * - Stack: registerBrowserHandlers -> App.<anonymous> (app.on('activate') in index.ts:113)
 * - unregisterBrowserHandlers() exists (browserHandlers.ts:141) but is never called in production
 * - unregisterSidebarOverlayHandlers() exists (sidebarOverlayHandlers.ts:182) but is never called in production
 */

// Track registered handlers to simulate real Electron ipcMain behavior
const registeredHandlers = new Map<string, Function>();
const registeredListeners = new Map<string, Function[]>();

const mockIpcMain = {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn(),
    removeAllListeners: vi.fn(),
};

vi.mock('electron', () => ({
    ipcMain: mockIpcMain,
    BrowserWindow: vi.fn(),
}));

// Mock BrowserService
const mockBrowserService = {
    initialize: vi.fn(),
    createView: vi.fn(),
    destroyView: vi.fn(),
    setActiveView: vi.fn(),
    getActiveViewId: vi.fn(),
    setBounds: vi.fn(),
    loadURL: vi.fn(),
    goBack: vi.fn(),
    goForward: vi.fn(),
    reload: vi.fn(),
    stop: vi.fn(),
    getViewState: vi.fn(),
    setViewVisibility: vi.fn(),
    getViewCount: vi.fn(),
};

vi.mock('../src/main/services/BrowserService', () => ({
    getBrowserService: () => mockBrowserService,
}));

// Mock SidebarOverlayService
const mockSidebarService = {
    initialize: vi.fn(),
    show: vi.fn().mockResolvedValue(undefined),
    showInstant: vi.fn().mockResolvedValue(undefined),
    hide: vi.fn().mockResolvedValue(undefined),
    hideInstant: vi.fn(),
    toggle: vi.fn().mockResolvedValue(true),
    getIsVisible: vi.fn().mockReturnValue(false),
    setFloatingMode: vi.fn(),
    sendStateUpdate: vi.fn(),
    destroy: vi.fn(),
    handleSidebarReady: vi.fn(),
    raiseToTop: vi.fn(),
};

vi.mock('../src/main/services/SidebarOverlayService', () => ({
    getSidebarOverlayService: () => mockSidebarService,
}));

function setupMockImplementations() {
    // Simulate real Electron: ipcMain.handle() throws on duplicate channel
    mockIpcMain.handle.mockImplementation((channel: string, handler: Function) => {
        if (registeredHandlers.has(channel)) {
            throw new Error(`Attempted to register a second handler for '${channel}'`);
        }
        registeredHandlers.set(channel, handler);
    });

    mockIpcMain.removeHandler.mockImplementation((channel: string) => {
        registeredHandlers.delete(channel);
    });

    // ipcMain.on() accumulates listeners (does NOT throw on duplicates)
    mockIpcMain.on.mockImplementation((channel: string, handler: Function) => {
        const existing = registeredListeners.get(channel) || [];
        existing.push(handler);
        registeredListeners.set(channel, existing);
    });

    mockIpcMain.removeAllListeners.mockImplementation((channel: string) => {
        registeredListeners.delete(channel);
    });
}

describe('B013: IPC Handler Double-Registration Crash', () => {
    let registerBrowserHandlers: any;
    let registerSidebarOverlayHandlers: any;
    let mockMainWindow: any;

    beforeEach(async () => {
        registeredHandlers.clear();
        registeredListeners.clear();
        vi.clearAllMocks();
        setupMockImplementations();

        mockMainWindow = {
            webContents: { send: vi.fn(), isDestroyed: vi.fn().mockReturnValue(false) },
            contentView: { addChildView: vi.fn(), removeChildView: vi.fn() },
        };

        const browserModule = await import('../src/main/ipc/browserHandlers');
        registerBrowserHandlers = browserModule.registerBrowserHandlers;

        const sidebarModule = await import('../src/main/ipc/sidebarOverlayHandlers');
        registerSidebarOverlayHandlers = sidebarModule.registerSidebarOverlayHandlers;
    });

    describe('Browser Handlers Idempotent Registration', () => {
        it('should NOT throw when registerBrowserHandlers is called twice (B013 crash scenario)', () => {
            // First call: app.whenReady() -> initialize()
            registerBrowserHandlers(mockMainWindow);

            // Second call: app.on('activate') after macOS hibernation destroys window
            expect(() => registerBrowserHandlers(mockMainWindow)).not.toThrow();
        });

        it('should call removeHandler for all 13 channels before re-registering', () => {
            registerBrowserHandlers(mockMainWindow);
            mockIpcMain.removeHandler.mockClear();

            registerBrowserHandlers(mockMainWindow);

            const expectedChannels = [
                'browser:createView', 'browser:destroyView', 'browser:setActiveView',
                'browser:getActiveViewId', 'browser:setBounds', 'browser:loadURL',
                'browser:goBack', 'browser:goForward', 'browser:reload',
                'browser:stop', 'browser:getViewState', 'browser:setVisibility',
                'browser:getViewCount',
            ];

            expectedChannels.forEach(channel => {
                expect(mockIpcMain.removeHandler).toHaveBeenCalledWith(channel);
            });
        });

        it('should re-initialize BrowserService with new window on second call', () => {
            const window1 = { ...mockMainWindow, _id: 1 };
            const window2 = { ...mockMainWindow, _id: 2 };

            registerBrowserHandlers(window1);
            registerBrowserHandlers(window2);

            expect(mockBrowserService.initialize).toHaveBeenCalledTimes(2);
            expect(mockBrowserService.initialize).toHaveBeenLastCalledWith(window2);
        });

        it('should have exactly 13 registered handlers after double registration', () => {
            registerBrowserHandlers(mockMainWindow);
            registerBrowserHandlers(mockMainWindow);

            expect(registeredHandlers.size).toBe(13);
        });
    });

    describe('Sidebar Overlay Handlers Idempotent Registration', () => {
        it('should NOT throw when registerSidebarOverlayHandlers is called twice', () => {
            registerSidebarOverlayHandlers(mockMainWindow);

            expect(() => registerSidebarOverlayHandlers(mockMainWindow)).not.toThrow();
        });

        it('should call removeHandler for all 6 handle channels before re-registering', () => {
            registerSidebarOverlayHandlers(mockMainWindow);
            mockIpcMain.removeHandler.mockClear();

            registerSidebarOverlayHandlers(mockMainWindow);

            const expectedChannels = [
                'sidebar-overlay:show', 'sidebar-overlay:hide',
                'sidebar-overlay:toggle', 'sidebar-overlay:getVisibility',
                'sidebar-overlay:showInstant', 'sidebar-overlay:hideInstant',
            ];

            expectedChannels.forEach(channel => {
                expect(mockIpcMain.removeHandler).toHaveBeenCalledWith(channel);
            });
        });

        it('should call removeAllListeners for all 3 on-channels before re-registering', () => {
            registerSidebarOverlayHandlers(mockMainWindow);
            mockIpcMain.removeAllListeners.mockClear();

            registerSidebarOverlayHandlers(mockMainWindow);

            expect(mockIpcMain.removeAllListeners).toHaveBeenCalledWith('sidebar-overlay:sync-state');
            expect(mockIpcMain.removeAllListeners).toHaveBeenCalledWith('sidebar-overlay:action');
            expect(mockIpcMain.removeAllListeners).toHaveBeenCalledWith('sidebar-overlay:set-mode');
        });

        it('should NOT accumulate duplicate ipcMain.on listeners on double registration', () => {
            registerSidebarOverlayHandlers(mockMainWindow);
            registerSidebarOverlayHandlers(mockMainWindow);

            // Each on-channel should have exactly 1 listener, not 2
            expect(registeredListeners.get('sidebar-overlay:sync-state')?.length).toBe(1);
            expect(registeredListeners.get('sidebar-overlay:action')?.length).toBe(1);
            expect(registeredListeners.get('sidebar-overlay:set-mode')?.length).toBe(1);
        });

        it('should NOT call service.destroy() during re-registration', () => {
            registerSidebarOverlayHandlers(mockMainWindow);
            mockSidebarService.destroy.mockClear();

            registerSidebarOverlayHandlers(mockMainWindow);

            // destroy should NOT be called during re-registration
            // (it's only for full cleanup via unregisterSidebarOverlayHandlers)
            expect(mockSidebarService.destroy).not.toHaveBeenCalled();
        });

        it('should re-initialize sidebar service with new window on second call', () => {
            const window1 = { ...mockMainWindow, _id: 1 };
            const window2 = { ...mockMainWindow, _id: 2 };

            registerSidebarOverlayHandlers(window1);
            registerSidebarOverlayHandlers(window2);

            expect(mockSidebarService.initialize).toHaveBeenCalledTimes(2);
            expect(mockSidebarService.initialize).toHaveBeenLastCalledWith(window2);
        });
    });

    describe('Full Activation Flow (macOS Hibernation Recovery)', () => {
        it('should survive initialize() followed by app.on(activate) re-registration', () => {
            // Step 1: app.whenReady() -> initialize() registers both
            registerBrowserHandlers(mockMainWindow);
            registerSidebarOverlayHandlers(mockMainWindow);

            // Step 2: macOS hibernation destroys window, user opens app
            // Step 3: app.on('activate') -> create new window -> register both again
            const newWindow = { ...mockMainWindow, _id: 'new-window' };

            expect(() => {
                registerBrowserHandlers(newWindow);
                registerSidebarOverlayHandlers(newWindow);
            }).not.toThrow();
        });

        it('should work correctly after triple registration', () => {
            registerBrowserHandlers(mockMainWindow);
            registerSidebarOverlayHandlers(mockMainWindow);

            registerBrowserHandlers(mockMainWindow);
            registerSidebarOverlayHandlers(mockMainWindow);

            expect(() => {
                registerBrowserHandlers(mockMainWindow);
                registerSidebarOverlayHandlers(mockMainWindow);
            }).not.toThrow();

            // 13 browser + 6 sidebar handle channels
            expect(registeredHandlers.size).toBe(13 + 6);
        });
    });
});
