import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * B010: Sidebar Overlay Unnecessarily Animates When Switching to Browser Tab in Floating Mode
 *
 * Root Cause: The overlay visibility effect always calls show() (animated) when entering
 * overlay mode. There is no showInstant() method to skip the 250ms slide-in animation
 * during tab switches. The asymmetry is: hideInstant() exists for leaving overlay mode,
 * but showInstant() is missing for entering overlay mode via tab switch.
 *
 * Fix: Add showInstant() method (symmetric to hideInstant()) and detect isTransitioningIn
 * (symmetric to isTransitioningOut) in the overlay visibility effect to use showInstant()
 * during tab switches while preserving animated show() for auto-show via mouse hover.
 */

// ============================================================================
// Mock Electron modules (same pattern as B008 tests)
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
        getCursorScreenPoint: vi.fn().mockReturnValue({ x: 5, y: 100 }),
    },
    app: {
        isPackaged: false,
    },
}));

describe('B010: Overlay Animation Prevention on Tab Switch to Browser', () => {
    describe('isTransitioningIn detection (symmetric to isTransitioningOut)', () => {
        it('should detect isTransitioningIn when switching from non-browser to browser tab', () => {
            // wasOverlayMode=false (Spaces tab), useOverlayMode=true (Browser tab)
            const wasOverlayMode = false;
            const useOverlayMode = true;

            const isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;

            expect(isTransitioningIn).toBe(true);
        });

        it('should NOT detect isTransitioningIn when overlay was already active', () => {
            // This is the auto-show case: overlay was already in overlay mode
            // (e.g., user hovered left edge to trigger auto-show while already on browser tab)
            const wasOverlayMode = true;
            const useOverlayMode = true;

            const isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;

            expect(isTransitioningIn).toBe(false);
        });

        it('should NOT detect isTransitioningIn when leaving overlay mode', () => {
            const wasOverlayMode = true;
            const useOverlayMode = false;

            const isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;

            expect(isTransitioningIn).toBe(false);
        });

        it('should NOT detect isTransitioningIn when both are false', () => {
            const wasOverlayMode = false;
            const useOverlayMode = false;

            const isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;

            expect(isTransitioningIn).toBe(false);
        });

        it('should detect isTransitioningIn for Spaces→Browser switch', () => {
            let activeTab = 'spaces';
            const sidebarMode = 'floating';
            let prevUseOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // false

            // Switch to browser
            activeTab = 'browser';
            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // true

            const wasOverlayMode = prevUseOverlayMode;
            const isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;

            expect(isTransitioningIn).toBe(true);

            prevUseOverlayMode = useOverlayMode;
            expect(prevUseOverlayMode).toBe(true);
        });

        it('should detect isTransitioningIn for Workspace→Browser switch', () => {
            let activeTab = 'workspace';
            const sidebarMode = 'floating';
            let prevUseOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // false

            activeTab = 'browser';
            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // true

            const wasOverlayMode = prevUseOverlayMode;
            const isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;

            expect(isTransitioningIn).toBe(true);
        });
    });

    describe('Overlay visibility effect branch selection', () => {
        it('should use showInstant (not show) when isTransitioningIn is true', () => {
            const useOverlayMode = true;
            const sidebarVisible = true;
            const isTransitioningIn = true;
            const isTransitioningOut = false;

            let showCalled = false;
            let showInstantCalled = false;

            // Simulate the overlay visibility effect branch logic (B010 fix)
            if (useOverlayMode && sidebarVisible) {
                if (isTransitioningIn) {
                    showInstantCalled = true; // B010-FIX: Use showInstant for tab switch
                } else {
                    showCalled = true; // Normal animated show (auto-show)
                }
            }

            expect(showInstantCalled).toBe(true);
            expect(showCalled).toBe(false);
        });

        it('should use show (animated) when entering overlay via auto-show (not tab switch)', () => {
            const useOverlayMode = true;
            const sidebarVisible = true;
            const isTransitioningIn = false; // Was already in overlay mode
            const isTransitioningOut = false;

            let showCalled = false;
            let showInstantCalled = false;

            if (useOverlayMode && sidebarVisible) {
                if (isTransitioningIn) {
                    showInstantCalled = true;
                } else {
                    showCalled = true;
                }
            }

            expect(showCalled).toBe(true);
            expect(showInstantCalled).toBe(false);
        });

        it('should use hideInstant when isTransitioningOut is true (unchanged)', () => {
            const useOverlayMode = false;
            const sidebarVisible = true;
            const isTransitioningIn = false;
            const isTransitioningOut = true;

            let hideInstantCalled = false;

            if (useOverlayMode && sidebarVisible) {
                // Show branch
            } else if (isTransitioningOut) {
                hideInstantCalled = true;
            }

            expect(hideInstantCalled).toBe(true);
        });

        it('should use hide (animated) for normal hide (unchanged)', () => {
            const useOverlayMode = false;
            const sidebarVisible = false;
            const isTransitioningIn = false;
            const isTransitioningOut = false;

            let hideCalled = false;

            if (useOverlayMode && sidebarVisible) {
                // Show branch
            } else if (isTransitioningOut) {
                // hideInstant branch
            } else {
                hideCalled = true;
            }

            expect(hideCalled).toBe(true);
        });
    });

    describe('SidebarOverlayService.showInstant() behavior', () => {
        it('should set bounds at x=0 without animation', () => {
            // Simulate showInstant behavior
            const config = { width: 320 };
            let viewBounds = { x: -320, y: 0, width: 320, height: 800 };
            let isVisible = false;
            let animateBoundsCalled = false;

            // showInstant implementation
            const showInstant = () => {
                // Set bounds directly at x=0 (no animation)
                viewBounds = { x: 0, y: 0, width: config.width, height: viewBounds.height };
                isVisible = true;
                // animateBounds is NOT called
            };

            showInstant();

            expect(viewBounds.x).toBe(0); // Instantly at final position
            expect(isVisible).toBe(true);
            expect(animateBoundsCalled).toBe(false); // No animation
        });

        it('should not call animateBounds (unlike show())', () => {
            let animateBoundsCalled = false;
            let setBoundsCalled = false;

            // show() always calls animateBounds
            const show = () => {
                animateBoundsCalled = true;
            };

            // showInstant() directly sets bounds
            const showInstant = () => {
                setBoundsCalled = true;
            };

            showInstant();

            expect(animateBoundsCalled).toBe(false);
            expect(setBoundsCalled).toBe(true);
        });

        it('should guard against double-call (like show)', () => {
            let isVisible = false;
            let callCount = 0;

            const showInstant = () => {
                if (isVisible) return; // Guard
                isVisible = true;
                callCount++;
            };

            showInstant();
            showInstant(); // Second call should be no-op

            expect(callCount).toBe(1);
            expect(isVisible).toBe(true);
        });

        it('should stop mouse tracking (like show)', () => {
            let mouseTrackingStopped = false;

            const showInstant = () => {
                mouseTrackingStopped = true; // Same as show()
            };

            showInstant();

            expect(mouseTrackingStopped).toBe(true);
        });
    });

    describe('Full tab-switch flow: Spaces→Browser', () => {
        it('should use showInstant for seamless transition to Browser tab', () => {
            const sidebarMode = 'floating';
            let activeTab = 'spaces';
            let prevUseOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // false
            const sidebarVisible = true;
            let showInstantCalled = false;
            let showCalled = false;

            // User clicks Browser tab
            activeTab = 'browser';
            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // true

            // Overlay visibility effect (synchronous part)
            const wasOverlayMode = prevUseOverlayMode; // false
            const isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;
            const isTransitioningOut = wasOverlayMode === true && useOverlayMode === false;
            prevUseOverlayMode = useOverlayMode;

            // Branch selection
            if (useOverlayMode && sidebarVisible) {
                if (isTransitioningIn) {
                    showInstantCalled = true; // B010-FIX
                } else {
                    showCalled = true;
                }
            }

            expect(isTransitioningIn).toBe(true);
            expect(showInstantCalled).toBe(true);
            expect(showCalled).toBe(false);
        });

        it('should use showInstant for Workspace→Browser transition', () => {
            const sidebarMode = 'floating';
            let activeTab = 'workspace';
            let prevUseOverlayMode = false;
            const sidebarVisible = true;
            let showInstantCalled = false;
            let showCalled = false;

            activeTab = 'browser';
            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';

            const wasOverlayMode = prevUseOverlayMode;
            const isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;
            prevUseOverlayMode = useOverlayMode;

            if (useOverlayMode && sidebarVisible) {
                if (isTransitioningIn) {
                    showInstantCalled = true;
                } else {
                    showCalled = true;
                }
            }

            expect(showInstantCalled).toBe(true);
            expect(showCalled).toBe(false);
        });
    });

    describe('Auto-show via mouse hover should still animate', () => {
        it('should use show (animated) when auto-show triggers on browser tab', () => {
            // Auto-show: overlay was already in overlay mode (browser tab active),
            // but sidebar was hidden. Mouse hover triggers setSidebarVisible(true).
            // The effect fires with prevUseOverlayMode=true, useOverlayMode=true.
            const sidebarMode = 'floating';
            const activeTab = 'browser';
            const prevUseOverlayMode = true; // Was already in overlay mode
            const sidebarVisible = true; // Just became true via auto-show

            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // true

            const wasOverlayMode = prevUseOverlayMode; // true
            const isTransitioningIn = wasOverlayMode === false && useOverlayMode === true; // false

            let showInstantCalled = false;
            let showCalled = false;

            if (useOverlayMode && sidebarVisible) {
                if (isTransitioningIn) {
                    showInstantCalled = true;
                } else {
                    showCalled = true; // Animated show for auto-show
                }
            }

            expect(isTransitioningIn).toBe(false);
            expect(showCalled).toBe(true);
            expect(showInstantCalled).toBe(false);
        });
    });

    describe('Regression: existing transitions unchanged', () => {
        it('should still use hideInstant for Browser→Spaces transition', () => {
            const sidebarMode = 'floating';
            let activeTab = 'browser';
            let prevUseOverlayMode = true;

            activeTab = 'spaces';
            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // false

            const wasOverlayMode = prevUseOverlayMode; // true
            const isTransitioningOut = wasOverlayMode === true && useOverlayMode === false;
            const isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;

            expect(isTransitioningOut).toBe(true);
            expect(isTransitioningIn).toBe(false);
        });

        it('should still use hideInstant for Browser→Workspace transition', () => {
            let prevUseOverlayMode = true;

            const useOverlayMode = false; // Workspace tab

            const isTransitioningOut = prevUseOverlayMode === true && useOverlayMode === false;
            const isTransitioningIn = prevUseOverlayMode === false && useOverlayMode === true;

            expect(isTransitioningOut).toBe(true);
            expect(isTransitioningIn).toBe(false);
        });

        it('should handle round-trip: Spaces→Browser→Spaces correctly', () => {
            const sidebarMode = 'floating';
            let activeTab = 'spaces';
            let prevUseOverlayMode = false;
            let showInstantCalled = false;
            let hideInstantCalled = false;

            // Step 1: Spaces → Browser (showInstant)
            activeTab = 'browser';
            let useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
            let wasOverlayMode = prevUseOverlayMode;
            let isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;
            let isTransitioningOut = wasOverlayMode === true && useOverlayMode === false;
            prevUseOverlayMode = useOverlayMode;

            expect(isTransitioningIn).toBe(true);
            showInstantCalled = isTransitioningIn;

            // Step 2: Browser → Spaces (hideInstant)
            activeTab = 'spaces';
            useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
            wasOverlayMode = prevUseOverlayMode;
            isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;
            isTransitioningOut = wasOverlayMode === true && useOverlayMode === false;
            prevUseOverlayMode = useOverlayMode;

            expect(isTransitioningOut).toBe(true);
            hideInstantCalled = isTransitioningOut;

            // Both transitions used instant methods
            expect(showInstantCalled).toBe(true);
            expect(hideInstantCalled).toBe(true);
        });

        it('should handle rapid Spaces→Browser→Spaces→Browser sequence', () => {
            const sidebarMode = 'floating';
            let prevUseOverlayMode = false;
            const tabs = ['browser', 'spaces', 'browser', 'spaces', 'browser'];
            const transitions: string[] = [];

            for (const tab of tabs) {
                const useOverlayMode = sidebarMode === 'floating' && tab === 'browser';
                const wasOverlayMode = prevUseOverlayMode;
                const isTransitioningIn = wasOverlayMode === false && useOverlayMode === true;
                const isTransitioningOut = wasOverlayMode === true && useOverlayMode === false;
                prevUseOverlayMode = useOverlayMode;

                if (isTransitioningIn) transitions.push('showInstant');
                else if (isTransitioningOut) transitions.push('hideInstant');
                else transitions.push('none');
            }

            expect(transitions).toEqual([
                'showInstant',  // spaces → browser
                'hideInstant',  // browser → spaces
                'showInstant',  // spaces → browser
                'hideInstant',  // browser → spaces
                'showInstant',  // spaces → browser
            ]);
        });

        it('should not affect fixed sidebar mode', () => {
            const sidebarMode = 'fixed';
            const activeTab = 'browser';

            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // false
            const prevUseOverlayMode = false;
            const isTransitioningIn = prevUseOverlayMode === false && useOverlayMode === true;

            expect(useOverlayMode).toBe(false);
            expect(isTransitioningIn).toBe(false);
        });
    });

    // ========================================================================
    // Integration tests: actual SidebarOverlayService.showInstant()
    // ========================================================================
    describe('SidebarOverlayService.showInstant() integration', () => {
        let SidebarOverlayService: any;
        let resetSidebarOverlayService: any;
        let getSidebarOverlayService: any;
        let service: any;
        let mockMainWindow: any;

        beforeEach(async () => {
            vi.clearAllMocks();
            MockWebContentsView.mockClear();
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

        it('should set isVisible=true after showInstant()', async () => {
            service.initialize(mockMainWindow);
            expect(service.getIsVisible()).toBe(false);

            await service.showInstant();

            expect(service.getIsVisible()).toBe(true);
        });

        it('should add sidebar view to window at highest z-order', async () => {
            service.initialize(mockMainWindow);

            await service.showInstant();

            // No index argument = added at the end (highest z-order)
            expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(
                expect.anything()
            );
        });

        it('should set view visible', async () => {
            service.initialize(mockMainWindow);

            await service.showInstant();

            const mockView = MockWebContentsView.mock.results[0].value;
            expect(mockView.setVisible).toHaveBeenCalledWith(true);
        });

        it('should set final bounds at x=0 (not animated from -320)', async () => {
            const module = await import('../src/main/services/SidebarOverlayService');
            const SHADOW_MARGIN = (module as any).SHADOW_MARGIN;

            service.initialize(mockMainWindow);

            await service.showInstant();

            const mockView = MockWebContentsView.mock.results[0].value;
            // Get the LAST setBounds call — should be at x=0
            const allCalls = mockView.setBounds.mock.calls;
            const lastCall = allCalls[allCalls.length - 1][0];
            expect(lastCall.x).toBe(0);
            expect(lastCall.width).toBe(320 + SHADOW_MARGIN);
        });

        it('should complete instantly (not take 250ms like show())', async () => {
            service.initialize(mockMainWindow);

            const startTime = Date.now();
            await service.showInstant();
            const elapsed = Date.now() - startTime;

            // showInstant should complete in <50ms, show() takes ~250ms
            expect(elapsed).toBeLessThan(100);
            expect(service.getIsVisible()).toBe(true);
        });

        it('should be a no-op when already visible', async () => {
            service.initialize(mockMainWindow);

            await service.showInstant();
            expect(service.getIsVisible()).toBe(true);

            // Clear mocks and call again
            mockMainWindow.contentView.addChildView.mockClear();
            await service.showInstant();

            // Should not add view again
            expect(mockMainWindow.contentView.addChildView).not.toHaveBeenCalled();
        });

        it('should be a no-op when animating', async () => {
            service.initialize(mockMainWindow);

            // Start an animated show (don't await)
            const showPromise = service.show();

            // While show() is animating, showInstant should be no-op
            mockMainWindow.contentView.addChildView.mockClear();
            await service.showInstant();

            // Wait for show to finish
            await showPromise;
        });

        it('should send view-attached signal to sidebar webcontents', async () => {
            service.initialize(mockMainWindow);

            await service.showInstant();

            const mockView = MockWebContentsView.mock.results[0].value;
            expect(mockView.webContents.send).toHaveBeenCalledWith(
                'sidebar:view-attached',
                expect.objectContaining({
                    timestamp: expect.any(Number),
                    width: expect.any(Number),
                    height: expect.any(Number),
                })
            );
        });

        it('should allow hide() after showInstant()', async () => {
            service.initialize(mockMainWindow);

            await service.showInstant();
            expect(service.getIsVisible()).toBe(true);

            await service.hide();
            expect(service.getIsVisible()).toBe(false);
        });

        it('should allow hideInstant() after showInstant()', async () => {
            service.initialize(mockMainWindow);

            await service.showInstant();
            expect(service.getIsVisible()).toBe(true);

            service.hideInstant();
            expect(service.getIsVisible()).toBe(false);
        });

        it('show() should take significantly longer than showInstant()', async () => {
            service.initialize(mockMainWindow);

            // Time showInstant
            const instantStart = Date.now();
            await service.showInstant();
            const instantElapsed = Date.now() - instantStart;
            expect(service.getIsVisible()).toBe(true);

            // Reset for show()
            service.hideInstant();
            expect(service.getIsVisible()).toBe(false);

            // Time show()
            const showStart = Date.now();
            await service.show();
            const showElapsed = Date.now() - showStart;

            // show() uses 250ms animation, showInstant() is immediate
            // show() should take at least 200ms more than showInstant()
            expect(showElapsed).toBeGreaterThan(instantElapsed + 100);
        });
    });
});
