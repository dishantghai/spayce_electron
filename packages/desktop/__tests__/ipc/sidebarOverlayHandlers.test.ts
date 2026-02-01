import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Tests for sidebarOverlayHandlers
 *
 * REGRESSION PREVENTION:
 * - Commit 17fa3d0: IPC handlers for overlay show/hide/toggle
 * - Commit 06130e5: Focus change action handling
 * - Commit f936462: State synchronization optimization
 *
 * Critical behaviors:
 * 1. IPC handlers return success/error correctly
 * 2. State sync forwards to overlay WebContents
 * 3. Actions forward to main renderer
 * 4. Mouse tracking enabled/disabled based on overlay mode
 */

const createMockWebContents = () => ({
    send: vi.fn(),
    isDestroyed: vi.fn().mockReturnValue(false),
    close: vi.fn(),
});

const createMockSidebarOverlayService = () => ({
    initialize: vi.fn(),
    show: vi.fn().mockResolvedValue(undefined),
    hide: vi.fn().mockResolvedValue(undefined),
    hideInstant: vi.fn(),
    toggle: vi.fn().mockResolvedValue(true),
    getIsVisible: vi.fn().mockReturnValue(false),
    setFloatingMode: vi.fn(),
    sendStateUpdate: vi.fn(),
    destroy: vi.fn(),
    getWebContents: vi.fn().mockReturnValue(createMockWebContents()),
});

const createMockBrowserWindow = () => ({
    webContents: createMockWebContents(),
    contentView: {
        addChildView: vi.fn(),
        removeChildView: vi.fn(),
    },
});

// Mock electron
const mockIpcMain = {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn(),
    removeAllListeners: vi.fn(),
};

const MockBrowserWindow = vi.fn().mockImplementation(() => createMockBrowserWindow());

vi.mock('electron', () => ({
    ipcMain: mockIpcMain,
    BrowserWindow: MockBrowserWindow,
}));

// Mock SidebarOverlayService
const mockService = createMockSidebarOverlayService();

vi.mock('../../src/main/services/SidebarOverlayService', () => ({
    getSidebarOverlayService: () => mockService,
}));

describe('sidebarOverlayHandlers', () => {
    let registerSidebarOverlayHandlers: any;
    let unregisterSidebarOverlayHandlers: any;
    let mockMainWindow: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Reset mock service
        Object.assign(mockService, createMockSidebarOverlayService());

        const module = await import('../../src/main/ipc/sidebarOverlayHandlers');
        registerSidebarOverlayHandlers = module.registerSidebarOverlayHandlers;
        unregisterSidebarOverlayHandlers = module.unregisterSidebarOverlayHandlers;

        mockMainWindow = createMockBrowserWindow();
    });

    describe('Registration', () => {
        it('should initialize service with main window', () => {
            registerSidebarOverlayHandlers(mockMainWindow);

            expect(mockService.initialize).toHaveBeenCalledWith(mockMainWindow);
        });

        it('should register all IPC handlers', () => {
            registerSidebarOverlayHandlers(mockMainWindow);

            const registeredChannels = mockIpcMain.handle.mock.calls.map((call) => call[0]);

            expect(registeredChannels).toContain('sidebar-overlay:show');
            expect(registeredChannels).toContain('sidebar-overlay:hide');
            expect(registeredChannels).toContain('sidebar-overlay:hideInstant');
            expect(registeredChannels).toContain('sidebar-overlay:toggle');
            expect(registeredChannels).toContain('sidebar-overlay:getVisibility');
        });

        it('should register IPC event listeners', () => {
            registerSidebarOverlayHandlers(mockMainWindow);

            const registeredListeners = mockIpcMain.on.mock.calls.map((call) => call[0]);

            expect(registeredListeners).toContain('sidebar-overlay:sync-state');
            expect(registeredListeners).toContain('sidebar-overlay:action');
            expect(registeredListeners).toContain('sidebar-overlay:set-mode');
        });
    });

    describe('Show Handler', () => {
        beforeEach(() => {
            registerSidebarOverlayHandlers(mockMainWindow);
        });

        it('should call service.show() when invoked', async () => {
            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:show'
            )?.[1];

            await handler();

            expect(mockService.show).toHaveBeenCalled();
        });

        it('should return success response with visibility state', async () => {
            mockService.show.mockResolvedValue(undefined);
            mockService.getIsVisible.mockReturnValue(true);

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:show'
            )?.[1];

            const result = await handler();

            expect(result).toEqual({
                success: true,
                isVisible: true,
            });
        });

        it('should return error response when show fails', async () => {
            mockService.show.mockRejectedValue(new Error('Show failed'));

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:show'
            )?.[1];

            const result = await handler();

            expect(result).toEqual({
                success: false,
                error: 'Show failed',
            });
        });
    });

    describe('Hide Handler', () => {
        beforeEach(() => {
            registerSidebarOverlayHandlers(mockMainWindow);
        });

        it('should call service.hide() when invoked', async () => {
            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:hide'
            )?.[1];

            await handler();

            expect(mockService.hide).toHaveBeenCalled();
        });

        it('should return success response with visibility state', async () => {
            mockService.hide.mockResolvedValue(undefined);
            mockService.getIsVisible.mockReturnValue(false);

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:hide'
            )?.[1];

            const result = await handler();

            expect(result).toEqual({
                success: true,
                isVisible: false,
            });
        });

        it('should return error response when hide fails', async () => {
            mockService.hide.mockRejectedValue(new Error('Hide failed'));

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:hide'
            )?.[1];

            const result = await handler();

            expect(result).toEqual({
                success: false,
                error: 'Hide failed',
            });
        });
    });

    describe('Hide Instant Handler', () => {
        beforeEach(() => {
            registerSidebarOverlayHandlers(mockMainWindow);
        });

        it('should call service.hideInstant() when invoked', async () => {
            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:hideInstant'
            )?.[1];

            await handler();

            expect(mockService.hideInstant).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            mockService.getIsVisible.mockReturnValue(false);

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:hideInstant'
            )?.[1];

            const result = await handler();

            expect(result).toEqual({
                success: true,
                isVisible: false,
            });
        });

        it('should handle errors gracefully', async () => {
            mockService.hideInstant.mockImplementation(() => {
                throw new Error('Hide instant failed');
            });

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:hideInstant'
            )?.[1];

            const result = await handler();

            expect(result).toEqual({
                success: false,
                error: 'Hide instant failed',
            });
        });
    });

    describe('Toggle Handler', () => {
        beforeEach(() => {
            registerSidebarOverlayHandlers(mockMainWindow);
        });

        it('should call service.toggle() when invoked', async () => {
            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:toggle'
            )?.[1];

            await handler();

            expect(mockService.toggle).toHaveBeenCalled();
        });

        it('should return new visibility state', async () => {
            mockService.toggle.mockResolvedValue(true);

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:toggle'
            )?.[1];

            const result = await handler();

            expect(result).toEqual({
                success: true,
                isVisible: true,
            });
        });
    });

    describe('Get Visibility Handler', () => {
        beforeEach(() => {
            registerSidebarOverlayHandlers(mockMainWindow);
        });

        it('should return current visibility state', () => {
            mockService.getIsVisible.mockReturnValue(true);

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:getVisibility'
            )?.[1];

            const result = handler();

            expect(result).toEqual({
                success: true,
                isVisible: true,
            });
        });

        it('should return false when hidden', () => {
            mockService.getIsVisible.mockReturnValue(false);

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:getVisibility'
            )?.[1];

            const result = handler();

            expect(result).toEqual({
                success: true,
                isVisible: false,
            });
        });
    });

    describe('State Sync Event (Commit f936462)', () => {
        beforeEach(() => {
            registerSidebarOverlayHandlers(mockMainWindow);
        });

        it('should forward state to overlay WebContents', () => {
            const listener = mockIpcMain.on.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:sync-state'
            )?.[1];

            const testState = {
                spaces: [],
                activeSpaceIndex: 0,
                selectedItemId: null,
                expandedIds: [],
                sidebarMode: 'floating',
                activeTab: 'browser',
            };

            listener({}, testState);

            expect(mockService.sendStateUpdate).toHaveBeenCalledWith(testState);
        });

        it('should enable floating mode when in overlay mode (floating + browser)', () => {
            const listener = mockIpcMain.on.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:sync-state'
            )?.[1];

            const overlayState = {
                spaces: [],
                activeSpaceIndex: 0,
                selectedItemId: null,
                expandedIds: [],
                sidebarMode: 'floating',
                activeTab: 'browser',
            };

            listener({}, overlayState);

            expect(mockService.setFloatingMode).toHaveBeenCalledWith(true);
        });

        it('should disable floating mode when in fixed mode', () => {
            const listener = mockIpcMain.on.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:sync-state'
            )?.[1];

            const fixedState = {
                spaces: [],
                activeSpaceIndex: 0,
                selectedItemId: null,
                expandedIds: [],
                sidebarMode: 'fixed',
                activeTab: 'browser',
            };

            listener({}, fixedState);

            expect(mockService.setFloatingMode).toHaveBeenCalledWith(false);
        });

        it('should disable floating mode when not on browser tab', () => {
            const listener = mockIpcMain.on.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:sync-state'
            )?.[1];

            const spacesTabState = {
                spaces: [],
                activeSpaceIndex: 0,
                selectedItemId: null,
                expandedIds: [],
                sidebarMode: 'floating',
                activeTab: 'spaces',
            };

            listener({}, spacesTabState);

            expect(mockService.setFloatingMode).toHaveBeenCalledWith(false);
        });
    });

    describe('Action Forwarding (Commit 06130e5)', () => {
        beforeEach(() => {
            registerSidebarOverlayHandlers(mockMainWindow);
        });

        it('should forward FOCUS_CHANGE action to main renderer', () => {
            const listener = mockIpcMain.on.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:action'
            )?.[1];

            const focusAction = {
                type: 'FOCUS_CHANGE',
                payload: { hasFocus: true },
            };

            listener({}, focusAction);

            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                'sidebar:action',
                focusAction
            );
        });

        it('should forward ITEM_CLICK action to main renderer', () => {
            const listener = mockIpcMain.on.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:action'
            )?.[1];

            const clickAction = {
                type: 'ITEM_CLICK',
                payload: { itemId: 'item-1', spaceId: 'space-1' },
            };

            listener({}, clickAction);

            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                'sidebar:action',
                clickAction
            );
        });

        it('should forward EXPANDED_IDS_CHANGE action to main renderer', () => {
            const listener = mockIpcMain.on.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:action'
            )?.[1];

            const expandAction = {
                type: 'EXPANDED_IDS_CHANGE',
                payload: { expandedIds: ['folder-1', 'folder-2'] },
            };

            listener({}, expandAction);

            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                'sidebar:action',
                expandAction
            );
        });

        it('should forward MODE_TOGGLE action to main renderer', () => {
            const listener = mockIpcMain.on.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:action'
            )?.[1];

            const modeAction = {
                type: 'MODE_TOGGLE',
                payload: {},
            };

            listener({}, modeAction);

            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                'sidebar:action',
                modeAction
            );
        });
    });

    describe('Set Mode Event', () => {
        beforeEach(() => {
            registerSidebarOverlayHandlers(mockMainWindow);
        });

        it('should enable floating mode when set to floating', () => {
            const listener = mockIpcMain.on.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:set-mode'
            )?.[1];

            listener({}, 'floating');

            expect(mockService.setFloatingMode).toHaveBeenCalledWith(true);
        });

        it('should disable floating mode when set to fixed', () => {
            const listener = mockIpcMain.on.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:set-mode'
            )?.[1];

            listener({}, 'fixed');

            expect(mockService.setFloatingMode).toHaveBeenCalledWith(false);
        });
    });

    describe('Unregistration', () => {
        it('should destroy service', () => {
            registerSidebarOverlayHandlers(mockMainWindow);

            unregisterSidebarOverlayHandlers();

            expect(mockService.destroy).toHaveBeenCalled();
        });

        it('should remove all IPC handlers', () => {
            registerSidebarOverlayHandlers(mockMainWindow);

            unregisterSidebarOverlayHandlers();

            expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('sidebar-overlay:show');
            expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('sidebar-overlay:hide');
            expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('sidebar-overlay:hideInstant');
            expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('sidebar-overlay:toggle');
            expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('sidebar-overlay:getVisibility');
        });

        it('should remove all event listeners', () => {
            registerSidebarOverlayHandlers(mockMainWindow);

            unregisterSidebarOverlayHandlers();

            expect(mockIpcMain.removeAllListeners).toHaveBeenCalledWith('sidebar-overlay:sync-state');
            expect(mockIpcMain.removeAllListeners).toHaveBeenCalledWith('sidebar-overlay:action');
            expect(mockIpcMain.removeAllListeners).toHaveBeenCalledWith('sidebar-overlay:set-mode');
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            registerSidebarOverlayHandlers(mockMainWindow);
        });

        it('should handle show errors', async () => {
            mockService.show.mockRejectedValue(new Error('Cannot show'));

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:show'
            )?.[1];

            const result = await handler();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot show');
        });

        it('should handle hide errors', async () => {
            mockService.hide.mockRejectedValue(new Error('Cannot hide'));

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:hide'
            )?.[1];

            const result = await handler();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot hide');
        });

        it('should handle toggle errors', async () => {
            mockService.toggle.mockRejectedValue(new Error('Cannot toggle'));

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:toggle'
            )?.[1];

            const result = await handler();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot toggle');
        });

        it('should convert non-Error objects to strings', async () => {
            mockService.show.mockRejectedValue('String error');

            const handler = mockIpcMain.handle.mock.calls.find(
                (call) => call[0] === 'sidebar-overlay:show'
            )?.[1];

            const result = await handler();

            expect(result.error).toBe('String error');
        });
    });
});
