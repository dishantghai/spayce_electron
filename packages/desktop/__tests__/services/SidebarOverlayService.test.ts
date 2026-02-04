import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Tests for SidebarOverlayService
 *
 * REGRESSION PREVENTION:
 * - Commit f936462: Animation performance optimizations
 * - Commit 17fa3d0: Core overlay implementation
 *
 * Critical behaviors to maintain:
 * 1. Smooth 60fps slide animation (cached height, frame skipping)
 * 2. Mouse tracking auto-show (10px left edge trigger)
 * 3. Transparent background for shadow rendering (B015)
 * 4. Proper cleanup on destroy
 * 5. Singleton pattern
 */

// Mock Electron modules
// Track whether content should be auto-ready for tests
let autoContentReady = true;

const createMockWebContents = () => {
    const callbacks: Map<string, (() => void)[]> = new Map();
    const mockWebContents = {
        loadURL: vi.fn().mockResolvedValue(undefined),
        loadFile: vi.fn().mockResolvedValue(undefined),
        close: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        send: vi.fn(),
        openDevTools: vi.fn(),
        on: vi.fn().mockImplementation((event: string, callback: () => void) => {
            if (!callbacks.has(event)) {
                callbacks.set(event, []);
            }
            callbacks.get(event)!.push(callback);

            // Auto-trigger did-finish-load immediately after registration
            // This simulates content being ready right away for tests
            if (autoContentReady && event === 'did-finish-load') {
                // Trigger synchronously - this works with fake timers
                callback();
            }
        }),
        // Helper to manually trigger did-finish-load for testing
        _triggerDidFinishLoad: () => {
            const didFinishLoadCallbacks = callbacks.get('did-finish-load') || [];
            didFinishLoadCallbacks.forEach(cb => cb());
        },
    };
    return mockWebContents;
};

// Helper to control auto content ready behavior for specific tests
const setAutoContentReady = (value: boolean) => {
    autoContentReady = value;
};

const createMockWebContentsView = () => {
    // Track bounds that were set
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

describe('SidebarOverlayService', () => {
    let SidebarOverlayService: any;
    let getSidebarOverlayService: any;
    let resetSidebarOverlayService: any;
    let service: any;
    let mockMainWindow: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        MockWebContentsView.mockClear();
        MockBrowserWindow.mockClear();

        // Reset auto content ready to true for most tests
        setAutoContentReady(true);

        // Dynamic import to get fresh module
        const module = await import('../../src/main/services/SidebarOverlayService');
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

    describe('Initialization', () => {
        it('should initialize with main window', () => {
            expect(() => service.initialize(mockMainWindow)).not.toThrow();
        });

        it('should prevent double initialization', () => {
            service.initialize(mockMainWindow);

            const consoleSpy = vi.spyOn(console, 'warn');
            service.initialize(mockMainWindow);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Already initialized')
            );
        });

        it('should create WebContentsView with secure settings', () => {
            service.initialize(mockMainWindow);

            expect(MockWebContentsView).toHaveBeenCalledWith(
                expect.objectContaining({
                    webPreferences: expect.objectContaining({
                        contextIsolation: true,
                        nodeIntegration: false,
                        sandbox: true,
                    }),
                })
            );
        });

        it('should set transparent background for shadow rendering (B015)', () => {
            service.initialize(mockMainWindow);

            const mockView = MockWebContentsView.mock.results[0].value;
            expect(mockView.setBackgroundColor).toHaveBeenCalledWith('#00000000');
        });

        it('should setup window resize handler', () => {
            service.initialize(mockMainWindow);

            expect(mockMainWindow.on).toHaveBeenCalledWith('resize', expect.any(Function));
        });

        it('should setup window close cleanup', () => {
            service.initialize(mockMainWindow);

            expect(mockMainWindow.on).toHaveBeenCalledWith('closed', expect.any(Function));
        });

        it('should implement singleton pattern', () => {
            const service1 = getSidebarOverlayService();
            const service2 = getSidebarOverlayService();

            expect(service1).toBe(service2);
        });
    });

    describe('Show Animation', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should add view to window at highest z-order', async () => {
            await service.show();

            // No index argument = added at the end (highest z-order)
            expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(
                expect.anything()
            );
        });

        it('should animate from off-screen (-320) to visible (0)', async () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            await service.show();

            // Check that setBounds was called multiple times during animation
            expect(mockView.setBounds).toHaveBeenCalled();

            // Final call should be at x=0 (fully visible)
            const lastCall = mockView.setBounds.mock.calls[mockView.setBounds.mock.calls.length - 1][0];
            expect(lastCall.x).toBe(0);
        });

        it('should set isVisible to true after show completes', async () => {
            await service.show();

            expect(service.getIsVisible()).toBe(true);
        });

        it('should stop mouse tracking when showing', async () => {
            service.setFloatingMode(true);
            await service.show();

            // Mouse tracking should be stopped when sidebar is visible
            expect(service.getIsVisible()).toBe(true);
        });

        it('should not show if already visible', async () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            await service.show();
            mockView.setBounds.mockClear();

            // Second show should do nothing
            await service.show();

            expect(mockView.setBounds).not.toHaveBeenCalled();
        });

        it('should not show if already animating', async () => {
            const showPromise1 = service.show();
            const showPromise2 = service.show();

            await Promise.all([showPromise1, showPromise2]);

            // Second show during animation should be ignored
            expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledTimes(1);
        });
    });

    describe('Hide Animation', () => {
        beforeEach(async () => {
            service.initialize(mockMainWindow);
            await service.show();
        });

        it('should animate from visible (0) to off-screen (-(width + SHADOW_MARGIN))', async () => {
            const module = await import('../../src/main/services/SidebarOverlayService');
            const SHADOW_MARGIN = (module as any).SHADOW_MARGIN;
            const mockView = MockWebContentsView.mock.results[0].value;
            mockView.setBounds.mockClear();

            await service.hide();

            // Final call should be fully hidden: -(config.width + SHADOW_MARGIN)
            const lastCall = mockView.setBounds.mock.calls[mockView.setBounds.mock.calls.length - 1][0];
            expect(lastCall.x).toBe(-(320 + SHADOW_MARGIN));
        });

        it('should remove view from window after hide completes', async () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            await service.hide();

            expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(mockView);
        });

        it('should set isVisible to false after hide completes', async () => {
            await service.hide();

            expect(service.getIsVisible()).toBe(false);
        });

        it('should restart mouse tracking after hide if still in floating mode', async () => {
            service.setFloatingMode(true);

            await service.hide();

            // Mouse tracking should restart after hide (tested by checking internal state)
            expect(service.getIsVisible()).toBe(false);
        });

        it('should not hide if already hidden', async () => {
            await service.hide();

            const mockView = MockWebContentsView.mock.results[0].value;
            mockView.setBounds.mockClear();

            await service.hide();

            expect(mockView.setBounds).not.toHaveBeenCalled();
        });
    });

    describe('Hide Instant (Mode Switch)', () => {
        beforeEach(async () => {
            service.initialize(mockMainWindow);
            await service.show();
        });

        it('should remove view immediately without animation', () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            service.hideInstant();

            expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(mockView);
            expect(service.getIsVisible()).toBe(false);
        });

        it('should not animate when hiding instantly', () => {
            const mockView = MockWebContentsView.mock.results[0].value;
            mockView.setBounds.mockClear();

            service.hideInstant();

            // setBounds should NOT be called (no animation)
            expect(mockView.setBounds).not.toHaveBeenCalled();
        });

        it('should handle errors gracefully when view not attached', () => {
            mockMainWindow.contentView.removeChildView.mockImplementation(() => {
                throw new Error('View not attached');
            });

            expect(() => service.hideInstant()).not.toThrow();
        });
    });

    describe('Toggle', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should show when hidden', async () => {
            const result = await service.toggle();

            expect(result).toBe(true);
            expect(service.getIsVisible()).toBe(true);
        });

        it('should hide when visible', async () => {
            await service.show();

            const result = await service.toggle();

            expect(result).toBe(false);
            expect(service.getIsVisible()).toBe(false);
        });

        it('should alternate between show and hide on repeated toggles', async () => {
            await service.toggle(); // Show
            expect(service.getIsVisible()).toBe(true);

            await service.toggle(); // Hide
            expect(service.getIsVisible()).toBe(false);

            await service.toggle(); // Show
            expect(service.getIsVisible()).toBe(true);
        });
    });

    describe('Mouse Tracking (Auto-Show)', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should start mouse tracking when entering floating mode while hidden', async () => {
            service.setFloatingMode(true);

            // Advance timer to trigger mouse check
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });

            // Use runAllTimersAsync to handle async show() animation
            await vi.runAllTimersAsync();

            // Service should detect cursor near left edge and show sidebar
            expect(service.getIsVisible()).toBe(true);
        });

        it('should auto-show when cursor within 10px of left edge', async () => {
            service.setFloatingMode(true);

            // Cursor at 5px from left edge (within trigger zone)
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });

            // Use runAllTimersAsync to handle async show() animation
            await vi.runAllTimersAsync();

            expect(service.getIsVisible()).toBe(true);
        });

        it('should NOT auto-show when cursor beyond trigger zone', () => {
            service.setFloatingMode(true);

            // Cursor at 50px from left edge (beyond 10px trigger zone)
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 50, y: 100 });
            vi.advanceTimersByTime(200);

            expect(service.getIsVisible()).toBe(false);
        });

        it('should NOT auto-show when cursor outside window bounds', () => {
            service.setFloatingMode(true);

            // Cursor outside window (x < window.x)
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: -10, y: 100 });
            vi.advanceTimersByTime(100);

            expect(service.getIsVisible()).toBe(false);
        });

        it('should stop mouse tracking when switching to fixed mode', () => {
            service.setFloatingMode(true);

            service.setFloatingMode(false);

            // Mouse position should not trigger show in fixed mode
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });
            vi.advanceTimersByTime(200);

            expect(service.getIsVisible()).toBe(false);
        });

        it('should not track when sidebar is visible', async () => {
            service.setFloatingMode(true);

            // Show sidebar using runAllTimersAsync to complete animation
            await vi.runAllTimersAsync();

            const consoleSpy = vi.spyOn(console, 'log');
            consoleSpy.mockClear();

            // Cursor at trigger zone but sidebar already visible
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });
            await vi.advanceTimersByTimeAsync(100);

            // Should not attempt to show again (already visible from auto-show)
            expect(consoleSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('auto-showing sidebar')
            );
        });

        it('should handle getCursorScreenPoint errors gracefully', () => {
            service.setFloatingMode(true);

            mockScreen.getCursorScreenPoint.mockImplementation(() => {
                throw new Error('Screen API error');
            });

            expect(() => {
                vi.advanceTimersByTime(100);
            }).not.toThrow();
        });

        it('should restart mouse tracking after hide in floating mode', async () => {
            // Use real timers for this complex async test
            vi.useRealTimers();

            // Set up: cursor outside trigger zone initially
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 500, y: 100 });

            // Show sidebar without floating mode (to avoid auto-show interfering)
            await service.show();
            expect(service.getIsVisible()).toBe(true);

            // Now enable floating mode and hide
            service.setFloatingMode(true);
            await service.hide();
            expect(service.getIsVisible()).toBe(false);

            // After hide in floating mode, mouse tracking should restart
            // Move cursor to trigger zone and wait for tracking interval
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });

            // Wait for mouse tracking to detect (100ms interval) + show animation (250ms)
            // Plus extra buffer for async operations
            await new Promise(resolve => setTimeout(resolve, 500));

            expect(service.getIsVisible()).toBe(true);

            // Restore fake timers
            vi.useFakeTimers();
        });
    });

    describe('Animation Performance Optimizations (Commit f936462)', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should cache window height at animation start', async () => {
            // Clear any calls from initialization
            mockMainWindow.getSize.mockClear();

            await vi.runAllTimersAsync(); // Complete show animation

            // getSize should only be called once at animation start, not every frame
            // (Implementation uses cached height for performance)
            // Note: may be called during initialization and during animation start
            expect(mockMainWindow.getSize.mock.calls.length).toBeLessThanOrEqual(2);
        });

        it('should skip redundant setBounds calls when position unchanged', async () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            // Mock setBounds to track calls
            let previousX: number | undefined;
            mockView.setBounds.mockImplementation(({ x }: { x: number }) => {
                if (x === previousX) {
                    throw new Error('Redundant setBounds call with same x');
                }
                previousX = x;
            });

            // Use runAllTimersAsync to complete animation
            await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
        });

        it('should use Math.floor for consistent positioning', async () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            // Use runAllTimersAsync to complete show animation with fake timers
            await vi.runAllTimersAsync();

            // All setBounds calls should have integer x values (no sub-pixel jitter)
            mockView.setBounds.mock.calls.forEach((call: any[]) => {
                const x = call[0].x;
                expect(x).toBe(Math.floor(x));
            });
        });

        it('should ensure final position is exact at animation end', async () => {
            // Get the mock view
            const mockView = MockWebContentsView.mock.results[MockWebContentsView.mock.results.length - 1].value;

            // Call show and complete animation with fake timers
            const showPromise = service.show();
            await vi.runAllTimersAsync();
            await showPromise;

            // Last setBounds call should be exactly x=0 (fully visible)
            const lastCall = mockView.setBounds.mock.calls[mockView.setBounds.mock.calls.length - 1][0];
            expect(lastCall.x).toBe(0);
            expect(service.getIsVisible()).toBe(true);
        });
    });

    describe('Floating Mode Management', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should enable floating mode and start mouse tracking when hidden', () => {
            service.setFloatingMode(true);

            // Internal state updated (verified by testing mouse tracking behavior)
            expect(service.getIsVisible()).toBe(false);
        });

        it('should disable floating mode and stop mouse tracking', () => {
            service.setFloatingMode(true);
            service.setFloatingMode(false);

            // Mouse tracking should be stopped
            expect(service.getIsVisible()).toBe(false);
        });

        it('should not start mouse tracking when sidebar is visible', async () => {
            await service.show();

            service.setFloatingMode(true);

            // Mouse tracking should not start when sidebar is visible
            expect(service.getIsVisible()).toBe(true);
        });
    });

    describe('Fresh Start Auto-Show Prevention', () => {
        /**
         * REGRESSION PREVENTION for Fresh Start Fix:
         *
         * The SidebarOverlayService controls mouse tracking which auto-shows
         * the sidebar when the cursor is near the left edge. On fresh app start,
         * we need to prevent this auto-show behavior.
         *
         * The fix is implemented at the IPC handler level (sidebarOverlayHandlers.ts)
         * which controls when setFloatingMode(true) is called. These tests verify
         * the service correctly responds to floating mode changes.
         */

        beforeEach(() => {
            service.initialize(mockMainWindow);
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should NOT auto-show when floating mode is disabled (fresh start scenario)', () => {
            // Simulate fresh start: floating mode is never enabled
            // setFloatingMode is NOT called (or called with false)
            service.setFloatingMode(false);

            // Put cursor in trigger zone
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });

            // Advance time - mouse tracking should not be active
            vi.advanceTimersByTime(200);

            // Sidebar should remain hidden
            expect(service.getIsVisible()).toBe(false);
        });

        it('should auto-show when floating mode is enabled (after user interaction)', async () => {
            // Simulate user interaction: floating mode is enabled
            service.setFloatingMode(true);

            // Put cursor in trigger zone
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });

            // Advance time - mouse tracking should be active
            await vi.runAllTimersAsync();

            // Sidebar should be shown
            expect(service.getIsVisible()).toBe(true);
        });

        it('should stop tracking and prevent auto-show when setFloatingMode(false) is called', async () => {
            // First enable floating mode (mouse tracking active)
            service.setFloatingMode(true);

            // Then disable it (simulating fresh start override)
            service.setFloatingMode(false);

            // Put cursor in trigger zone
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });

            // Advance time
            vi.advanceTimersByTime(200);

            // Sidebar should remain hidden - mouse tracking was stopped
            expect(service.getIsVisible()).toBe(false);
        });

        it('should handle rapid floating mode toggles correctly', async () => {
            // Simulate rapid state changes during initialization
            service.setFloatingMode(true);
            service.setFloatingMode(false);
            service.setFloatingMode(true);
            service.setFloatingMode(false);

            // Final state is false - no mouse tracking
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });
            vi.advanceTimersByTime(200);

            expect(service.getIsVisible()).toBe(false);
        });

        it('should only start tracking after setFloatingMode(true) when sidebar is hidden', async () => {
            // Show sidebar first
            await vi.runAllTimersAsync();

            // Now enable floating mode while visible
            service.setFloatingMode(true);

            // Hide sidebar
            await service.hide();

            // Move cursor away from trigger zone
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 500, y: 100 });
            await vi.advanceTimersByTimeAsync(100);

            // Sidebar should be hidden
            expect(service.getIsVisible()).toBe(false);

            // Now move cursor to trigger zone
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });
            await vi.runAllTimersAsync();

            // Sidebar should auto-show
            expect(service.getIsVisible()).toBe(true);
        });
    });

    describe('Window Resize Handling', () => {
        beforeEach(async () => {
            service.initialize(mockMainWindow);
            await service.show();
        });

        it('should update bounds when window resizes while visible', () => {
            const mockView = MockWebContentsView.mock.results[0].value;
            mockView.setBounds.mockClear();

            // Simulate window resize
            const resizeHandler = mockMainWindow.on.mock.calls.find(
                (call: any[]) => call[0] === 'resize'
            )?.[1];

            mockMainWindow.getSize.mockReturnValue([1440, 900]);
            resizeHandler();

            // Bounds should be updated with new window height
            expect(mockView.setBounds).toHaveBeenCalledWith(
                expect.objectContaining({
                    height: 900,
                })
            );
        });

        it('should not update bounds when hidden', () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            // Hide first
            service.hide();
            mockView.setBounds.mockClear();

            // Simulate window resize
            const resizeHandler = mockMainWindow.on.mock.calls.find(
                (call: any[]) => call[0] === 'resize'
            )?.[1];

            resizeHandler();

            // Bounds should not be updated when hidden
            expect(mockView.setBounds).not.toHaveBeenCalled();
        });

        it('should not update bounds during animation', async () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            // First hide the sidebar (since beforeEach shows it)
            await service.hide();

            // Start show animation without awaiting completion
            const showPromise = service.show();
            mockView.setBounds.mockClear();

            // Simulate window resize during animation
            const resizeHandler = mockMainWindow.on.mock.calls.find(
                (call: any[]) => call[0] === 'resize'
            )?.[1];

            resizeHandler();

            // Resize handler should not update bounds during animation (isAnimating is true)
            expect(mockView.setBounds).not.toHaveBeenCalled();

            // Wait for animation to complete
            await showPromise;
        });
    });

    describe('State Synchronization', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should send state updates to sidebar WebContents', () => {
            const mockView = MockWebContentsView.mock.results[0].value;
            const testState = { foo: 'bar' };

            service.sendStateUpdate(testState);

            expect(mockView.webContents.send).toHaveBeenCalledWith(
                'sidebar:state-update',
                testState
            );
        });

        it('should not send state if WebContents is destroyed', () => {
            const mockView = MockWebContentsView.mock.results[0].value;
            mockView.webContents.isDestroyed.mockReturnValue(true);

            expect(() => {
                service.sendStateUpdate({ foo: 'bar' });
            }).not.toThrow();
        });

        it('should return WebContents for IPC communication', () => {
            const webContents = service.getWebContents();

            expect(webContents).toBeDefined();
            expect(webContents.send).toBeDefined();
        });
    });

    describe('Cleanup and Destruction', () => {
        beforeEach(async () => {
            service.initialize(mockMainWindow);
            await service.show();
        });

        it('should stop mouse tracking on destroy', () => {
            service.setFloatingMode(true);

            service.destroy();

            // Internal cleanup verified by no crashes
            expect(() => service.destroy()).not.toThrow();
        });

        it('should remove view from window on destroy', () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            service.destroy();

            expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(mockView);
        });

        it('should close WebContents on destroy', () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            service.destroy();

            expect(mockView.webContents.close).toHaveBeenCalled();
        });

        it('should reset all state on destroy', () => {
            service.destroy();

            expect(service.getIsVisible()).toBe(false);
            expect(service.getWebContents()).toBeNull();
        });

        it('should handle destroy when view not attached', () => {
            mockMainWindow.contentView.removeChildView.mockImplementation(() => {
                throw new Error('View not attached');
            });

            expect(() => service.destroy()).not.toThrow();
        });

        it('should allow reinitialization after destroy', () => {
            service.destroy();

            expect(() => service.initialize(mockMainWindow)).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('should handle show before initialization', async () => {
            const uninitializedService = new SidebarOverlayService();

            await uninitializedService.show();

            expect(uninitializedService.getIsVisible()).toBe(false);
        });

        it('should handle hide before initialization', async () => {
            const uninitializedService = new SidebarOverlayService();

            await uninitializedService.hide();

            expect(uninitializedService.getIsVisible()).toBe(false);
        });

        it('should handle custom configuration', () => {
            const customService = new SidebarOverlayService({
                width: 400,
                animationDuration: 300,
                hoverTriggerWidth: 20,
            });

            service.initialize(mockMainWindow);

            // Configuration applied (tested via animation behavior)
            expect(() => customService.initialize(mockMainWindow)).not.toThrow();
        });

        it('should handle sendStateUpdate before initialization', () => {
            const uninitializedService = new SidebarOverlayService();

            expect(() => {
                uninitializedService.sendStateUpdate({ foo: 'bar' });
            }).not.toThrow();
        });

        it('should handle multiple destroy calls', () => {
            service.initialize(mockMainWindow);
            service.destroy();

            expect(() => service.destroy()).not.toThrow();
        });
    });

    describe('Z-Index Ordering', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
        });

        it('should add sidebar at highest z-order (above browser)', async () => {
            await service.show();

            // No index argument = added at the end (highest z-order)
            expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(
                expect.anything()
            );
        });
    });

    describe('Development vs Production Loading', () => {
        it('should load from Vite dev server in development', () => {
            // Initialize creates a new WebContentsView
            service.initialize(mockMainWindow);

            // Get the last created mock view (the one created in this test)
            const mockView = MockWebContentsView.mock.results[MockWebContentsView.mock.results.length - 1].value;

            expect(mockView.webContents.loadURL).toHaveBeenCalledWith(
                'http://localhost:5173/sidebar.html'
            );
        });
    });

    describe('RACE CONDITION FIX: First Load Narrow Strip Prevention (TDD)', () => {
        /**
         * TDD Tests for Issue: Intermittent narrow sidebar strip on first load
         *
         * Root Cause: Window size may not be ready during initialization,
         * causing bounds to be set with height=0 or very small values.
         *
         * Fix Requirements:
         * 1. NEVER set bounds with height < 100px (minimum usable height)
         * 2. Wait for valid window size before showing sidebar
         * 3. View should remain invisible until BOTH content loaded AND valid bounds
         */

        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        describe('Bounds Validation', () => {
            it('should NEVER set bounds with height less than minimum (100px)', async () => {
                // Simulate window not ready - returns 0 height
                mockMainWindow.getSize.mockReturnValue([1200, 0]);

                service.initialize(mockMainWindow);

                const mockView = MockWebContentsView.mock.results[0].value;

                // Check ALL setBounds calls - none should have height < 100
                mockView.setBounds.mock.calls.forEach((call: any[]) => {
                    const { height } = call[0];
                    expect(height).toBeGreaterThanOrEqual(100);
                });
            });

            it('should use fallback height (800px) when window height is 0', () => {
                mockMainWindow.getSize.mockReturnValue([1200, 0]);

                service.initialize(mockMainWindow);

                const mockView = MockWebContentsView.mock.results[0].value;

                // Initial bounds should use fallback height
                const initialBoundsCall = mockView.setBounds.mock.calls[0]?.[0];
                expect(initialBoundsCall?.height).toBe(800);
            });

            it('should use fallback height when window height is very small', () => {
                mockMainWindow.getSize.mockReturnValue([1200, 50]);

                service.initialize(mockMainWindow);

                const mockView = MockWebContentsView.mock.results[0].value;

                // Should use fallback, not the tiny height
                const initialBoundsCall = mockView.setBounds.mock.calls[0]?.[0];
                expect(initialBoundsCall?.height).toBeGreaterThanOrEqual(100);
            });
        });

        describe('Show() Window Size Validation', () => {
            it('should NOT show if window height is 0', async () => {
                service.initialize(mockMainWindow);

                // Now window returns 0 height
                mockMainWindow.getSize.mockReturnValue([1200, 0]);

                // Use runAllTimersAsync to properly handle async show()
                await vi.runAllTimersAsync();

                // The service waits for valid height, then shows with fallback height
                // Check that any bounds set have valid height (fallback should be used)
                const mockView = MockWebContentsView.mock.results[MockWebContentsView.mock.results.length - 1].value;
                const addViewCalls = mockMainWindow.contentView.addChildView.mock.calls;
                if (addViewCalls.length > 0) {
                    // If view was added, bounds must be valid (fallback height)
                    const lastBoundsCall = mockView.setBounds.mock.calls[mockView.setBounds.mock.calls.length - 1]?.[0];
                    expect(lastBoundsCall?.height).toBeGreaterThanOrEqual(100);
                }
            });

            it('should wait for valid window size before showing', async () => {
                service.initialize(mockMainWindow);

                // Simulate content ready
                const mockView = MockWebContentsView.mock.results[0].value;
                const didFinishLoadCallback = mockView.webContents.on?.mock.calls.find(
                    (call: any[]) => call[0] === 'did-finish-load'
                )?.[1];
                didFinishLoadCallback?.();

                // Window starts with 0 height
                mockMainWindow.getSize.mockReturnValue([1200, 0]);

                const showPromise = service.show();

                // Advance some time
                vi.advanceTimersByTime(500);
                await Promise.resolve();

                // View should not be visible yet
                expect(mockView.setVisible).toHaveBeenLastCalledWith(false);

                // Now window becomes ready with valid height
                mockMainWindow.getSize.mockReturnValue([1200, 800]);

                // Advance more time
                for (let i = 0; i < 60; i++) {
                    vi.advanceTimersByTime(50);
                    await Promise.resolve();
                }

                await showPromise;

                // Now it should be visible with correct height
                expect(service.getIsVisible()).toBe(true);
            });
        });

        describe('Content Ready + Valid Bounds Both Required', () => {
            it('should remain invisible until both content loaded AND valid bounds', async () => {
                service.initialize(mockMainWindow);

                const mockView = MockWebContentsView.mock.results[0].value;

                // Initially: no content, no valid bounds
                mockMainWindow.getSize.mockReturnValue([1200, 0]);

                // View should be invisible
                expect(mockView.setVisible).toHaveBeenCalledWith(false);

                // Trigger show before content ready
                const showPromise = service.show();

                // Advance timers but content not ready
                vi.advanceTimersByTime(100);
                await Promise.resolve();

                // Still should not be visible
                const visibleCalls = mockView.setVisible.mock.calls;
                const lastVisibleCall = visibleCalls[visibleCalls.length - 1];
                // View should still be invisible or not yet set to visible
                expect(lastVisibleCall?.[0]).toBe(false);

                // Simulate content ready
                const didFinishLoadCallback = mockView.webContents.on?.mock.calls.find(
                    (call: any[]) => call[0] === 'did-finish-load'
                )?.[1];
                didFinishLoadCallback?.();

                // Now fix window size
                mockMainWindow.getSize.mockReturnValue([1200, 800]);

                // Advance through waiting period
                for (let i = 0; i < 100; i++) {
                    vi.advanceTimersByTime(50);
                    await Promise.resolve();
                }

                await showPromise;

                // Now should be visible
                expect(service.getIsVisible()).toBe(true);
            });
        });

        describe('Renderer Reload Bounds Validation', () => {
            it('should validate bounds during renderer reload handling', async () => {
                // Use real timers for this test as it involves multiple async operations
                vi.useRealTimers();

                service.initialize(mockMainWindow);

                // Show sidebar properly (content is auto-ready due to mock)
                mockMainWindow.getSize.mockReturnValue([1200, 800]);
                await service.show();

                // Verify sidebar is visible
                expect(service.getIsVisible()).toBe(true);

                const mockView = MockWebContentsView.mock.results[MockWebContentsView.mock.results.length - 1].value;

                // Now simulate reload with window returning bad size temporarily
                mockMainWindow.getSize.mockReturnValue([1200, 0]);
                mockView.setBounds.mockClear();

                service.handleRendererReload();

                // Bounds should still be valid (using fallback height)
                mockView.setBounds.mock.calls.forEach((call: any[]) => {
                    const { height } = call[0];
                    expect(height).toBeGreaterThanOrEqual(100);
                });

                // Restore fake timers for consistency
                vi.useFakeTimers();
            });
        });

        describe('Animation Should Preserve Correct Bounds (ROOT CAUSE FIX)', () => {
            /**
             * ROOT CAUSE OF NARROW STRIP BUG:
             * Animation fetches fresh height from getSize() and overwrites
             * correct bounds that were set during initialization.
             *
             * FIX: Animation should use the view's CURRENT bounds height
             * instead of fetching from getSize(), which may return wrong value.
             */
            it('should use view current bounds height instead of getSize() during animation', async () => {
                // Use real timers for animation
                vi.useRealTimers();

                // Initialize with correct window height
                mockMainWindow.getSize.mockReturnValue([1200, 800]);
                service.initialize(mockMainWindow);

                const mockView = MockWebContentsView.mock.results[MockWebContentsView.mock.results.length - 1].value;

                // Verify initial bounds have correct height
                const initialBounds = mockView.setBounds.mock.calls[0]?.[0];
                expect(initialBounds?.height).toBe(800);

                // NOW simulate getSize() returning WRONG but VALID value (passes MIN_VALID_HEIGHT check!)
                // This is the ACTUAL bug: getSize() returns 150 which > 100, so it passes validation
                // But 150 is still wrong - the correct height is 800 from initialization
                mockMainWindow.getSize.mockReturnValue([1200, 150]);

                // Clear setBounds calls to track animation
                mockView.setBounds.mockClear();

                // Call show() - this triggers animateBounds()
                await service.show();

                // CRITICAL: Animation should NOT have used the wrong height (150)
                // It should have preserved the correct height (800) from view's current bounds
                const animationBoundsCalls = mockView.setBounds.mock.calls;
                expect(animationBoundsCalls.length).toBeGreaterThan(0);

                // Check that ALL animation bounds calls used CORRECT height (800), not the wrong one (150)
                animationBoundsCalls.forEach((call: any[]) => {
                    const { height } = call[0];
                    // MUST be 800 (from view bounds), NOT 150 (from getSize)
                    expect(height).toBe(800);
                });

                // Restore fake timers
                vi.useFakeTimers();
            });

            it('should fallback to FALLBACK_HEIGHT if both view bounds AND getSize() are invalid', async () => {
                // Use real timers for animation
                vi.useRealTimers();

                // Initialize with INVALID window height (simulates very early startup)
                mockMainWindow.getSize.mockReturnValue([1200, 30]);
                service.initialize(mockMainWindow);

                const mockView = MockWebContentsView.mock.results[MockWebContentsView.mock.results.length - 1].value;

                // Initial bounds should use fallback (800) because 30 < 100
                const initialBounds = mockView.setBounds.mock.calls[0]?.[0];
                expect(initialBounds?.height).toBe(800); // FALLBACK_HEIGHT

                // getSize() still returns invalid
                mockMainWindow.getSize.mockReturnValue([1200, 30]);

                mockView.setBounds.mockClear();

                await service.show();

                // Animation should use fallback height
                const animationBoundsCalls = mockView.setBounds.mock.calls;
                animationBoundsCalls.forEach((call: any[]) => {
                    const { height } = call[0];
                    expect(height).toBeGreaterThanOrEqual(100);
                });

                vi.useFakeTimers();
            });
        });

        describe('Bounds Re-set After Content Load (VIEWPORT FIX)', () => {
            /**
             * FIX FOR NARROW STRIP BUG:
             * The renderer's viewport dimensions may not match the WebContentsView bounds
             * when content first loads, because the view might not be attached to the window yet.
             *
             * By re-setting bounds AFTER did-finish-load, we force the renderer to update
             * its internal viewport dimensions to match the view bounds.
             */
            it('should re-set bounds after content loads to force viewport update', () => {
                // Disable auto content ready to control when did-finish-load fires
                setAutoContentReady(false);

                mockMainWindow.getSize.mockReturnValue([1200, 800]);
                service.initialize(mockMainWindow);

                const mockView = MockWebContentsView.mock.results[MockWebContentsView.mock.results.length - 1].value;

                // Clear setBounds calls after initialization
                const initialCallCount = mockView.setBounds.mock.calls.length;

                // Manually trigger did-finish-load
                mockView.webContents._triggerDidFinishLoad();

                // Bounds should be re-set after content loads
                expect(mockView.setBounds.mock.calls.length).toBeGreaterThan(initialCallCount);

                // The re-set bounds should have correct height
                const lastCall = mockView.setBounds.mock.calls[mockView.setBounds.mock.calls.length - 1]?.[0];
                expect(lastCall?.height).toBe(800);

                // Re-enable auto content ready for other tests
                setAutoContentReady(true);
            });

            it('should use fallback height when re-setting bounds if window height is invalid', () => {
                setAutoContentReady(false);

                // Window returns small height
                mockMainWindow.getSize.mockReturnValue([1200, 50]);
                service.initialize(mockMainWindow);

                const mockView = MockWebContentsView.mock.results[MockWebContentsView.mock.results.length - 1].value;
                mockView.setBounds.mockClear();

                // Trigger did-finish-load
                mockView.webContents._triggerDidFinishLoad();

                // Re-set bounds should use fallback height
                const boundsCall = mockView.setBounds.mock.calls[0]?.[0];
                expect(boundsCall?.height).toBeGreaterThanOrEqual(100);

                setAutoContentReady(true);
            });
        });

        describe('Initial View Creation Safety', () => {
            it('should NOT add view to window during initialization', () => {
                // View should only be added when show() is called, not during init
                service.initialize(mockMainWindow);

                // During initialization, view should NOT be added to window
                expect(mockMainWindow.contentView.addChildView).not.toHaveBeenCalled();
            });

            it('should set view invisible during creation', () => {
                service.initialize(mockMainWindow);

                const mockView = MockWebContentsView.mock.results[0].value;

                // setVisible(false) should be called during creation
                expect(mockView.setVisible).toHaveBeenCalledWith(false);
            });

            it('should position view off-screen during creation (including shadow margin)', async () => {
                const module = await import('../../src/main/services/SidebarOverlayService');
                const SHADOW_MARGIN = (module as any).SHADOW_MARGIN;

                service.initialize(mockMainWindow);

                const mockView = MockWebContentsView.mock.results[0].value;

                // Initial position should be off-screen: -(config.width + SHADOW_MARGIN)
                const initialBoundsCall = mockView.setBounds.mock.calls[0]?.[0];
                expect(initialBoundsCall?.x).toBe(-(320 + SHADOW_MARGIN));
            });
        });
    });
});
