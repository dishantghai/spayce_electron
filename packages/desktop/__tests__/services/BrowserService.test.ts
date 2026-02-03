import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Create mock factories for electron
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

// Mock electron module
const MockBrowserWindow = vi.fn().mockImplementation(() => createMockBrowserWindow());
const MockWebContentsView = vi.fn().mockImplementation(() => createMockView());

vi.mock('electron', () => ({
    BrowserWindow: MockBrowserWindow,
    WebContentsView: MockWebContentsView,
}));

// Reference to mocked WebContentsView for assertions
const WebContentsView = MockWebContentsView;

describe('BrowserService', () => {
    let BrowserService: any;
    let getBrowserService: any;
    let resetBrowserService: any;
    let service: any;
    let mockMainWindow: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        MockWebContentsView.mockClear();
        MockBrowserWindow.mockClear();

        // Dynamic import to get fresh module each time
        const module = await import('../../src/main/services/BrowserService');
        BrowserService = module.BrowserService;
        getBrowserService = module.getBrowserService;
        resetBrowserService = module.resetBrowserService;

        // Reset singleton
        resetBrowserService();

        service = getBrowserService();
        mockMainWindow = createMockBrowserWindow();
    });

    afterEach(() => {
        resetBrowserService();
    });

    describe('Initialization', () => {
        it('should initialize with main window', () => {
            expect(() => service.initialize(mockMainWindow)).not.toThrow();
        });

        it('should prevent double initialization', () => {
            service.initialize(mockMainWindow);

            // Second initialization should warn but not throw
            const consoleSpy = vi.spyOn(console, 'warn');
            service.initialize(mockMainWindow);

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Already initialized'));
        });

        it('should throw error when operations called before initialization', () => {
            expect(() => service.createView('test-view')).toThrow('BrowserService not initialized');
        });

        it('should cleanup on window close', () => {
            service.initialize(mockMainWindow);

            // Find the 'closed' event handler
            const closedHandler = mockMainWindow.on.mock.calls.find(
                (call: any[]) => call[0] === 'closed'
            )?.[1];

            expect(closedHandler).toBeDefined();
        });

        it('should implement singleton pattern correctly', () => {
            const service1 = getBrowserService();
            const service2 = getBrowserService();

            expect(service1).toBe(service2);
        });
    });

    describe('URL Validation', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should add https:// to bare domains', async () => {
            const viewId = service.createView('test-view', { url: 'example.com' });

            expect(viewId).toBe('test-view');
            // The loadURL should have been called with https://example.com
            const mockView = (WebContentsView as any).mock.results[0].value;
            expect(mockView.webContents.loadURL).toHaveBeenCalledWith('https://example.com');
        });

        it('should convert search queries to Google search', async () => {
            service.createView('test-view', { url: 'how to code' });

            const mockView = (WebContentsView as any).mock.results[0].value;
            expect(mockView.webContents.loadURL).toHaveBeenCalledWith(
                expect.stringContaining('https://www.google.com/search?q=')
            );
        });

        it('should block javascript: URLs', async () => {
            const viewId = service.createView('test-view');

            await expect(service.loadURL(viewId, 'javascript:alert(1)')).rejects.toThrow('Invalid URL');
        });

        it('should block data:text/html URLs', async () => {
            const viewId = service.createView('test-view');

            await expect(service.loadURL(viewId, 'data:text/html,<script>alert(1)</script>')).rejects.toThrow('Invalid URL');
        });

        it('should block vbscript: URLs', async () => {
            const viewId = service.createView('test-view');

            await expect(service.loadURL(viewId, 'vbscript:msgbox("test")')).rejects.toThrow('Invalid URL');
        });

        it('should reject empty URLs', async () => {
            const viewId = service.createView('test-view');

            await expect(service.loadURL(viewId, '')).rejects.toThrow('Invalid URL');
        });

        it('should reject whitespace-only URLs', async () => {
            const viewId = service.createView('test-view');

            await expect(service.loadURL(viewId, '   ')).rejects.toThrow('Invalid URL');
        });

        it('should handle URLs with existing http scheme', async () => {
            service.createView('test-view', { url: 'http://example.com' });

            const mockView = (WebContentsView as any).mock.results[0].value;
            expect(mockView.webContents.loadURL).toHaveBeenCalledWith('http://example.com');
        });

        it('should handle URLs with existing https scheme', async () => {
            service.createView('test-view', { url: 'https://example.com' });

            const mockView = (WebContentsView as any).mock.results[0].value;
            expect(mockView.webContents.loadURL).toHaveBeenCalledWith('https://example.com');
        });

        it('should handle URLs with paths and query params', async () => {
            service.createView('test-view', { url: 'https://example.com/path?query=value' });

            const mockView = (WebContentsView as any).mock.results[0].value;
            expect(mockView.webContents.loadURL).toHaveBeenCalledWith('https://example.com/path?query=value');
        });
    });

    describe('View Creation', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should create view with secure defaults', () => {
            const viewId = service.createView('secure-view');

            expect(viewId).toBe('secure-view');
            expect(WebContentsView).toHaveBeenCalledWith(
                expect.objectContaining({
                    webPreferences: expect.objectContaining({
                        nodeIntegration: false,
                        contextIsolation: true,
                        sandbox: true,
                    }),
                })
            );
        });

        it('should have nodeIntegration disabled', () => {
            service.createView('test-view');

            expect(WebContentsView).toHaveBeenCalledWith(
                expect.objectContaining({
                    webPreferences: expect.objectContaining({
                        nodeIntegration: false,
                    }),
                })
            );
        });

        it('should have contextIsolation enabled', () => {
            service.createView('test-view');

            expect(WebContentsView).toHaveBeenCalledWith(
                expect.objectContaining({
                    webPreferences: expect.objectContaining({
                        contextIsolation: true,
                    }),
                })
            );
        });

        it('should have sandbox enabled', () => {
            service.createView('test-view');

            expect(WebContentsView).toHaveBeenCalledWith(
                expect.objectContaining({
                    webPreferences: expect.objectContaining({
                        sandbox: true,
                    }),
                })
            );
        });

        it('should set Firefox macOS user agent', () => {
            service.createView('test-view');

            const mockView = (WebContentsView as any).mock.results[0].value;
            expect(mockView.webContents.setUserAgent).toHaveBeenCalledWith(
                expect.stringContaining('Firefox')
            );
            expect(mockView.webContents.setUserAgent).toHaveBeenCalledWith(
                expect.stringContaining('Macintosh')
            );
        });

        it('should allow custom user agent', () => {
            const customUA = 'Custom User Agent/1.0';
            service.createView('test-view', { userAgent: customUA });

            const mockView = (WebContentsView as any).mock.results[0].value;
            expect(mockView.webContents.setUserAgent).toHaveBeenCalledWith(customUA);
        });

        it('should load default URL (google.com) when none provided', () => {
            service.createView('test-view');

            const mockView = (WebContentsView as any).mock.results[0].value;
            expect(mockView.webContents.loadURL).toHaveBeenCalledWith('https://www.google.com');
        });

        it('should load specified URL', () => {
            service.createView('test-view', { url: 'https://example.com' });

            const mockView = (WebContentsView as any).mock.results[0].value;
            expect(mockView.webContents.loadURL).toHaveBeenCalledWith('https://example.com');
        });

        it('should track view in map', () => {
            service.createView('test-view');

            expect(service.getView('test-view')).toBeDefined();
            expect(service.getViewCount()).toBe(1);
        });

        it('should handle duplicate view ID gracefully', () => {
            service.createView('duplicate-view');

            const consoleSpy = vi.spyOn(console, 'warn');
            const viewId = service.createView('duplicate-view');

            expect(viewId).toBe('duplicate-view');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));
            expect(service.getViewCount()).toBe(1);
        });

        it('should support session partition', () => {
            service.createView('test-view', { partition: 'persist:custom' });

            expect(WebContentsView).toHaveBeenCalledWith(
                expect.objectContaining({
                    webPreferences: expect.objectContaining({
                        partition: 'persist:custom',
                    }),
                })
            );
        });
    });

    describe('View Lifecycle', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should destroy view and cleanup listeners', () => {
            service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            service.destroyView('test-view');

            expect(mockView.webContents.removeAllListeners).toHaveBeenCalled();
            expect(mockView.webContents.close).toHaveBeenCalled();
            expect(service.getView('test-view')).toBeUndefined();
        });

        it('should handle destroying non-existent view', () => {
            const consoleSpy = vi.spyOn(console, 'warn');

            service.destroyView('non-existent');

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
        });

        it('should destroy all views on cleanup', () => {
            service.createView('view-1');
            service.createView('view-2');
            service.createView('view-3');

            expect(service.getViewCount()).toBe(3);

            service.destroyAllViews();

            expect(service.getViewCount()).toBe(0);
        });

        it('should update active view when destroyed view was active', () => {
            service.createView('test-view');
            service.setActiveView('test-view');

            expect(service.getActiveViewId()).toBe('test-view');

            service.destroyView('test-view');

            expect(service.getActiveViewId()).toBeNull();
        });

        it('should remove view from content view when destroying active view', () => {
            service.createView('test-view');
            service.setActiveView('test-view');

            const mockView = (WebContentsView as any).mock.results[0].value;

            service.destroyView('test-view');

            expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(mockView);
        });
    });

    describe('Active View Management', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should set active view', () => {
            service.createView('test-view');

            const result = service.setActiveView('test-view');

            expect(result).toBe(true);
            expect(service.getActiveViewId()).toBe('test-view');
        });

        it('should add view to window content', () => {
            service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            service.setActiveView('test-view');

            expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(mockView);
        });

        it('should remove previous active view', () => {
            service.createView('view-1');
            service.createView('view-2');

            service.setActiveView('view-1');
            const mockView1 = (WebContentsView as any).mock.results[0].value;

            service.setActiveView('view-2');

            expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(mockView1);
        });

        it('should return false for non-existent view', () => {
            const consoleSpy = vi.spyOn(console, 'warn');

            const result = service.setActiveView('non-existent');

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
        });

        it('should apply bounds to active view', () => {
            service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            service.setBounds({ x: 100, y: 50, width: 800, height: 600 });
            service.setActiveView('test-view');

            expect(mockView.setBounds).toHaveBeenCalledWith(
                expect.objectContaining({ x: 100, y: 50, width: 800, height: 600 })
            );
        });

        it('should return null when no active view', () => {
            expect(service.getActiveViewId()).toBeNull();
        });
    });

    describe('Bounds Management', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should update view position', () => {
            service.createView('test-view');
            service.setActiveView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            service.setBounds({ x: 200, y: 100, width: 1024, height: 768 });

            expect(mockView.setBounds).toHaveBeenCalledWith(
                expect.objectContaining({ x: 200, y: 100, width: 1024, height: 768 })
            );
        });

        it('should reject invalid bounds with zero width', () => {
            const consoleSpy = vi.spyOn(console, 'warn');

            service.setBounds({ x: 0, y: 0, width: 0, height: 600 });

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid bounds'));
        });

        it('should reject invalid bounds with zero height', () => {
            const consoleSpy = vi.spyOn(console, 'warn');

            service.setBounds({ x: 0, y: 0, width: 800, height: 0 });

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid bounds'));
        });

        it('should reject invalid bounds with negative dimensions', () => {
            const consoleSpy = vi.spyOn(console, 'warn');

            service.setBounds({ x: 0, y: 0, width: -100, height: 600 });

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid bounds'));
        });

        it('should round bounds to integers', () => {
            service.createView('test-view');
            service.setActiveView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            service.setBounds({ x: 100.7, y: 50.3, width: 800.9, height: 600.1 });

            expect(mockView.setBounds).toHaveBeenCalledWith(
                expect.objectContaining({ x: 101, y: 50, width: 801, height: 600 })
            );
        });

        it('should store bounds for future active views', () => {
            service.setBounds({ x: 100, y: 50, width: 800, height: 600 });

            service.createView('test-view');
            service.setActiveView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            expect(mockView.setBounds).toHaveBeenCalledWith(
                expect.objectContaining({ x: 100, y: 50, width: 800, height: 600 })
            );
        });
    });

    describe('Navigation', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should load URL successfully', async () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            await service.loadURL(viewId, 'https://example.com');

            expect(mockView.webContents.loadURL).toHaveBeenCalledWith('https://example.com');
        });

        it('should throw error for non-existent view', async () => {
            await expect(service.loadURL('non-existent', 'https://example.com')).rejects.toThrow('not found');
        });

        it('should go back when history available', async () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;
            mockView.webContents.canGoBack.mockReturnValue(true);

            await service.goBack(viewId);

            expect(mockView.webContents.goBack).toHaveBeenCalled();
        });

        it('should not go back when no history', async () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;
            mockView.webContents.canGoBack.mockReturnValue(false);

            await service.goBack(viewId);

            expect(mockView.webContents.goBack).not.toHaveBeenCalled();
        });

        it('should go forward when history available', async () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;
            mockView.webContents.canGoForward.mockReturnValue(true);

            await service.goForward(viewId);

            expect(mockView.webContents.goForward).toHaveBeenCalled();
        });

        it('should not go forward when no history', async () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;
            mockView.webContents.canGoForward.mockReturnValue(false);

            await service.goForward(viewId);

            expect(mockView.webContents.goForward).not.toHaveBeenCalled();
        });

        it('should reload page', async () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            await service.reload(viewId);

            expect(mockView.webContents.reload).toHaveBeenCalled();
        });

        it('should stop loading', () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            service.stop(viewId);

            expect(mockView.webContents.stop).toHaveBeenCalled();
        });

        it('should handle stop for non-existent view gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn');

            service.stop('non-existent');

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
        });
    });

    describe('View State', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should return view state', () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;
            mockView.webContents.getURL.mockReturnValue('https://example.com');
            mockView.webContents.getTitle.mockReturnValue('Example');
            mockView.webContents.isLoading.mockReturnValue(false);
            mockView.webContents.canGoBack.mockReturnValue(true);
            mockView.webContents.canGoForward.mockReturnValue(false);

            const state = service.getViewState(viewId);

            expect(state).toEqual({
                id: 'test-view',
                url: 'https://example.com',
                title: 'Example',
                isLoading: false,
                loadingProgress: 1,
                canGoBack: true,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
            });
        });

        it('should return null for non-existent view', () => {
            const state = service.getViewState('non-existent');

            expect(state).toBeNull();
        });

        it('should indicate secure status for https URLs', () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;
            mockView.webContents.getURL.mockReturnValue('https://secure.com');

            const state = service.getViewState(viewId);

            expect(state?.isSecure).toBe(true);
        });

        it('should indicate insecure status for http URLs', () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;
            mockView.webContents.getURL.mockReturnValue('http://insecure.com');

            const state = service.getViewState(viewId);

            expect(state?.isSecure).toBe(false);
        });

        it('should return default title when none set', () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;
            mockView.webContents.getTitle.mockReturnValue('');

            const state = service.getViewState(viewId);

            expect(state?.title).toBe('New Tab');
        });
    });

    describe('View Visibility', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should set view visibility to true', () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            service.setViewVisibility(viewId, true);

            expect(mockView.setVisible).toHaveBeenCalledWith(true);
        });

        it('should set view visibility to false', () => {
            const viewId = service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            service.setViewVisibility(viewId, false);

            expect(mockView.setVisible).toHaveBeenCalledWith(false);
        });

        it('should handle visibility for non-existent view gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn');

            service.setViewVisibility('non-existent', true);

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
        });
    });

    describe('View Count', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should return 0 when no views', () => {
            expect(service.getViewCount()).toBe(0);
        });

        it('should track view count correctly', () => {
            service.createView('view-1');
            expect(service.getViewCount()).toBe(1);

            service.createView('view-2');
            expect(service.getViewCount()).toBe(2);

            service.destroyView('view-1');
            expect(service.getViewCount()).toBe(1);
        });
    });

    describe('Event Listeners', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should setup event listeners on view creation', () => {
            service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            // Check that event listeners were registered
            expect(mockView.webContents.on).toHaveBeenCalledWith('did-start-loading', expect.any(Function));
            expect(mockView.webContents.on).toHaveBeenCalledWith('did-stop-loading', expect.any(Function));
            expect(mockView.webContents.on).toHaveBeenCalledWith('did-navigate', expect.any(Function));
            expect(mockView.webContents.on).toHaveBeenCalledWith('did-navigate-in-page', expect.any(Function));
            expect(mockView.webContents.on).toHaveBeenCalledWith('page-title-updated', expect.any(Function));
            expect(mockView.webContents.on).toHaveBeenCalledWith('page-favicon-updated', expect.any(Function));
            expect(mockView.webContents.on).toHaveBeenCalledWith('did-fail-load', expect.any(Function));
            expect(mockView.webContents.on).toHaveBeenCalledWith('certificate-error', expect.any(Function));
        });

        it('should setup window open handler', () => {
            service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            expect(mockView.webContents.setWindowOpenHandler).toHaveBeenCalled();
        });

        it('should setup permission handler', () => {
            service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            expect(mockView.webContents.session.setPermissionRequestHandler).toHaveBeenCalled();
        });
    });

    describe('Security', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should have webSecurity enabled', () => {
            service.createView('test-view');

            expect(WebContentsView).toHaveBeenCalledWith(
                expect.objectContaining({
                    webPreferences: expect.objectContaining({
                        webSecurity: true,
                    }),
                })
            );
        });

        it('should not allow running insecure content', () => {
            service.createView('test-view');

            expect(WebContentsView).toHaveBeenCalledWith(
                expect.objectContaining({
                    webPreferences: expect.objectContaining({
                        allowRunningInsecureContent: false,
                    }),
                })
            );
        });

        it('should have no preload script for browser views', () => {
            service.createView('test-view');

            expect(WebContentsView).toHaveBeenCalledWith(
                expect.objectContaining({
                    webPreferences: expect.objectContaining({
                        preload: undefined,
                    }),
                })
            );
        });

        it('should block popups and load in current view', () => {
            service.createView('test-view');
            const mockView = (WebContentsView as any).mock.results[0].value;

            const handler = mockView.webContents.setWindowOpenHandler.mock.calls[0][0];
            const result = handler({ url: 'https://popup.com' });

            expect(result).toEqual({ action: 'deny' });
        });
    });
});
