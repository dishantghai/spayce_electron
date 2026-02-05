import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * B017: Sidebar Hover-to-Open Broken After System Sleep/Wake
 *
 * ROOT CAUSE 1: After resume, mouse tracking restarts immediately but the
 * renderer has a 1.5s cooldown. Mouse tracking calls show() during cooldown,
 * which stops tracking and enters a dead state (overlay visible, renderer
 * unaware, tracking permanently stopped).
 *
 * ROOT CAUSE 2: The catch block in mouse tracking calls stopMouseTracking()
 * on ANY error, permanently killing hover detection if a transient error
 * occurs after system wake.
 *
 * FIX 1: Add a resumeCooldownUntil timestamp. Mouse tracking skips auto-show
 * during the 2s post-resume cooldown.
 *
 * FIX 2: Remove stopMouseTracking() from the catch block.
 */

// Mock Electron
let autoContentReady = true;
let mockCursorPoint = { x: 500, y: 500 };
let mockGetCursorThrows = false;

const createMockWebContents = () => {
    const callbacks: Map<string, (() => void)[]> = new Map();
    return {
        loadURL: vi.fn().mockResolvedValue(undefined),
        loadFile: vi.fn().mockResolvedValue(undefined),
        close: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        send: vi.fn(),
        openDevTools: vi.fn(),
        on: vi.fn().mockImplementation((event: string, callback: () => void) => {
            if (!callbacks.has(event)) callbacks.set(event, []);
            callbacks.get(event)!.push(callback);
            if (autoContentReady && event === 'did-finish-load') callback();
        }),
    };
};

const createMockWebContentsView = () => {
    let currentBounds = { x: 0, y: 0, width: 360, height: 800 };
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
    isDestroyed: vi.fn().mockReturnValue(false),
    webContents: {
        send: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
    },
    on: vi.fn(),
});

let mockWebContentsView: ReturnType<typeof createMockWebContentsView>;

vi.mock('electron', () => ({
    BrowserWindow: vi.fn(),
    WebContentsView: vi.fn().mockImplementation(() => {
        mockWebContentsView = createMockWebContentsView();
        return mockWebContentsView;
    }),
    app: {
        isPackaged: false,
        getAppPath: vi.fn().mockReturnValue('/app'),
    },
    screen: {
        getCursorScreenPoint: vi.fn().mockImplementation(() => {
            if (mockGetCursorThrows) {
                throw new Error('Display not available');
            }
            return { ...mockCursorPoint };
        }),
    },
}));

// Reset singleton between tests
let SidebarOverlayService: any;
let getSidebarOverlayService: any;

describe('B017: Sidebar Hover After Sleep Fix', () => {
    let service: any;
    let mockMainWindow: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        autoContentReady = true;
        mockCursorPoint = { x: 500, y: 500 };
        mockGetCursorThrows = false;

        // Reset module to get fresh singleton
        vi.resetModules();
        const module = await import('../src/main/services/SidebarOverlayService');
        SidebarOverlayService = module.SidebarOverlayService;
        getSidebarOverlayService = module.getSidebarOverlayService;

        mockMainWindow = createMockBrowserWindow();
        service = getSidebarOverlayService();
        service.initialize(mockMainWindow);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Post-Resume Cooldown Prevents Auto-Show', () => {
        it('should NOT call show() when cursor is at left edge during post-resume cooldown', async () => {
            // Enable floating mode and start tracking
            service.setFloatingMode(true);

            // Simulate resume
            service.handleSystemResume();

            // Move cursor to left edge (trigger zone)
            mockCursorPoint = { x: 3, y: 400 };

            // Advance past several tracking intervals (100ms each)
            await vi.advanceTimersByTimeAsync(500);

            // The sidebar should NOT have been shown
            expect(service.getIsVisible()).toBe(false);
        });

        it('should resume auto-show after the cooldown period expires', async () => {
            // Enable floating mode
            service.setFloatingMode(true);

            // Simulate resume
            service.handleSystemResume();

            // Move cursor away from left edge first
            mockCursorPoint = { x: 500, y: 400 };

            // Advance past the cooldown period (2s)
            await vi.advanceTimersByTimeAsync(2100);

            // Now move cursor to left edge
            mockCursorPoint = { x: 3, y: 400 };

            // Advance past one tracking interval
            await vi.advanceTimersByTimeAsync(200);

            // Wait for show() animation
            await vi.advanceTimersByTimeAsync(300);

            // Now the sidebar should be visible (auto-show is no longer blocked)
            expect(service.getIsVisible()).toBe(true);
        });

        it('should keep mouse tracking active during the cooldown (not stopped)', async () => {
            service.setFloatingMode(true);

            // Simulate resume
            service.handleSystemResume();

            // Verify mouse tracking interval is still running
            // (getMouseTrackingActive or similar accessor)
            // We test this indirectly: after cooldown, cursor at edge should trigger show
            mockCursorPoint = { x: 500, y: 400 };
            await vi.advanceTimersByTimeAsync(2100);

            mockCursorPoint = { x: 3, y: 400 };
            await vi.advanceTimersByTimeAsync(200);
            await vi.advanceTimersByTimeAsync(300);

            expect(service.getIsVisible()).toBe(true);
        });

        it('should export RESUME_COOLDOWN_MS constant', async () => {
            const module = await import('../src/main/services/SidebarOverlayService');
            expect((module as any).RESUME_COOLDOWN_MS).toBeGreaterThanOrEqual(1500);
        });
    });

    describe('Mouse Tracking Error Resilience', () => {
        it('should NOT permanently stop tracking when getCursorScreenPoint throws', async () => {
            service.setFloatingMode(true);

            // Simulate transient error
            mockGetCursorThrows = true;

            // Advance past several tracking intervals
            await vi.advanceTimersByTimeAsync(500);

            // Error should have occurred but tracking should still be active
            // Verify by fixing the error and checking that auto-show works
            mockGetCursorThrows = false;
            mockCursorPoint = { x: 3, y: 400 };

            await vi.advanceTimersByTimeAsync(200);
            await vi.advanceTimersByTimeAsync(300);

            // Sidebar should show — tracking survived the transient error
            expect(service.getIsVisible()).toBe(true);
        });

        it('should log error but continue tracking on getCursorScreenPoint failure', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            service.setFloatingMode(true);

            mockGetCursorThrows = true;
            await vi.advanceTimersByTimeAsync(200); // 2 ticks

            // Errors should have been logged
            expect(consoleSpy).toHaveBeenCalled();

            // Fix the error
            mockGetCursorThrows = false;
            mockCursorPoint = { x: 3, y: 400 };
            await vi.advanceTimersByTimeAsync(200);
            await vi.advanceTimersByTimeAsync(300);

            // Tracking still works
            expect(service.getIsVisible()).toBe(true);

            consoleSpy.mockRestore();
        });
    });

    describe('Existing B008 Behavior Preserved', () => {
        it('should still hide the overlay on resume if it was visible', async () => {
            service.setFloatingMode(true);

            // Show the sidebar first
            mockCursorPoint = { x: 3, y: 400 };
            await vi.advanceTimersByTimeAsync(200);
            await vi.advanceTimersByTimeAsync(300);
            expect(service.getIsVisible()).toBe(true);

            // Now simulate resume
            service.handleSystemResume();

            // Sidebar should be hidden
            expect(service.getIsVisible()).toBe(false);
        });

        it('should still reset isAnimating on resume', () => {
            service.setFloatingMode(true);

            // Force isAnimating to true
            (service as any).isAnimating = true;

            service.handleSystemResume();

            expect((service as any).isAnimating).toBe(false);
        });

        it('should still restart mouse tracking on resume when in floating mode', () => {
            service.setFloatingMode(true);

            // Stop tracking to test restart
            (service as any).stopMouseTracking();
            expect((service as any).mouseTrackingInterval).toBeNull();

            // Resume should restart it
            service.handleSystemResume();

            expect((service as any).mouseTrackingInterval).not.toBeNull();
        });
    });
});
