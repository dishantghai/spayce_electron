import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * B012: Sidebar Narrow Strip After CMD+R Refresh When Switching to Browser Tab
 *
 * REGRESSION PREVENTION — Do NOT remove or weaken these tests.
 *
 * ROOT CAUSE: Z-order race condition between sidebar overlay and browser views.
 *
 * After CMD+R on Spaces tab → switch to Browser tab:
 *   1. showInstant() adds sidebar overlay at highest z-order
 *   2. BrowserArea mounts → initialize() → setActiveView() → addChildView(browserView)
 *   3. Browser view is now ABOVE the sidebar overlay
 *   4. Browser starts at y=80 (tab bar height) so sidebar's 0-80px peeks out as a "narrow strip"
 *
 * SECONDARY ISSUE: sidebar:view-attached handler in sidebar.tsx only updated DOM heights
 * during initial load, not on subsequent re-attach signals.
 *
 * FIX (3 files):
 *   1. SidebarOverlayService.raiseToTop() — re-adds sidebar view to restore highest z-order
 *   2. browserHandlers.ts — calls raiseToTop() after every browser:setActiveView IPC
 *   3. sidebar.tsx — view-attached handler ALWAYS updates DOM heights + dispatches resize
 *
 * INVARIANT: When the sidebar overlay is visible, it MUST be at the highest z-order
 * in the window's contentView children. No browser view should ever be above it.
 */

// ============================================================================
// Part 1: sidebar:view-attached handler — DOM height updates on every signal
// ============================================================================

describe('B012: sidebar:view-attached handler updates DOM heights on every call', () => {
    let mockDocument: {
        documentElement: { style: Record<string, string> };
        body: { style: Record<string, string> };
        getElementById: ReturnType<typeof vi.fn>;
    };
    let mockContainer: { style: Record<string, string> };
    let resizeEventDispatched: boolean;

    beforeEach(() => {
        mockContainer = { style: {} as Record<string, string> };
        mockDocument = {
            documentElement: { style: {} as Record<string, string> },
            body: { style: {} as Record<string, string> },
            getElementById: vi.fn().mockReturnValue(mockContainer),
        };
        resizeEventDispatched = false;
    });

    /**
     * Simulates the FIXED sidebar:view-attached handler from sidebar.tsx.
     * This function must match the handler logic in the actual code.
     * If this diverges from the real code, tests become meaningless.
     */
    function simulateViewAttachedHandler(
        data: { width?: number; height?: number },
        state: {
            receivedBounds: { width: number; height: number } | null;
            boundsResolver: ((bounds: { width: number; height: number }) => void) | null;
        },
        doc: typeof mockDocument,
        dispatchResize: () => void
    ): void {
        const attachData = data as { width?: number; height?: number };

        if (attachData.width && attachData.height && attachData.height >= 100) {
            state.receivedBounds = { width: attachData.width, height: attachData.height };

            if (state.boundsResolver) {
                state.boundsResolver(state.receivedBounds);
                state.boundsResolver = null;
            }

            // B012-FIX: ALWAYS update DOM heights when view is re-attached
            doc.documentElement.style.height = `${attachData.height}px`;
            doc.body.style.height = `${attachData.height}px`;
            const container = doc.getElementById('sidebar-root');
            if (container) container.style.height = `${attachData.height}px`;

            dispatchResize();
        }
    }

    it('should update DOM heights on initial view-attached (first load)', () => {
        const resolver = vi.fn();
        const state = {
            receivedBounds: null as { width: number; height: number } | null,
            boundsResolver: resolver as ((bounds: { width: number; height: number }) => void) | null,
        };

        simulateViewAttachedHandler(
            { width: 320, height: 800 },
            state,
            mockDocument,
            () => { resizeEventDispatched = true; }
        );

        expect(mockDocument.documentElement.style.height).toBe('800px');
        expect(mockDocument.body.style.height).toBe('800px');
        expect(mockContainer.style.height).toBe('800px');
        expect(resizeEventDispatched).toBe(true);
        expect(resolver).toHaveBeenCalled();
        expect(state.boundsResolver).toBeNull();
    });

    it('should update DOM heights on subsequent view-attached (after reload re-show)', () => {
        const state = {
            receivedBounds: { width: 320, height: 800 },
            boundsResolver: null as ((bounds: { width: number; height: number }) => void) | null,
        };

        simulateViewAttachedHandler(
            { width: 320, height: 750 },
            state,
            mockDocument,
            () => { resizeEventDispatched = true; }
        );

        expect(mockDocument.documentElement.style.height).toBe('750px');
        expect(mockDocument.body.style.height).toBe('750px');
        expect(mockContainer.style.height).toBe('750px');
        expect(resizeEventDispatched).toBe(true);
    });

    it('should update DOM heights when re-attached with SAME height', () => {
        const state = {
            receivedBounds: { width: 320, height: 800 },
            boundsResolver: null,
        };

        simulateViewAttachedHandler(
            { width: 320, height: 800 },
            state,
            mockDocument,
            () => { resizeEventDispatched = true; }
        );

        expect(mockDocument.documentElement.style.height).toBe('800px');
        expect(mockDocument.body.style.height).toBe('800px');
        expect(mockContainer.style.height).toBe('800px');
        expect(resizeEventDispatched).toBe(true);
    });

    it('should reject height below minimum (100px)', () => {
        const state = {
            receivedBounds: null as { width: number; height: number } | null,
            boundsResolver: null,
        };

        simulateViewAttachedHandler(
            { width: 320, height: 50 },
            state,
            mockDocument,
            () => { resizeEventDispatched = true; }
        );

        expect(mockDocument.documentElement.style.height).toBeUndefined();
        expect(resizeEventDispatched).toBe(false);
    });

    it('should reject missing dimensions', () => {
        const state = {
            receivedBounds: null as { width: number; height: number } | null,
            boundsResolver: null,
        };

        simulateViewAttachedHandler(
            { width: 320 } as any,
            state,
            mockDocument,
            () => { resizeEventDispatched = true; }
        );

        expect(resizeEventDispatched).toBe(false);
    });

    it('should handle missing sidebar-root container gracefully', () => {
        mockDocument.getElementById.mockReturnValue(null);

        const state = {
            receivedBounds: null as { width: number; height: number } | null,
            boundsResolver: null,
        };

        expect(() => {
            simulateViewAttachedHandler(
                { width: 320, height: 800 },
                state,
                mockDocument,
                () => { resizeEventDispatched = true; }
            );
        }).not.toThrow();

        expect(mockDocument.documentElement.style.height).toBe('800px');
        expect(mockDocument.body.style.height).toBe('800px');
        expect(resizeEventDispatched).toBe(true);
    });
});

// ============================================================================
// Shared mocks for Parts 2–5 (SidebarOverlayService integration tests)
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
        webContents: createMockWebContents(),
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

vi.mock('electron', () => ({
    BrowserWindow: vi.fn().mockImplementation(() => createMockBrowserWindow()),
    WebContentsView: MockWebContentsView,
    screen: {
        getCursorScreenPoint: vi.fn().mockReturnValue({ x: 500, y: 400 }),
    },
    app: {
        isPackaged: false,
    },
}));

// ============================================================================
// Part 2: showInstant sends correct view-attached signal after reload
// ============================================================================

describe('B012: showInstant sends view-attached with correct dimensions after reload', () => {
    let service: any;
    let mockMainWindow: any;
    let resetSidebarOverlayService: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        MockWebContentsView.mockClear();
        autoContentReady = true;

        const module = await import('../src/main/services/SidebarOverlayService');
        resetSidebarOverlayService = module.resetSidebarOverlayService;

        resetSidebarOverlayService();
        service = module.getSidebarOverlayService();
        mockMainWindow = createMockBrowserWindow();
    });

    afterEach(() => {
        resetSidebarOverlayService();
    });

    it('should send view-attached with correct height after reload + showInstant', async () => {
        service.initialize(mockMainWindow);
        mockMainWindow.getSize.mockReturnValue([1200, 800]);
        await service.showInstant();

        service.handleRendererReload();
        service.hideInstant();

        const mockView = MockWebContentsView.mock.results[0].value;
        mockView.webContents.send.mockClear();

        await service.showInstant();

        const viewAttachedCalls = mockView.webContents.send.mock.calls.filter(
            (call: any[]) => call[0] === 'sidebar:view-attached'
        );
        expect(viewAttachedCalls.length).toBeGreaterThan(0);
        expect(viewAttachedCalls[viewAttachedCalls.length - 1][1].height).toBe(800);
        expect(viewAttachedCalls[viewAttachedCalls.length - 1][1].width).toBe(320);
    });

    it('should use fallback height when window reports 0 after reload', async () => {
        service.initialize(mockMainWindow);
        mockMainWindow.getSize.mockReturnValue([1200, 800]);
        await service.showInstant();

        service.handleRendererReload();
        service.hideInstant();
        mockMainWindow.getSize.mockReturnValue([1200, 0]);

        const mockView = MockWebContentsView.mock.results[0].value;
        mockView.webContents.send.mockClear();

        await service.showInstant();

        const viewAttachedCalls = mockView.webContents.send.mock.calls.filter(
            (call: any[]) => call[0] === 'sidebar:view-attached'
        );
        expect(viewAttachedCalls.length).toBeGreaterThan(0);
        expect(viewAttachedCalls[viewAttachedCalls.length - 1][1].height).toBeGreaterThanOrEqual(100);
    });

    it('should set bounds at x=0 with valid height after reload + showInstant', async () => {
        service.initialize(mockMainWindow);
        mockMainWindow.getSize.mockReturnValue([1200, 800]);
        await service.showInstant();

        service.handleRendererReload();
        service.hideInstant();

        const mockView = MockWebContentsView.mock.results[0].value;
        mockView.setBounds.mockClear();

        await service.showInstant();

        const allCalls = mockView.setBounds.mock.calls;
        const lastCall = allCalls[allCalls.length - 1][0];
        expect(lastCall.x).toBe(0);
        expect(lastCall.height).toBe(800);
    });
});

// ============================================================================
// Part 3: raiseToTop() method — sidebar z-order invariant
// ============================================================================

describe('B012: raiseToTop() restores sidebar to highest z-order', () => {
    let service: any;
    let mockMainWindow: any;
    let resetSidebarOverlayService: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        MockWebContentsView.mockClear();
        autoContentReady = true;

        const module = await import('../src/main/services/SidebarOverlayService');
        resetSidebarOverlayService = module.resetSidebarOverlayService;

        resetSidebarOverlayService();
        service = module.getSidebarOverlayService();
        mockMainWindow = createMockBrowserWindow();
    });

    afterEach(() => {
        resetSidebarOverlayService();
    });

    it('should call addChildView to re-raise sidebar when visible', async () => {
        service.initialize(mockMainWindow);
        await service.showInstant();

        mockMainWindow.contentView.addChildView.mockClear();

        service.raiseToTop();

        expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledTimes(1);
    });

    it('should be a no-op when sidebar is not visible', () => {
        service.initialize(mockMainWindow);
        mockMainWindow.contentView.addChildView.mockClear();

        service.raiseToTop();

        expect(mockMainWindow.contentView.addChildView).not.toHaveBeenCalled();
    });

    it('should be a no-op when service is not initialized', () => {
        const uninitService = new (service.constructor as any)();
        expect(() => uninitService.raiseToTop()).not.toThrow();
    });

    it('should restore z-order: sidebar is re-added AFTER browser view', async () => {
        service.initialize(mockMainWindow);
        await service.showInstant();

        const addChildViewOrder: string[] = [];
        const sidebarView = MockWebContentsView.mock.results[0].value;

        mockMainWindow.contentView.addChildView.mockImplementation((view: any) => {
            addChildViewOrder.push(view === sidebarView ? 'sidebar' : 'browser');
        });

        // Browser view added (simulating setActiveView)
        mockMainWindow.contentView.addChildView({ fake: 'browser-view' });
        // Sidebar re-raised
        service.raiseToTop();

        expect(addChildViewOrder).toEqual(['browser', 'sidebar']);
    });

    it('should handle addChildView errors gracefully', async () => {
        service.initialize(mockMainWindow);
        await service.showInstant();

        mockMainWindow.contentView.addChildView.mockImplementation(() => {
            throw new Error('View already destroyed');
        });

        expect(() => service.raiseToTop()).not.toThrow();
    });

    it('should work after show() (animated) as well as showInstant()', async () => {
        service.initialize(mockMainWindow);
        await service.show();
        expect(service.getIsVisible()).toBe(true);

        mockMainWindow.contentView.addChildView.mockClear();

        service.raiseToTop();

        expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledTimes(1);
    });

    it('should work correctly after hide + re-show cycle', async () => {
        service.initialize(mockMainWindow);
        await service.showInstant();
        service.hideInstant();
        await service.showInstant();

        mockMainWindow.contentView.addChildView.mockClear();

        service.raiseToTop();

        expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledTimes(1);
    });
});

// ============================================================================
// Part 4: End-to-end user scenario regression tests
// ============================================================================

describe('B012 REGRESSION: End-to-end user scenarios', () => {
    let service: any;
    let mockMainWindow: any;
    let resetSidebarOverlayService: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        MockWebContentsView.mockClear();
        autoContentReady = true;

        const module = await import('../src/main/services/SidebarOverlayService');
        resetSidebarOverlayService = module.resetSidebarOverlayService;

        resetSidebarOverlayService();
        service = module.getSidebarOverlayService();
        mockMainWindow = createMockBrowserWindow();
    });

    afterEach(() => {
        resetSidebarOverlayService();
    });

    it('Scenario: CMD+R on Spaces tab → switch to Browser → sidebar fully visible', async () => {
        /**
         * EXACT reproduction of the original bug:
         *   1. App running, sidebar open, floating mode, browser tab active
         *   2. User switches to Spaces tab (overlay hidden)
         *   3. User presses CMD+R (renderer reloads)
         *   4. After reload, user switches to Browser tab
         *   5. Sidebar should be fully visible, NOT a narrow strip
         */
        service.initialize(mockMainWindow);
        mockMainWindow.getSize.mockReturnValue([1200, 900]);

        // Step 1: Sidebar visible on browser tab
        await service.showInstant();
        expect(service.getIsVisible()).toBe(true);

        // Step 2: Switch to Spaces → overlay hidden
        service.hideInstant();
        expect(service.getIsVisible()).toBe(false);

        // Step 3: CMD+R reload
        service.handleRendererReload();

        // Step 4: Switch to Browser tab → showInstant
        const mockView = MockWebContentsView.mock.results[0].value;
        mockView.setBounds.mockClear();
        mockView.webContents.send.mockClear();

        await service.showInstant();
        expect(service.getIsVisible()).toBe(true);

        // Step 5: Verify sidebar is at correct full-height bounds
        const allBounds = mockView.setBounds.mock.calls;
        const finalBounds = allBounds[allBounds.length - 1][0];
        expect(finalBounds.x).toBe(0);
        expect(finalBounds.y).toBe(0);
        expect(finalBounds.width).toBe(320);
        expect(finalBounds.height).toBe(900);

        // Verify view-attached signal sent with correct dimensions
        const viewAttachedCalls = mockView.webContents.send.mock.calls.filter(
            (c: any[]) => c[0] === 'sidebar:view-attached'
        );
        expect(viewAttachedCalls.length).toBeGreaterThan(0);
        expect(viewAttachedCalls[viewAttachedCalls.length - 1][1].height).toBe(900);
    });

    it('Scenario: CMD+R on Browser tab → sidebar stays visible after reload', async () => {
        service.initialize(mockMainWindow);
        mockMainWindow.getSize.mockReturnValue([1200, 900]);

        // Sidebar visible on browser tab
        await service.showInstant();
        expect(service.getIsVisible()).toBe(true);

        // CMD+R while on browser tab — sidebar was visible
        service.handleRendererReload();

        // handleRendererReload re-attaches when isVisible=true
        expect(service.getIsVisible()).toBe(true);

        // Sidebar should still be at x=0 with full height
        const mockView = MockWebContentsView.mock.results[0].value;
        const allBounds = mockView.setBounds.mock.calls;
        const lastBounds = allBounds[allBounds.length - 1][0];
        expect(lastBounds.x).toBe(0);
        expect(lastBounds.height).toBeGreaterThanOrEqual(100);
    });

    it('Scenario: Browser view activation after showInstant → raiseToTop restores z-order', async () => {
        /**
         * Simulates the z-order race condition:
         *   1. showInstant() adds sidebar (z-order: top)
         *   2. Browser setActiveView → addChildView(browserView) pushes browser above
         *   3. raiseToTop() re-raises sidebar above browser
         */
        service.initialize(mockMainWindow);
        mockMainWindow.getSize.mockReturnValue([1200, 900]);

        await service.showInstant();
        expect(service.getIsVisible()).toBe(true);

        // Track addChildView call order
        const callOrder: string[] = [];
        const sidebarView = MockWebContentsView.mock.results[0].value;
        mockMainWindow.contentView.addChildView.mockImplementation((view: any) => {
            callOrder.push(view === sidebarView ? 'sidebar' : 'browser');
        });

        // Browser setActiveView adds browser view (z-order race)
        const fakeBrowserView = { fake: 'browser' };
        mockMainWindow.contentView.addChildView(fakeBrowserView);

        // raiseToTop fixes the z-order
        service.raiseToTop();

        // Sidebar must be the LAST added (highest z-order)
        expect(callOrder[callOrder.length - 1]).toBe('sidebar');
    });

    it('Scenario: Multiple browser views activated in sequence → sidebar stays on top', async () => {
        service.initialize(mockMainWindow);
        await service.showInstant();

        const callOrder: string[] = [];
        const sidebarView = MockWebContentsView.mock.results[0].value;
        mockMainWindow.contentView.addChildView.mockImplementation((view: any) => {
            callOrder.push(view === sidebarView ? 'sidebar' : 'browser');
        });

        // Simulate multiple setActiveView calls (multiple browser tabs)
        for (let i = 0; i < 5; i++) {
            mockMainWindow.contentView.addChildView({ id: `browser-${i}` }); // browser added
            service.raiseToTop(); // sidebar re-raised
        }

        // After every browser activation, sidebar is re-raised
        // Pattern: browser, sidebar, browser, sidebar, browser, sidebar, ...
        expect(callOrder.length).toBe(10);
        // Last call must always be sidebar
        expect(callOrder[callOrder.length - 1]).toBe('sidebar');
        // Every odd index should be 'sidebar'
        for (let i = 1; i < callOrder.length; i += 2) {
            expect(callOrder[i]).toBe('sidebar');
        }
    });

    it('Scenario: Rapid Spaces↔Browser tab switching after reload', async () => {
        service.initialize(mockMainWindow);
        mockMainWindow.getSize.mockReturnValue([1200, 900]);

        // Initial show
        await service.showInstant();
        service.hideInstant();

        // CMD+R
        service.handleRendererReload();

        // Rapid tab switching: Browser → Spaces → Browser → Spaces → Browser
        for (let i = 0; i < 3; i++) {
            await service.showInstant();
            expect(service.getIsVisible()).toBe(true);

            service.hideInstant();
            expect(service.getIsVisible()).toBe(false);
        }

        // Final switch to Browser
        await service.showInstant();
        expect(service.getIsVisible()).toBe(true);

        const mockView = MockWebContentsView.mock.results[0].value;
        const allBounds = mockView.setBounds.mock.calls;
        const finalBounds = allBounds[allBounds.length - 1][0];
        expect(finalBounds.x).toBe(0);
        expect(finalBounds.height).toBe(900);
    });

    it('Scenario: show() (animated) + browser activation → raiseToTop works', async () => {
        service.initialize(mockMainWindow);
        mockMainWindow.getSize.mockReturnValue([1200, 900]);

        // Use animated show() instead of showInstant()
        await service.show();
        expect(service.getIsVisible()).toBe(true);

        mockMainWindow.contentView.addChildView.mockClear();

        // Browser activation happens
        service.raiseToTop();

        // raiseToTop should re-add sidebar
        expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledTimes(1);
    });

    it('Scenario: raiseToTop is no-op during animation (isAnimating guard)', async () => {
        service.initialize(mockMainWindow);

        // Start show animation but don't await
        const showPromise = service.show();

        // While animating, raiseToTop on non-visible sidebar is no-op
        mockMainWindow.contentView.addChildView.mockClear();
        service.raiseToTop();

        // sidebar not yet visible during animation → raiseToTop is no-op
        expect(mockMainWindow.contentView.addChildView).not.toHaveBeenCalled();

        await showPromise;
    });

    it('Scenario: Multiple CMD+R reloads in sequence → sidebar still works', async () => {
        service.initialize(mockMainWindow);
        mockMainWindow.getSize.mockReturnValue([1200, 900]);

        for (let i = 0; i < 3; i++) {
            await service.showInstant();
            expect(service.getIsVisible()).toBe(true);

            service.hideInstant();
            service.handleRendererReload();
        }

        // Final show after multiple reloads
        await service.showInstant();
        expect(service.getIsVisible()).toBe(true);

        const mockView = MockWebContentsView.mock.results[0].value;
        const allBounds = mockView.setBounds.mock.calls;
        const finalBounds = allBounds[allBounds.length - 1][0];
        expect(finalBounds.x).toBe(0);
        expect(finalBounds.height).toBe(900);
    });
});

// ============================================================================
// Part 5: Z-order invariant — sidebar MUST be last addChildView when visible
// ============================================================================

describe('B012 INVARIANT: Sidebar overlay z-order must be highest when visible', () => {
    let service: any;
    let mockMainWindow: any;
    let resetSidebarOverlayService: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        MockWebContentsView.mockClear();
        autoContentReady = true;

        const module = await import('../src/main/services/SidebarOverlayService');
        resetSidebarOverlayService = module.resetSidebarOverlayService;

        resetSidebarOverlayService();
        service = module.getSidebarOverlayService();
        mockMainWindow = createMockBrowserWindow();
    });

    afterEach(() => {
        resetSidebarOverlayService();
    });

    it('show() should add sidebar view as LAST child (highest z-order)', async () => {
        service.initialize(mockMainWindow);

        const callOrder: any[] = [];
        mockMainWindow.contentView.addChildView.mockImplementation((view: any) => {
            callOrder.push(view);
        });

        await service.show();

        // The sidebar view should be the last thing added
        const sidebarView = MockWebContentsView.mock.results[0].value;
        expect(callOrder.length).toBeGreaterThan(0);
        expect(callOrder[callOrder.length - 1]).toBe(sidebarView);
    });

    it('showInstant() should add sidebar view as LAST child (highest z-order)', async () => {
        service.initialize(mockMainWindow);

        const callOrder: any[] = [];
        mockMainWindow.contentView.addChildView.mockImplementation((view: any) => {
            callOrder.push(view);
        });

        await service.showInstant();

        const sidebarView = MockWebContentsView.mock.results[0].value;
        expect(callOrder.length).toBeGreaterThan(0);
        expect(callOrder[callOrder.length - 1]).toBe(sidebarView);
    });

    it('handleRendererReload should re-add sidebar at highest z-order when visible', async () => {
        service.initialize(mockMainWindow);
        await service.showInstant();
        expect(service.getIsVisible()).toBe(true);

        const callOrder: any[] = [];
        const sidebarView = MockWebContentsView.mock.results[0].value;
        mockMainWindow.contentView.addChildView.mockImplementation((view: any) => {
            callOrder.push(view);
        });

        service.handleRendererReload();

        // Sidebar should have been re-added
        expect(callOrder).toContain(sidebarView);
        // And it should be the LAST added
        expect(callOrder[callOrder.length - 1]).toBe(sidebarView);
    });

    it('raiseToTop after any external addChildView ensures sidebar is on top', async () => {
        service.initialize(mockMainWindow);
        await service.showInstant();

        // Simulate 3 external views being added (browser views)
        const sidebarView = MockWebContentsView.mock.results[0].value;
        const callOrder: string[] = [];
        mockMainWindow.contentView.addChildView.mockImplementation((view: any) => {
            callOrder.push(view === sidebarView ? 'sidebar' : 'external');
        });

        // External views added without raiseToTop (BAD — sidebar buried)
        mockMainWindow.contentView.addChildView({ id: 'ext1' });
        mockMainWindow.contentView.addChildView({ id: 'ext2' });
        mockMainWindow.contentView.addChildView({ id: 'ext3' });

        expect(callOrder).toEqual(['external', 'external', 'external']);

        // raiseToTop fixes it
        service.raiseToTop();

        expect(callOrder).toEqual(['external', 'external', 'external', 'sidebar']);
        expect(callOrder[callOrder.length - 1]).toBe('sidebar');
    });

    it('raiseToTop should NOT be called when sidebar is hidden (no unnecessary work)', () => {
        service.initialize(mockMainWindow);
        // sidebar is NOT shown

        mockMainWindow.contentView.addChildView.mockClear();
        service.raiseToTop();

        // No addChildView call — sidebar is hidden, nothing to raise
        expect(mockMainWindow.contentView.addChildView).not.toHaveBeenCalled();
    });

    it('hideInstant removes sidebar — subsequent raiseToTop is no-op', async () => {
        service.initialize(mockMainWindow);
        await service.showInstant();
        service.hideInstant();

        mockMainWindow.contentView.addChildView.mockClear();
        service.raiseToTop();

        expect(mockMainWindow.contentView.addChildView).not.toHaveBeenCalled();
    });

    it('hide() (animated) removes sidebar — subsequent raiseToTop is no-op', async () => {
        service.initialize(mockMainWindow);
        await service.showInstant();
        await service.hide();

        mockMainWindow.contentView.addChildView.mockClear();
        service.raiseToTop();

        expect(mockMainWindow.contentView.addChildView).not.toHaveBeenCalled();
    });
});
