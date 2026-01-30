import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Create mock factories
const createMockWebContents = () => ({
    setUserAgent: vi.fn(),
    loadURL: vi.fn().mockResolvedValue(undefined),
    getURL: vi.fn().mockReturnValue('https://www.google.com'),
    getTitle: vi.fn().mockReturnValue('Google'),
    isLoading: vi.fn().mockReturnValue(false),
    canGoBack: vi.fn().mockReturnValue(false),
    canGoForward: vi.fn().mockReturnValue(false),
    goBack: vi.fn(),
    goForward: vi.fn(),
    reload: vi.fn(),
    stop: vi.fn(),
    close: vi.fn(),
    isDestroyed: vi.fn().mockReturnValue(false),
    removeAllListeners: vi.fn(),
    on: vi.fn(),
    send: vi.fn(),
    session: {
        setPermissionRequestHandler: vi.fn(),
    },
    setWindowOpenHandler: vi.fn(),
    getWebPreferences: vi.fn().mockReturnValue({
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
    }),
});

const createMockView = () => ({
    webContents: createMockWebContents(),
    setBounds: vi.fn(),
    setVisible: vi.fn(),
});

const createMockBrowserWindow = () => ({
    contentView: {
        addChildView: vi.fn(),
        removeChildView: vi.fn(),
    },
    webContents: {
        send: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
    },
    on: vi.fn(),
    isDestroyed: vi.fn().mockReturnValue(false),
});

// Mock electron
const MockBrowserWindow = vi.fn().mockImplementation(() => createMockBrowserWindow());
const MockWebContentsView = vi.fn().mockImplementation(() => createMockView());
const mockIpcMain = {
    handle: vi.fn(),
    removeHandler: vi.fn(),
};

vi.mock('electron', () => ({
    BrowserWindow: MockBrowserWindow,
    WebContentsView: MockWebContentsView,
    ipcMain: mockIpcMain,
}));

// References for tests
const WebContentsView = MockWebContentsView;
const BrowserWindow = MockBrowserWindow;
const ipcMain = mockIpcMain;

describe('Browser Integration', () => {
    let BrowserService: any;
    let getBrowserService: any;
    let resetBrowserService: any;
    let registerBrowserHandlers: any;
    let unregisterBrowserHandlers: any;
    let service: any;
    let mockMainWindow: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        MockWebContentsView.mockClear();
        MockBrowserWindow.mockClear();

        const serviceModule = await import('../../src/main/services/BrowserService');
        BrowserService = serviceModule.BrowserService;
        getBrowserService = serviceModule.getBrowserService;
        resetBrowserService = serviceModule.resetBrowserService;

        const handlersModule = await import('../../src/main/ipc/browserHandlers');
        registerBrowserHandlers = handlersModule.registerBrowserHandlers;
        unregisterBrowserHandlers = handlersModule.unregisterBrowserHandlers;

        resetBrowserService();
        service = getBrowserService();
        mockMainWindow = new BrowserWindow();
    });

    afterEach(() => {
        resetBrowserService();
    });

    describe('View Creation and Navigation Flow', () => {
        it('should create view and load URL', async () => {
            service.initialize(mockMainWindow);

            const viewId = service.createView('test-view', { url: 'https://example.com' });

            expect(viewId).toBe('test-view');
            expect(service.getView(viewId)).toBeDefined();

            const mockView = (WebContentsView as any).mock.results[0].value;
            expect(mockView.webContents.loadURL).toHaveBeenCalledWith('https://example.com');
        });

        it('should create multiple views and switch between them', async () => {
            service.initialize(mockMainWindow);

            service.createView('view-1', { url: 'https://site1.com' });
            service.createView('view-2', { url: 'https://site2.com' });
            service.createView('view-3', { url: 'https://site3.com' });

            expect(service.getViewCount()).toBe(3);

            service.setActiveView('view-1');
            expect(service.getActiveViewId()).toBe('view-1');

            service.setActiveView('view-2');
            expect(service.getActiveViewId()).toBe('view-2');

            // Previous view should be removed from content
            expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalled();
        });

        it('should handle full navigation lifecycle', async () => {
            service.initialize(mockMainWindow);

            const viewId = service.createView('nav-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            // Navigate to a URL
            await service.loadURL(viewId, 'https://example.com');
            expect(mockView.webContents.loadURL).toHaveBeenCalledWith('https://example.com');

            // Simulate history available
            mockView.webContents.canGoBack.mockReturnValue(true);
            await service.goBack(viewId);
            expect(mockView.webContents.goBack).toHaveBeenCalled();

            mockView.webContents.canGoForward.mockReturnValue(true);
            await service.goForward(viewId);
            expect(mockView.webContents.goForward).toHaveBeenCalled();

            // Reload
            await service.reload(viewId);
            expect(mockView.webContents.reload).toHaveBeenCalled();

            // Stop
            service.stop(viewId);
            expect(mockView.webContents.stop).toHaveBeenCalled();
        });
    });

    describe('Event Forwarding', () => {
        it('should forward loading events to renderer', () => {
            service.initialize(mockMainWindow);
            service.createView('event-view');

            const mockView = (WebContentsView as any).mock.results[0].value;

            // Find the did-start-loading handler
            const startLoadingCall = mockView.webContents.on.mock.calls.find(
                (call: any[]) => call[0] === 'did-start-loading'
            );
            expect(startLoadingCall).toBeDefined();

            // Simulate loading start
            const startHandler = startLoadingCall[1];
            startHandler();

            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                'browser:loading',
                expect.objectContaining({
                    viewId: 'event-view',
                    isLoading: true,
                })
            );
        });

        it('should forward navigation events to renderer', () => {
            service.initialize(mockMainWindow);
            service.createView('nav-event-view');

            const mockView = (WebContentsView as any).mock.results[0].value;
            mockView.webContents.canGoBack.mockReturnValue(true);
            mockView.webContents.canGoForward.mockReturnValue(false);

            // Find the did-navigate handler
            const navigateCall = mockView.webContents.on.mock.calls.find(
                (call: any[]) => call[0] === 'did-navigate'
            );
            expect(navigateCall).toBeDefined();

            // Simulate navigation
            const navigateHandler = navigateCall[1];
            navigateHandler({}, 'https://navigated.com');

            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                'browser:navigated',
                expect.objectContaining({
                    viewId: 'nav-event-view',
                    url: 'https://navigated.com',
                    canGoBack: true,
                    canGoForward: false,
                    isSecure: true,
                })
            );
        });

        it('should forward title events to renderer', () => {
            service.initialize(mockMainWindow);
            service.createView('title-view');

            const mockView = (WebContentsView as any).mock.results[0].value;

            // Find the page-title-updated handler
            const titleCall = mockView.webContents.on.mock.calls.find(
                (call: any[]) => call[0] === 'page-title-updated'
            );
            expect(titleCall).toBeDefined();

            // Simulate title update
            const titleHandler = titleCall[1];
            titleHandler({}, 'New Page Title');

            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                'browser:title',
                expect.objectContaining({
                    viewId: 'title-view',
                    title: 'New Page Title',
                })
            );
        });

        it('should forward favicon events to renderer', () => {
            service.initialize(mockMainWindow);
            service.createView('favicon-view');

            const mockView = (WebContentsView as any).mock.results[0].value;

            // Find the page-favicon-updated handler
            const faviconCall = mockView.webContents.on.mock.calls.find(
                (call: any[]) => call[0] === 'page-favicon-updated'
            );
            expect(faviconCall).toBeDefined();

            // Simulate favicon update
            const faviconHandler = faviconCall[1];
            faviconHandler({}, ['https://example.com/favicon.ico']);

            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                'browser:favicon',
                expect.objectContaining({
                    viewId: 'favicon-view',
                    faviconUrl: 'https://example.com/favicon.ico',
                })
            );
        });

        it('should forward error events for main frame only', () => {
            service.initialize(mockMainWindow);
            service.createView('error-view');

            const mockView = (WebContentsView as any).mock.results[0].value;

            // Find the did-fail-load handler
            const errorCall = mockView.webContents.on.mock.calls.find(
                (call: any[]) => call[0] === 'did-fail-load'
            );
            expect(errorCall).toBeDefined();

            const errorHandler = errorCall[1];

            // Main frame error should be forwarded
            errorHandler({}, -6, 'ERR_CONNECTION_REFUSED', 'https://failed.com', true);

            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                'browser:error',
                expect.objectContaining({
                    viewId: 'error-view',
                    errorCode: -6,
                    errorDescription: 'ERR_CONNECTION_REFUSED',
                    failedUrl: 'https://failed.com',
                })
            );

            // Reset mock
            mockMainWindow.webContents.send.mockClear();

            // Sub-frame error should NOT be forwarded
            errorHandler({}, -6, 'ERR_CONNECTION_REFUSED', 'https://subframe.com', false);

            expect(mockMainWindow.webContents.send).not.toHaveBeenCalledWith(
                'browser:error',
                expect.anything()
            );
        });
    });

    describe('Cleanup on Window Close', () => {
        it('should cleanup all views on window close', () => {
            service.initialize(mockMainWindow);

            service.createView('view-1');
            service.createView('view-2');
            service.createView('view-3');

            expect(service.getViewCount()).toBe(3);

            // Find the closed handler
            const closedCall = mockMainWindow.on.mock.calls.find(
                (call: any[]) => call[0] === 'closed'
            );
            expect(closedCall).toBeDefined();

            // Simulate window close
            const closedHandler = closedCall[1];
            closedHandler();

            expect(service.getViewCount()).toBe(0);
        });
    });

    describe('Bounds Management Integration', () => {
        it('should apply bounds to active view when set', () => {
            service.initialize(mockMainWindow);

            service.createView('bounds-view');
            service.setActiveView('bounds-view');

            const mockView = (WebContentsView as any).mock.results[0].value;

            service.setBounds({ x: 250, y: 0, width: 1000, height: 800 });

            expect(mockView.setBounds).toHaveBeenCalledWith(
                expect.objectContaining({
                    x: 250,
                    y: 0,
                    width: 1000,
                    height: 800,
                })
            );
        });

        it('should apply stored bounds when view becomes active', () => {
            service.initialize(mockMainWindow);

            // Set bounds before creating view
            service.setBounds({ x: 300, y: 50, width: 900, height: 700 });

            service.createView('delayed-bounds-view');
            service.setActiveView('delayed-bounds-view');

            const mockView = (WebContentsView as any).mock.results[0].value;

            expect(mockView.setBounds).toHaveBeenCalledWith(
                expect.objectContaining({
                    x: 300,
                    y: 50,
                    width: 900,
                    height: 700,
                })
            );
        });
    });

    describe('Security Integration', () => {
        it('should block popup windows and load in current view', () => {
            service.initialize(mockMainWindow);
            service.createView('popup-test-view');

            const mockView = (WebContentsView as any).mock.results[0].value;

            // Get the window open handler
            const windowOpenHandler = mockView.webContents.setWindowOpenHandler.mock.calls[0][0];

            // Simulate popup attempt
            const result = windowOpenHandler({ url: 'https://popup.com' });

            expect(result).toEqual({ action: 'deny' });
            // The URL should be loaded in the current view
            expect(mockView.webContents.loadURL).toHaveBeenCalledWith('https://popup.com');
        });

        it('should handle permission requests with allowlist', () => {
            service.initialize(mockMainWindow);
            service.createView('permission-test-view');

            const mockView = (WebContentsView as any).mock.results[0].value;

            // Get the permission handler
            const permissionHandler = mockView.webContents.session.setPermissionRequestHandler.mock.calls[0][0];

            // Test allowed permissions
            const fullscreenCallback = vi.fn();
            permissionHandler(mockView.webContents, 'fullscreen', fullscreenCallback);
            expect(fullscreenCallback).toHaveBeenCalledWith(true);

            const clipboardCallback = vi.fn();
            permissionHandler(mockView.webContents, 'clipboard-read', clipboardCallback);
            expect(clipboardCallback).toHaveBeenCalledWith(true);

            // Test denied permissions
            const cameraCallback = vi.fn();
            permissionHandler(mockView.webContents, 'camera', cameraCallback);
            expect(cameraCallback).toHaveBeenCalledWith(false);

            const microphoneCallback = vi.fn();
            permissionHandler(mockView.webContents, 'microphone', microphoneCallback);
            expect(microphoneCallback).toHaveBeenCalledWith(false);

            const geolocationCallback = vi.fn();
            permissionHandler(mockView.webContents, 'geolocation', geolocationCallback);
            expect(geolocationCallback).toHaveBeenCalledWith(false);
        });
    });

    describe('View State Integration', () => {
        it('should return complete view state', () => {
            service.initialize(mockMainWindow);
            const viewId = service.createView('state-view');

            const mockView = (WebContentsView as any).mock.results[0].value;
            mockView.webContents.getURL.mockReturnValue('https://example.com/page');
            mockView.webContents.getTitle.mockReturnValue('Example Page');
            mockView.webContents.isLoading.mockReturnValue(false);
            mockView.webContents.canGoBack.mockReturnValue(true);
            mockView.webContents.canGoForward.mockReturnValue(true);

            const state = service.getViewState(viewId);

            expect(state).toEqual({
                id: 'state-view',
                url: 'https://example.com/page',
                title: 'Example Page',
                isLoading: false,
                loadingProgress: 1,
                canGoBack: true,
                canGoForward: true,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
            });
        });
    });

    describe('IPC Handler Integration', () => {
        it('should work with IPC handlers end-to-end', async () => {
            const { ipcMain } = await import('electron');
            const handlers = new Map<string, Function>();

            vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler: Function) => {
                handlers.set(channel, handler);
                return undefined as any;
            });

            registerBrowserHandlers(mockMainWindow);

            // Test createView through IPC
            const createHandler = handlers.get('browser:createView')!;
            const createResult = await createHandler({}, 'ipc-view', { url: 'https://ipc-test.com' });

            expect(createResult.success).toBe(true);
            expect(createResult.viewId).toBe('ipc-view');

            // Test setActiveView through IPC
            const setActiveHandler = handlers.get('browser:setActiveView')!;
            const setActiveResult = await setActiveHandler({}, 'ipc-view');

            expect(setActiveResult.success).toBe(true);

            // Test getViewState through IPC
            const getStateHandler = handlers.get('browser:getViewState')!;
            const stateResult = await getStateHandler({}, 'ipc-view');

            expect(stateResult.success).toBe(true);
            expect(stateResult.state).toBeDefined();
            expect(stateResult.state.id).toBe('ipc-view');

            // Test destroyView through IPC
            const destroyHandler = handlers.get('browser:destroyView')!;
            const destroyResult = await destroyHandler({}, 'ipc-view');

            expect(destroyResult.success).toBe(true);

            // Cleanup
            unregisterBrowserHandlers();
        });
    });
});
