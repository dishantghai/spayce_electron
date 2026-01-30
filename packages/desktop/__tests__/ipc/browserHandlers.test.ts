import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock ipcMain
const mockIpcMain = {
    handle: vi.fn(),
    removeHandler: vi.fn(),
};

vi.mock('electron', () => ({
    ipcMain: mockIpcMain,
    BrowserWindow: vi.fn(),
}));

vi.mock('../../src/main/services/BrowserService', () => ({
    getBrowserService: vi.fn(),
}));

// Reference for tests
const ipcMain = mockIpcMain;

describe('Browser IPC Handlers', () => {
    let registerBrowserHandlers: any;
    let unregisterBrowserHandlers: any;
    let getBrowserService: any;
    let mockBrowserService: any;
    let mockMainWindow: any;
    let handlers: Map<string, Function>;

    beforeEach(async () => {
        vi.clearAllMocks();
        handlers = new Map();

        mockBrowserService = {
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

        mockMainWindow = {
            on: vi.fn(),
            webContents: {
                send: vi.fn(),
            },
        };

        const browserServiceModule = await import('../../src/main/services/BrowserService');
        getBrowserService = browserServiceModule.getBrowserService;
        vi.mocked(getBrowserService).mockReturnValue(mockBrowserService);

        vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler: Function) => {
            handlers.set(channel, handler);
            return undefined as any;
        });

        const handlersModule = await import('../../src/main/ipc/browserHandlers');
        registerBrowserHandlers = handlersModule.registerBrowserHandlers;
        unregisterBrowserHandlers = handlersModule.unregisterBrowserHandlers;
    });

    afterEach(() => {
        handlers.clear();
    });

    describe('Handler Registration', () => {
        it('should register all browser IPC handlers', () => {
            registerBrowserHandlers(mockMainWindow);

            const expectedChannels = [
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

            expectedChannels.forEach(channel => {
                expect(handlers.has(channel)).toBe(true);
            });
        });

        it('should initialize browser service with main window', () => {
            registerBrowserHandlers(mockMainWindow);

            expect(mockBrowserService.initialize).toHaveBeenCalledWith(mockMainWindow);
        });

        it('should unregister all handlers', () => {
            registerBrowserHandlers(mockMainWindow);
            unregisterBrowserHandlers();

            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:createView');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:destroyView');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:setActiveView');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:getActiveViewId');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:setBounds');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:loadURL');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:goBack');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:goForward');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:reload');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:stop');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:getViewState');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:setVisibility');
            expect(ipcMain.removeHandler).toHaveBeenCalledWith('browser:getViewCount');
        });
    });

    describe('browser:createView', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should create view successfully', async () => {
            mockBrowserService.createView.mockReturnValue('view-123');

            const handler = handlers.get('browser:createView')!;
            const result = await handler({}, 'view-123', { url: 'https://example.com' });

            expect(mockBrowserService.createView).toHaveBeenCalledWith('view-123', { url: 'https://example.com' });
            expect(result).toEqual({ success: true, viewId: 'view-123' });
        });

        it('should handle creation error', async () => {
            mockBrowserService.createView.mockImplementation(() => {
                throw new Error('Creation failed');
            });

            const handler = handlers.get('browser:createView')!;
            const result = await handler({}, 'view-123');

            expect(result).toEqual({ success: false, error: 'Creation failed' });
        });

        it('should create view without options', async () => {
            mockBrowserService.createView.mockReturnValue('view-123');

            const handler = handlers.get('browser:createView')!;
            const result = await handler({}, 'view-123');

            expect(mockBrowserService.createView).toHaveBeenCalledWith('view-123', undefined);
            expect(result.success).toBe(true);
        });
    });

    describe('browser:destroyView', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should destroy view successfully', async () => {
            const handler = handlers.get('browser:destroyView')!;
            const result = await handler({}, 'view-123');

            expect(mockBrowserService.destroyView).toHaveBeenCalledWith('view-123');
            expect(result).toEqual({ success: true });
        });

        it('should handle destroy error', async () => {
            mockBrowserService.destroyView.mockImplementation(() => {
                throw new Error('Destroy failed');
            });

            const handler = handlers.get('browser:destroyView')!;
            const result = await handler({}, 'view-123');

            expect(result).toEqual({ success: false, error: 'Destroy failed' });
        });
    });

    describe('browser:setActiveView', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should set active view successfully', async () => {
            mockBrowserService.setActiveView.mockReturnValue(true);

            const handler = handlers.get('browser:setActiveView')!;
            const result = await handler({}, 'view-123');

            expect(mockBrowserService.setActiveView).toHaveBeenCalledWith('view-123');
            expect(result).toEqual({ success: true });
        });

        it('should return false when view not found', async () => {
            mockBrowserService.setActiveView.mockReturnValue(false);

            const handler = handlers.get('browser:setActiveView')!;
            const result = await handler({}, 'non-existent');

            expect(result).toEqual({ success: false });
        });

        it('should handle setActiveView error', async () => {
            mockBrowserService.setActiveView.mockImplementation(() => {
                throw new Error('Set active failed');
            });

            const handler = handlers.get('browser:setActiveView')!;
            const result = await handler({}, 'view-123');

            expect(result).toEqual({ success: false, error: 'Set active failed' });
        });
    });

    describe('browser:getActiveViewId', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should return active view ID', async () => {
            mockBrowserService.getActiveViewId.mockReturnValue('view-123');

            const handler = handlers.get('browser:getActiveViewId')!;
            const result = await handler({});

            expect(result).toEqual({ success: true, viewId: 'view-123' });
        });

        it('should return null when no active view', async () => {
            mockBrowserService.getActiveViewId.mockReturnValue(null);

            const handler = handlers.get('browser:getActiveViewId')!;
            const result = await handler({});

            expect(result).toEqual({ success: true, viewId: null });
        });
    });

    describe('browser:setBounds', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should set bounds successfully', async () => {
            const bounds = { x: 100, y: 50, width: 800, height: 600 };

            const handler = handlers.get('browser:setBounds')!;
            const result = await handler({}, bounds);

            expect(mockBrowserService.setBounds).toHaveBeenCalledWith(bounds);
            expect(result).toEqual({ success: true });
        });

        it('should handle setBounds error', async () => {
            mockBrowserService.setBounds.mockImplementation(() => {
                throw new Error('Invalid bounds');
            });

            const handler = handlers.get('browser:setBounds')!;
            const result = await handler({}, { x: 0, y: 0, width: 0, height: 0 });

            expect(result).toEqual({ success: false, error: 'Invalid bounds' });
        });
    });

    describe('browser:loadURL', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should load URL successfully', async () => {
            mockBrowserService.loadURL.mockResolvedValue(undefined);

            const handler = handlers.get('browser:loadURL')!;
            const result = await handler({}, 'view-123', 'https://example.com');

            expect(mockBrowserService.loadURL).toHaveBeenCalledWith('view-123', 'https://example.com');
            expect(result).toEqual({ success: true });
        });

        it('should handle loadURL error', async () => {
            mockBrowserService.loadURL.mockRejectedValue(new Error('Invalid URL'));

            const handler = handlers.get('browser:loadURL')!;
            const result = await handler({}, 'view-123', 'javascript:alert(1)');

            expect(result).toEqual({ success: false, error: 'Invalid URL' });
        });

        it('should handle view not found error', async () => {
            mockBrowserService.loadURL.mockRejectedValue(new Error('View not found'));

            const handler = handlers.get('browser:loadURL')!;
            const result = await handler({}, 'non-existent', 'https://example.com');

            expect(result).toEqual({ success: false, error: 'View not found' });
        });
    });

    describe('browser:goBack', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should go back successfully', async () => {
            mockBrowserService.goBack.mockResolvedValue(undefined);

            const handler = handlers.get('browser:goBack')!;
            const result = await handler({}, 'view-123');

            expect(mockBrowserService.goBack).toHaveBeenCalledWith('view-123');
            expect(result).toEqual({ success: true });
        });

        it('should handle goBack error', async () => {
            mockBrowserService.goBack.mockRejectedValue(new Error('View not found'));

            const handler = handlers.get('browser:goBack')!;
            const result = await handler({}, 'non-existent');

            expect(result).toEqual({ success: false, error: 'View not found' });
        });
    });

    describe('browser:goForward', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should go forward successfully', async () => {
            mockBrowserService.goForward.mockResolvedValue(undefined);

            const handler = handlers.get('browser:goForward')!;
            const result = await handler({}, 'view-123');

            expect(mockBrowserService.goForward).toHaveBeenCalledWith('view-123');
            expect(result).toEqual({ success: true });
        });

        it('should handle goForward error', async () => {
            mockBrowserService.goForward.mockRejectedValue(new Error('View not found'));

            const handler = handlers.get('browser:goForward')!;
            const result = await handler({}, 'non-existent');

            expect(result).toEqual({ success: false, error: 'View not found' });
        });
    });

    describe('browser:reload', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should reload successfully', async () => {
            mockBrowserService.reload.mockResolvedValue(undefined);

            const handler = handlers.get('browser:reload')!;
            const result = await handler({}, 'view-123');

            expect(mockBrowserService.reload).toHaveBeenCalledWith('view-123');
            expect(result).toEqual({ success: true });
        });

        it('should handle reload error', async () => {
            mockBrowserService.reload.mockRejectedValue(new Error('View not found'));

            const handler = handlers.get('browser:reload')!;
            const result = await handler({}, 'non-existent');

            expect(result).toEqual({ success: false, error: 'View not found' });
        });
    });

    describe('browser:stop', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should stop successfully', async () => {
            const handler = handlers.get('browser:stop')!;
            const result = await handler({}, 'view-123');

            expect(mockBrowserService.stop).toHaveBeenCalledWith('view-123');
            expect(result).toEqual({ success: true });
        });

        it('should handle stop error', async () => {
            mockBrowserService.stop.mockImplementation(() => {
                throw new Error('View not found');
            });

            const handler = handlers.get('browser:stop')!;
            const result = await handler({}, 'non-existent');

            expect(result).toEqual({ success: false, error: 'View not found' });
        });
    });

    describe('browser:getViewState', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should return view state', async () => {
            const mockState = {
                id: 'view-123',
                url: 'https://example.com',
                title: 'Example',
                isLoading: false,
                loadingProgress: 1,
                canGoBack: true,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
            };
            mockBrowserService.getViewState.mockReturnValue(mockState);

            const handler = handlers.get('browser:getViewState')!;
            const result = await handler({}, 'view-123');

            expect(mockBrowserService.getViewState).toHaveBeenCalledWith('view-123');
            expect(result).toEqual({ success: true, state: mockState });
        });

        it('should return null state for non-existent view', async () => {
            mockBrowserService.getViewState.mockReturnValue(null);

            const handler = handlers.get('browser:getViewState')!;
            const result = await handler({}, 'non-existent');

            expect(result).toEqual({ success: true, state: null });
        });

        it('should handle getViewState error', async () => {
            mockBrowserService.getViewState.mockImplementation(() => {
                throw new Error('State error');
            });

            const handler = handlers.get('browser:getViewState')!;
            const result = await handler({}, 'view-123');

            expect(result).toEqual({ success: false, error: 'State error' });
        });
    });

    describe('browser:setVisibility', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should set visibility to true', async () => {
            const handler = handlers.get('browser:setVisibility')!;
            const result = await handler({}, 'view-123', true);

            expect(mockBrowserService.setViewVisibility).toHaveBeenCalledWith('view-123', true);
            expect(result).toEqual({ success: true });
        });

        it('should set visibility to false', async () => {
            const handler = handlers.get('browser:setVisibility')!;
            const result = await handler({}, 'view-123', false);

            expect(mockBrowserService.setViewVisibility).toHaveBeenCalledWith('view-123', false);
            expect(result).toEqual({ success: true });
        });

        it('should handle setVisibility error', async () => {
            mockBrowserService.setViewVisibility.mockImplementation(() => {
                throw new Error('Visibility error');
            });

            const handler = handlers.get('browser:setVisibility')!;
            const result = await handler({}, 'view-123', true);

            expect(result).toEqual({ success: false, error: 'Visibility error' });
        });
    });

    describe('browser:getViewCount', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should return view count', async () => {
            mockBrowserService.getViewCount.mockReturnValue(5);

            const handler = handlers.get('browser:getViewCount')!;
            const result = await handler({});

            expect(result).toEqual({ success: true, count: 5 });
        });

        it('should return 0 when no views', async () => {
            mockBrowserService.getViewCount.mockReturnValue(0);

            const handler = handlers.get('browser:getViewCount')!;
            const result = await handler({});

            expect(result).toEqual({ success: true, count: 0 });
        });
    });

    describe('Response Format Consistency', () => {
        beforeEach(() => {
            registerBrowserHandlers(mockMainWindow);
        });

        it('should return consistent success response format', async () => {
            mockBrowserService.createView.mockReturnValue('view-123');

            const handler = handlers.get('browser:createView')!;
            const result = await handler({}, 'view-123');

            expect(result).toHaveProperty('success');
            expect(typeof result.success).toBe('boolean');
        });

        it('should return consistent error response format', async () => {
            mockBrowserService.createView.mockImplementation(() => {
                throw new Error('Test error');
            });

            const handler = handlers.get('browser:createView')!;
            const result = await handler({}, 'view-123');

            expect(result).toHaveProperty('success', false);
            expect(result).toHaveProperty('error');
            expect(typeof result.error).toBe('string');
        });
    });
});
