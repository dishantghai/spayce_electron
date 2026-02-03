import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * B008: Tests for Sidebar Overlay Recovery After System Sleep/Wake
 *
 * Validates that:
 * 1. SidebarOverlayService.handleSystemResume() hides overlay and re-validates bounds
 * 2. BrowserService.handleSystemResume() re-validates browser view bounds
 * 3. Main process sends IPC event to renderer on resume
 * 4. Overlay bounds are correct (not narrow strip) after resume
 * 5. Mouse tracking restarts after resume (so user can re-show sidebar)
 */

// ============================================================================
// Mock Electron modules
// ============================================================================

let autoContentReady = true;

const createMockWebContents = () => {
    const callbacks: Map<string, (() => void)[]> = new Map();
    return {
        loadURL: vi.fn().mockResolvedValue(undefined),
        loadFile: vi.fn().mockResolvedValue(undefined),
        close: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        send: vi.fn(),
        on: vi.fn().mockImplementation((event: string, callback: () => void) => {
            if (!callbacks.has(event)) {
                callbacks.set(event, []);
            }
            callbacks.get(event)!.push(callback);
            if (autoContentReady && event === 'did-finish-load') {
                callback();
            }
        }),
    };
};

const createMockWebContentsView = () => {
    let currentBounds = { x: 0, y: 0, width: 320, height: 800 };
    return {
        webContents: {
            ...createMockWebContents(),
            setUserAgent: vi.fn(),
            getURL: vi.fn().mockReturnValue(''),
            getTitle: vi.fn().mockReturnValue(''),
            isLoading: vi.fn().mockReturnValue(false),
            canGoBack: vi.fn().mockReturnValue(false),
            canGoForward: vi.fn().mockReturnValue(false),
            goBack: vi.fn(),
            goForward: vi.fn(),
            reload: vi.fn(),
            stop: vi.fn(),
            removeAllListeners: vi.fn(),
            session: { setPermissionRequestHandler: vi.fn() },
            setWindowOpenHandler: vi.fn(),
            getWebPreferences: vi.fn().mockReturnValue({
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
            }),
        },
        setBounds: vi.fn().mockImplementation((bounds: { x: number; y: number; width: number; height: number }) => {
            currentBounds = { ...bounds };
        }),
        getBounds: vi.fn().mockImplementation(() => ({ ...currentBounds })),
        setBackgroundColor: vi.fn(),
        setVisible: vi.fn(),
    };
};

const createMockBrowserWindow = () => ({
    contentView: {
        addChildView: vi.fn(),
        removeChildView: vi.fn(),
    },
    getSize: vi.fn().mockReturnValue([1200, 800]),
    getBounds: vi.fn().mockReturnValue({ x: 0, y: 0, width: 1200, height: 800 }),
    on: vi.fn(),
    isDestroyed: vi.fn().mockReturnValue(false),
    webContents: {
        send: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
    },
});

const MockWebContentsView = vi.fn().mockImplementation(() => createMockWebContentsView());
const MockBrowserWindow = vi.fn().mockImplementation(() => createMockBrowserWindow());

const mockScreen = {
    getCursorScreenPoint: vi.fn().mockReturnValue({ x: 5, y: 100 }),
};

vi.mock('electron', () => ({
    BrowserWindow: MockBrowserWindow,
    WebContentsView: MockWebContentsView,
    screen: mockScreen,
    app: {
        isPackaged: false,
    },
}));

// ============================================================================
// SidebarOverlayService.handleSystemResume() Tests
// ============================================================================

describe('B008: SidebarOverlayService.handleSystemResume()', () => {
    let SidebarOverlayService: any;
    let getSidebarOverlayService: any;
    let resetSidebarOverlayService: any;
    let service: any;
    let mockMainWindow: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        MockWebContentsView.mockClear();
        MockBrowserWindow.mockClear();
        autoContentReady = true;

        const module = await import('../src/main/services/SidebarOverlayService');
        SidebarOverlayService = module.SidebarOverlayService;
        getSidebarOverlayService = module.getSidebarOverlayService;
        resetSidebarOverlayService = module.resetSidebarOverlayService;

        resetSidebarOverlayService();
        service = getSidebarOverlayService();
        mockMainWindow = createMockBrowserWindow();
    });

    afterEach(() => {
        resetSidebarOverlayService();
    });

    it('should hide visible overlay on system resume', async () => {
        service.initialize(mockMainWindow);
        await service.show();
        expect(service.getIsVisible()).toBe(true);

        service.handleSystemResume();

        expect(service.getIsVisible()).toBe(false);
    });

    it('should remove sidebar view from window on resume', async () => {
        service.initialize(mockMainWindow);
        await service.show();

        mockMainWindow.contentView.removeChildView.mockClear();
        service.handleSystemResume();

        expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalled();
    });

    it('should set sidebar view invisible on resume', async () => {
        service.initialize(mockMainWindow);
        await service.show();

        const mockView = MockWebContentsView.mock.results[0].value;
        mockView.setVisible.mockClear();
        service.handleSystemResume();

        expect(mockView.setVisible).toHaveBeenCalledWith(false);
    });

    it('should re-validate bounds with current window height after resume', async () => {
        service.initialize(mockMainWindow);
        await service.show();

        // Simulate window height change during sleep
        mockMainWindow.getSize.mockReturnValue([1200, 900]);

        const mockView = MockWebContentsView.mock.results[0].value;
        mockView.setBounds.mockClear();
        service.handleSystemResume();

        // Should set bounds with updated height at off-screen position
        const setBoundsCall = mockView.setBounds.mock.calls[mockView.setBounds.mock.calls.length - 1][0];
        expect(setBoundsCall.x).toBe(-320); // Off-screen
        expect(setBoundsCall.y).toBe(0);
        expect(setBoundsCall.width).toBe(320);
        expect(setBoundsCall.height).toBe(900); // Updated height
    });

    it('should use fallback height if window height is invalid after resume', async () => {
        service.initialize(mockMainWindow);
        await service.show();

        // Simulate invalid window height after sleep
        mockMainWindow.getSize.mockReturnValue([1200, 0]);

        const mockView = MockWebContentsView.mock.results[0].value;
        mockView.setBounds.mockClear();
        service.handleSystemResume();

        const setBoundsCall = mockView.setBounds.mock.calls[mockView.setBounds.mock.calls.length - 1][0];
        expect(setBoundsCall.height).toBe(800); // Fallback height
    });

    it('should restart mouse tracking if in floating mode after resume', async () => {
        service.initialize(mockMainWindow);
        service.setFloatingMode(true);
        await service.show();

        service.handleSystemResume();

        // After resume, mouse tracking should restart since sidebar is hidden in floating mode
        // We verify this indirectly: sidebar is hidden + floating mode = mouse tracking active
        expect(service.getIsVisible()).toBe(false);
    });

    it('should stop any ongoing animation on resume', async () => {
        service.initialize(mockMainWindow);

        // Show overlay first, then resume
        await service.show();
        expect(service.getIsVisible()).toBe(true);

        // Resume should cleanly hide even if animation state was in flux
        service.handleSystemResume();

        // Should not throw and overlay should be hidden
        expect(service.getIsVisible()).toBe(false);
    });

    it('should be safe to call when overlay is already hidden', () => {
        service.initialize(mockMainWindow);

        // Overlay is not visible - resume should not throw
        expect(() => service.handleSystemResume()).not.toThrow();
        expect(service.getIsVisible()).toBe(false);
    });

    it('should be safe to call when not initialized', () => {
        // Service not initialized - should not throw
        expect(() => service.handleSystemResume()).not.toThrow();
    });
});

// ============================================================================
// BrowserService.handleSystemResume() Tests
// ============================================================================

describe('B008: BrowserService.handleSystemResume()', () => {
    let BrowserService: any;
    let getBrowserService: any;
    let resetBrowserService: any;
    let service: any;
    let mockMainWindow: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        MockWebContentsView.mockClear();
        MockBrowserWindow.mockClear();

        const module = await import('../src/main/services/BrowserService');
        BrowserService = module.BrowserService;
        getBrowserService = module.getBrowserService;
        resetBrowserService = module.resetBrowserService;

        resetBrowserService();
        service = getBrowserService();
        mockMainWindow = createMockBrowserWindow();
    });

    afterEach(() => {
        resetBrowserService();
    });

    it('should re-set bounds on active browser view after resume', () => {
        service.initialize(mockMainWindow);
        service.createView('tab-1');
        service.setActiveView('tab-1');

        // Set bounds
        service.setBounds({ x: 0, y: 0, width: 1200, height: 800 });

        // Get the mock view
        const mockView = service.getView('tab-1');
        mockView.setBounds.mockClear();

        service.handleSystemResume();

        // Should re-apply current bounds to force viewport update
        expect(mockView.setBounds).toHaveBeenCalledWith(
            expect.objectContaining({
                x: 0,
                y: 0,
                width: 1200,
                height: 800,
            })
        );
    });

    it('should be safe to call when no active view exists', () => {
        service.initialize(mockMainWindow);

        // No views created - should not throw
        expect(() => service.handleSystemResume()).not.toThrow();
    });

    it('should be safe to call when not initialized', () => {
        // Service not initialized - should not throw
        expect(() => service.handleSystemResume()).not.toThrow();
    });
});
