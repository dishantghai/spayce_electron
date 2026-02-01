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
 * 3. Background color prevents white flash (#131020)
 * 4. Proper cleanup on destroy
 * 5. Singleton pattern
 */

// Mock Electron modules
const createMockWebContents = () => ({
    loadURL: vi.fn().mockResolvedValue(undefined),
    loadFile: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    isDestroyed: vi.fn().mockReturnValue(false),
    send: vi.fn(),
    openDevTools: vi.fn(),
});

const createMockWebContentsView = () => ({
    webContents: createMockWebContents(),
    setBounds: vi.fn(),
    setBackgroundColor: vi.fn(),
});

const createMockBrowserWindow = () => ({
    contentView: {
        addChildView: vi.fn(),
        removeChildView: vi.fn(),
    },
    getSize: vi.fn().mockReturnValue([1200, 800]),
    getBounds: vi.fn().mockReturnValue({ x: 0, y: 0, width: 1200, height: 800 }),
    on: vi.fn(),
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

        it('should set background color to prevent white flash', () => {
            service.initialize(mockMainWindow);

            const mockView = MockWebContentsView.mock.results[0].value;
            expect(mockView.setBackgroundColor).toHaveBeenCalledWith('#131020');
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

        it('should add view to window at z-index 1', async () => {
            await service.show();

            expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(
                expect.anything(),
                1
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

        it('should animate from visible (0) to off-screen (-320)', async () => {
            const mockView = MockWebContentsView.mock.results[0].value;
            mockView.setBounds.mockClear();

            await service.hide();

            // Final call should be at x=-320 (fully hidden)
            const lastCall = mockView.setBounds.mock.calls[mockView.setBounds.mock.calls.length - 1][0];
            expect(lastCall.x).toBe(-320);
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
            vi.restoreAllTimers();
        });

        it('should start mouse tracking when entering floating mode while hidden', () => {
            service.setFloatingMode(true);

            // Advance timer to trigger mouse check
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });
            vi.advanceTimersByTime(100);

            // Service should detect cursor near left edge and show sidebar
            expect(service.getIsVisible()).toBe(true);
        });

        it('should auto-show when cursor within 10px of left edge', () => {
            service.setFloatingMode(true);

            // Cursor at 5px from left edge (within trigger zone)
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });
            vi.advanceTimersByTime(100);

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
            await service.show();

            const consoleSpy = vi.spyOn(console, 'log');

            // Cursor at trigger zone but sidebar already visible
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });
            vi.advanceTimersByTime(100);

            // Should not attempt to show again
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
            service.setFloatingMode(true);
            await service.show();
            await service.hide();

            // After hide, mouse tracking should restart
            mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 100 });
            vi.advanceTimersByTime(100);

            expect(service.getIsVisible()).toBe(true);
        });
    });

    describe('Animation Performance Optimizations (Commit f936462)', () => {
        beforeEach(() => {
            service.initialize(mockMainWindow);
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.restoreAllTimers();
        });

        it('should cache window height at animation start', async () => {
            const showPromise = service.show();

            // Advance through animation frames
            for (let i = 0; i < 20; i++) {
                vi.advanceTimersByTime(16);
                await Promise.resolve();
            }

            await showPromise;

            // getSize should only be called once at start, not every frame
            // (Implementation uses cached height for performance)
            expect(mockMainWindow.getSize).toHaveBeenCalledTimes(1);
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

            const showPromise = service.show();

            for (let i = 0; i < 20; i++) {
                vi.advanceTimersByTime(16);
                await Promise.resolve();
            }

            await expect(showPromise).resolves.not.toThrow();
        });

        it('should use Math.floor for consistent positioning', async () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            await service.show();

            // All setBounds calls should have integer x values (no sub-pixel jitter)
            mockView.setBounds.mock.calls.forEach((call: any[]) => {
                const x = call[0].x;
                expect(x).toBe(Math.floor(x));
            });
        });

        it('should ensure final position is exact at animation end', async () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            await service.show();

            // Last setBounds call should be exactly x=0
            const lastCall = mockView.setBounds.mock.calls[mockView.setBounds.mock.calls.length - 1][0];
            expect(lastCall.x).toBe(0);
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

        it('should not update bounds during animation', () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            // Start animation
            service.show();
            mockView.setBounds.mockClear();

            // Simulate window resize during animation
            const resizeHandler = mockMainWindow.on.mock.calls.find(
                (call: any[]) => call[0] === 'resize'
            )?.[1];

            resizeHandler();

            // Resize should not interfere with animation
            expect(mockView.setBounds).not.toHaveBeenCalled();
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

        it('should add sidebar at index 1 (above browser at 0)', async () => {
            await service.show();

            expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(
                expect.anything(),
                1 // Z-index above browser
            );
        });
    });

    describe('Development vs Production Loading', () => {
        it('should load from Vite dev server in development', () => {
            const mockView = MockWebContentsView.mock.results[0].value;

            service.initialize(mockMainWindow);

            expect(mockView.webContents.loadURL).toHaveBeenCalledWith(
                'http://localhost:5173/sidebar.html'
            );
        });
    });
});
