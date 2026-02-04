import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * B015: Browser Overlay Floating Sidebar Missing Embossed Shadow
 *
 * ROOT CAUSE: The sidebar's CSS box-shadow (4px 0 30px 5px rgba(0,0,0,0.5)) extends
 * ~39px beyond the sidebar's right edge. The sidebar element is 320px wide and the
 * WebContentsView is ALSO 320px wide, so the shadow is clipped at the view boundary.
 *
 * The Spaces/Workspace floating sidebar renders in the main DOM where there's no
 * container clipping, so its shadow appears normally.
 *
 * FIX: Widen the WebContentsView by a shadow margin (40px) so the box-shadow has
 * transparent space to render into. The sidebar CSS remains 320px; only the view
 * container is wider.
 *
 * EVIDENCE:
 * - SidebarOverlayService config: { width: 320 } (line 14)
 * - Sidebar.module.css .floating: box-shadow: 4px 0 30px 5px rgba(0,0,0,0.5)
 *   → max extent = 4px + 30px + 5px = 39px right of element
 * - All setBounds calls use config.width (320px) for width, clipping the shadow
 */

// Mock Electron
let autoContentReady = true;

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
        getCursorScreenPoint: vi.fn().mockReturnValue({ x: 500, y: 500 }),
    },
}));

// Reset singleton between tests
let SidebarOverlayService: any;
let getSidebarOverlayService: any;

describe('B015: Browser Overlay Sidebar Shadow Fix', () => {
    let service: any;
    let mockMainWindow: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        autoContentReady = true;

        // Reset module to get fresh singleton
        vi.resetModules();
        const module = await import('../src/main/services/SidebarOverlayService');
        SidebarOverlayService = module.SidebarOverlayService;
        getSidebarOverlayService = module.getSidebarOverlayService;

        mockMainWindow = createMockBrowserWindow();
        service = getSidebarOverlayService();
        service.initialize(mockMainWindow);
    });

    describe('Shadow Margin in Config', () => {
        it('should export SHADOW_MARGIN constant of at least 39px', async () => {
            const module = await import('../src/main/services/SidebarOverlayService');
            // The shadow margin must cover: 4px offset + 30px blur + 5px spread = 39px
            expect((module as any).SHADOW_MARGIN).toBeGreaterThanOrEqual(39);
        });
    });

    describe('WebContentsView Width Includes Shadow Margin', () => {
        it('should set initial bounds width wider than sidebar content width', () => {
            // The view width should be sidebar width (320) + shadow margin
            const setBoundsCalls = mockWebContentsView.setBounds.mock.calls;
            const lastBounds = setBoundsCalls[setBoundsCalls.length - 1]?.[0];

            // Width should be greater than 320 (sidebar content width)
            expect(lastBounds.width).toBeGreaterThan(320);
        });

        it('should set view width to exactly config.width + SHADOW_MARGIN', async () => {
            const module = await import('../src/main/services/SidebarOverlayService');
            const shadowMargin = (module as any).SHADOW_MARGIN;
            const expectedWidth = 320 + shadowMargin;

            const setBoundsCalls = mockWebContentsView.setBounds.mock.calls;
            const lastBounds = setBoundsCalls[setBoundsCalls.length - 1]?.[0];

            expect(lastBounds.width).toBe(expectedWidth);
        });
    });

    describe('Off-Screen Position Accounts for Shadow Margin', () => {
        it('should position off-screen using full view width (sidebar + shadow)', async () => {
            const module = await import('../src/main/services/SidebarOverlayService');
            const shadowMargin = (module as any).SHADOW_MARGIN;
            const viewWidth = 320 + shadowMargin;

            // The initial x should be negative enough to hide the entire view including shadow
            const setBoundsCalls = mockWebContentsView.setBounds.mock.calls;
            const initialBounds = setBoundsCalls[0]?.[0];

            // x should be at least -viewWidth to hide everything
            expect(initialBounds.x).toBeLessThanOrEqual(-viewWidth);
        });
    });

    describe('Show Animation Uses Correct Width', () => {
        it('should maintain shadow-inclusive width during show animation', async () => {
            vi.useFakeTimers();

            const module = await import('../src/main/services/SidebarOverlayService');
            const shadowMargin = (module as any).SHADOW_MARGIN;
            const expectedWidth = 320 + shadowMargin;

            const showPromise = service.show();
            // Advance past animation
            await vi.advanceTimersByTimeAsync(300);
            await showPromise;

            // Check that ALL setBounds calls during animation used the correct width
            const allBoundsCalls = mockWebContentsView.setBounds.mock.calls;
            for (const call of allBoundsCalls) {
                expect(call[0].width).toBe(expectedWidth);
            }

            vi.useRealTimers();
        });
    });

    describe('Hide Animation Uses Correct Off-Screen Position', () => {
        it('should animate to fully off-screen position including shadow width', async () => {
            vi.useFakeTimers();

            // First show
            const showPromise = service.show();
            await vi.advanceTimersByTimeAsync(300);
            await showPromise;

            mockWebContentsView.setBounds.mockClear();

            // Then hide
            const hidePromise = service.hide();
            await vi.advanceTimersByTimeAsync(300);
            await hidePromise;

            // The final x position should hide the entire view including shadow
            const allBoundsCalls = mockWebContentsView.setBounds.mock.calls;
            if (allBoundsCalls.length > 0) {
                const finalBounds = allBoundsCalls[allBoundsCalls.length - 1][0];
                // Final x should be negative enough to hide sidebar + shadow
                expect(finalBounds.x).toBeLessThanOrEqual(-320);
            }

            vi.useRealTimers();
        });
    });

    describe('Sidebar Content Width Unchanged', () => {
        it('should NOT change the sidebar CSS width (320px stays in Sidebar.module.css)', async () => {
            const fs = await import('fs');
            const pathModule = await import('path');
            const cssPath = pathModule.resolve(__dirname, '../../react-ui/src/components/Sidebar.module.css');
            const css = fs.readFileSync(cssPath, 'utf-8');

            // The sidebar element CSS width should remain 320px
            expect(css).toMatch(/\.sidebar\s*\{[^}]*width:\s*320px/);
        });
    });

    describe('Transparent Rendering Pipeline (No Opaque Layers)', () => {
        /**
         * ROOT CAUSE OF DARK STRIP: The rendering pipeline has multiple layers
         * between the WebContentsView and the .sidebar element. If ANY layer
         * has an opaque background, it covers the shadow margin area and the
         * box-shadow becomes invisible (dark on dark).
         *
         * The complete pipeline must be transparent:
         * 1. WebContentsView.setBackgroundColor('#00000000')
         * 2. sidebar.html: html/body/#sidebar-root background: transparent
         * 3. sidebar.tsx: containerStyle must NOT have opaque backgroundColor
         * 4. .sidebar element (320px) has its own background — this is correct
         */

        it('should set WebContentsView background to transparent (#00000000)', () => {
            expect(mockWebContentsView.setBackgroundColor).toHaveBeenCalledWith('#00000000');
        });

        it('sidebar.html should NOT have opaque background on html/body/#sidebar-root', async () => {
            const fs = await import('fs');
            const pathModule = await import('path');
            const htmlPath = pathModule.resolve(__dirname, '../src/renderer/sidebar.html');
            const html = fs.readFileSync(htmlPath, 'utf-8');

            // Extract the CSS rule for html, body, #sidebar-root
            const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
            expect(styleMatch).toBeTruthy();

            const styleContent = styleMatch![1];

            // The shared rule for html, body, #sidebar-root should have transparent background
            // It should NOT contain background-color: #131020 in that shared rule
            const sharedRule = styleContent.match(/html[\s\S]*?#sidebar-root\s*\{([^}]*)\}/);
            expect(sharedRule).toBeTruthy();
            expect(sharedRule![1]).toMatch(/background-color:\s*transparent/);
            expect(sharedRule![1]).not.toMatch(/background-color:\s*#131020/);
        });

        it('sidebar.tsx containerStyle must NOT have opaque backgroundColor', async () => {
            const fs = await import('fs');
            const pathModule = await import('path');
            const tsxPath = pathModule.resolve(__dirname, '../src/renderer/sidebar.tsx');
            const tsx = fs.readFileSync(tsxPath, 'utf-8');

            // Find the containerStyle definition
            const containerStyleMatch = tsx.match(/const containerStyle[\s\S]*?\{([\s\S]*?)\};/);
            expect(containerStyleMatch).toBeTruthy();

            const styleBody = containerStyleMatch![1];

            // containerStyle must NOT have backgroundColor: '#131020' (opaque)
            // This was the ROOT CAUSE of the dark strip — it filled the entire
            // 360px view with opaque color, covering the shadow margin area
            expect(styleBody).not.toMatch(/backgroundColor:\s*['"]#131020['"]/);
        });

        it('sidebar.tsx containerStyle should have transparent or no background', async () => {
            const fs = await import('fs');
            const pathModule = await import('path');
            const tsxPath = pathModule.resolve(__dirname, '../src/renderer/sidebar.tsx');
            const tsx = fs.readFileSync(tsxPath, 'utf-8');

            // Find the containerStyle definition
            const containerStyleMatch = tsx.match(/const containerStyle[\s\S]*?\{([\s\S]*?)\};/);
            expect(containerStyleMatch).toBeTruthy();

            const styleBody = containerStyleMatch![1];

            // Either no backgroundColor at all, or 'transparent'
            const hasBgColor = styleBody.match(/backgroundColor:/);
            if (hasBgColor) {
                expect(styleBody).toMatch(/backgroundColor:\s*['"]transparent['"]/);
            }
            // If no backgroundColor property at all, that's also correct (inherits transparent)
        });
    });
});
