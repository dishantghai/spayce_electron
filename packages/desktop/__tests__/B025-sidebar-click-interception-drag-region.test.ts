import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * B025: Sidebar Overlay Click Events Not Captured Over Tab Bar Drag Region
 *
 * ROOT CAUSE: The BrowserTabBar uses `-webkit-app-region: drag` for window
 * dragging functionality. In Electron, drag regions are handled at the Chromium
 * compositor level and can intercept mouse events even through overlapping
 * transparent WebContentsViews.
 *
 * When clicking on the sidebar overlay:
 * - If a tab element (with `no-drag`) is behind → clicks are captured ✓
 * - If empty tab bar area (with `drag`) is behind → clicks are intercepted ✗
 *
 * FIX:
 * 1. Add `-webkit-app-region: no-drag` to sidebar.html #sidebar-root (defensive)
 * 2. Add `sidebarOverlayActive` prop to BrowserTabBar that dynamically disables
 *    drag regions when the sidebar overlay is visible. This is the actual fix
 *    because drag regions in the MAIN RENDERER intercept clicks even through
 *    overlapping WebContentsViews.
 *
 * EVIDENCE:
 * - BrowserTabBar.module.css line 15: `.tabBar { -webkit-app-region: drag; }`
 * - BrowserTabBar.module.css line 59: `.tabsContainer { -webkit-app-region: no-drag; }`
 * - BrowserTabBar.module.css line 202: `.tabBarSpacer { -webkit-app-region: drag; }`
 * - Clicks work over tab elements (no-drag) but fail over empty space (drag)
 */

describe('B025: Sidebar Overlay Click Interception Over Drag Region', () => {
    describe('Sidebar Overlay Has no-drag Region', () => {
        it('should have -webkit-app-region: no-drag on #sidebar-root', () => {
            const htmlPath = path.resolve(__dirname, '../src/renderer/sidebar.html');
            const html = fs.readFileSync(htmlPath, 'utf-8');

            // Extract style content
            const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
            expect(styleMatch).toBeTruthy();

            const styleContent = styleMatch![1];

            // The #sidebar-root should have -webkit-app-region: no-drag
            // This prevents underlying drag regions from intercepting clicks
            expect(styleContent).toMatch(/-webkit-app-region:\s*no-drag/);
        });

        it('should apply no-drag to the root container element', () => {
            const htmlPath = path.resolve(__dirname, '../src/renderer/sidebar.html');
            const html = fs.readFileSync(htmlPath, 'utf-8');

            // Extract style content
            const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
            expect(styleMatch).toBeTruthy();

            const styleContent = styleMatch![1];

            // Find the standalone #sidebar-root rule (not the shared html, body, #sidebar-root rule)
            // The standalone rule starts with whitespace/newline followed by #sidebar-root
            // Match pattern: newline + optional whitespace + #sidebar-root + whitespace + { ... }
            const standaloneRuleMatch = styleContent.match(/\n\s*\/\*[^*]*\*\/\s*\n\s*#sidebar-root\s*\{([^}]*)\}/);
            expect(standaloneRuleMatch).toBeTruthy();
            expect(standaloneRuleMatch![1]).toMatch(/-webkit-app-region:\s*no-drag/);
        });
    });

    describe('BrowserTabBar Drag Regions Preserved', () => {
        /**
         * The BrowserTabBar needs drag regions for window dragging when sidebar
         * is not visible. We must NOT remove these - only override them in the
         * sidebar overlay.
         */

        it('should have drag region on .tabBar container', () => {
            const cssPath = path.resolve(__dirname, '../../react-ui/src/components/browser/BrowserTabBar.module.css');
            const css = fs.readFileSync(cssPath, 'utf-8');

            // .tabBar should still have -webkit-app-region: drag for window dragging
            const tabBarRule = css.match(/\.tabBar\s*\{([^}]*)\}/);
            expect(tabBarRule).toBeTruthy();
            expect(tabBarRule![1]).toMatch(/-webkit-app-region:\s*drag/);
        });

        it('should have no-drag on .tabsContainer (tab elements)', () => {
            const cssPath = path.resolve(__dirname, '../../react-ui/src/components/browser/BrowserTabBar.module.css');
            const css = fs.readFileSync(cssPath, 'utf-8');

            // .tabsContainer should have no-drag so tabs are clickable
            const tabsContainerRule = css.match(/\.tabsContainer\s*\{([^}]*)\}/);
            expect(tabsContainerRule).toBeTruthy();
            expect(tabsContainerRule![1]).toMatch(/-webkit-app-region:\s*no-drag/);
        });

        it('should have drag region on .tabBarSpacer (empty space)', () => {
            const cssPath = path.resolve(__dirname, '../../react-ui/src/components/browser/BrowserTabBar.module.css');
            const css = fs.readFileSync(cssPath, 'utf-8');

            // .tabBarSpacer should still have drag for window dragging
            const spacerRule = css.match(/\.tabBarSpacer\s*\{([^}]*)\}/);
            expect(spacerRule).toBeTruthy();
            expect(spacerRule![1]).toMatch(/-webkit-app-region:\s*drag/);
        });

        it('should have no-drag on .newTabButton', () => {
            const cssPath = path.resolve(__dirname, '../../react-ui/src/components/browser/BrowserTabBar.module.css');
            const css = fs.readFileSync(cssPath, 'utf-8');

            // .newTabButton should have no-drag so it's clickable
            const buttonRule = css.match(/\.newTabButton\s*\{([^}]*)\}/);
            expect(buttonRule).toBeTruthy();
            expect(buttonRule![1]).toMatch(/-webkit-app-region:\s*no-drag/);
        });
    });

    describe('Sidebar HTML Structure Integrity', () => {
        it('should maintain transparent background on html/body/#sidebar-root', () => {
            const htmlPath = path.resolve(__dirname, '../src/renderer/sidebar.html');
            const html = fs.readFileSync(htmlPath, 'utf-8');

            // Extract style content
            const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
            expect(styleMatch).toBeTruthy();

            const styleContent = styleMatch![1];

            // The shared rule for html, body, #sidebar-root should have transparent background
            // This is critical for the shadow rendering (B015) and must not be changed
            expect(styleContent).toMatch(/background-color:\s*transparent/);
        });

        it('should have #sidebar-root element in the body', () => {
            const htmlPath = path.resolve(__dirname, '../src/renderer/sidebar.html');
            const html = fs.readFileSync(htmlPath, 'utf-8');

            expect(html).toMatch(/<div id="sidebar-root">/);
        });
    });

    describe('Dynamic Drag Region Disable (Main Fix)', () => {
        /**
         * The actual fix is to dynamically disable drag regions in the main renderer
         * when the sidebar overlay is visible. This is done via the sidebarOverlayActive
         * prop which applies inline styles to override the CSS drag regions.
         */

        it('BrowserTabBar should have sidebarOverlayActive prop in interface', () => {
            const tsxPath = path.resolve(__dirname, '../../react-ui/src/components/browser/BrowserTabBar.tsx');
            const tsx = fs.readFileSync(tsxPath, 'utf-8');

            // The prop should be defined in BrowserTabBarProps interface
            expect(tsx).toMatch(/sidebarOverlayActive\??\s*:\s*boolean/);
        });

        it('BrowserTabBar should apply no-drag style when sidebarOverlayActive is true', () => {
            const tsxPath = path.resolve(__dirname, '../../react-ui/src/components/browser/BrowserTabBar.tsx');
            const tsx = fs.readFileSync(tsxPath, 'utf-8');

            // Should have logic to apply WebkitAppRegion: 'no-drag' based on the prop
            expect(tsx).toMatch(/sidebarOverlayActive/);
            expect(tsx).toMatch(/WebkitAppRegion.*no-drag|no-drag.*WebkitAppRegion/i);
        });

        it('BrowserArea should have sidebarOverlayActive prop in interface', () => {
            const tsxPath = path.resolve(__dirname, '../../react-ui/src/components/browser/BrowserArea.tsx');
            const tsx = fs.readFileSync(tsxPath, 'utf-8');

            // The prop should be defined in BrowserAreaProps interface
            expect(tsx).toMatch(/sidebarOverlayActive\??\s*:\s*boolean/);
        });

        it('BrowserArea should pass sidebarOverlayActive to BrowserTabBar', () => {
            const tsxPath = path.resolve(__dirname, '../../react-ui/src/components/browser/BrowserArea.tsx');
            const tsx = fs.readFileSync(tsxPath, 'utf-8');

            // Should pass the prop to BrowserTabBar
            expect(tsx).toMatch(/BrowserTabBar[\s\S]*sidebarOverlayActive/);
        });

        it('App.tsx should pass sidebarOverlayActive based on overlay visibility', () => {
            const tsxPath = path.resolve(__dirname, '../src/renderer/App.tsx');
            const tsx = fs.readFileSync(tsxPath, 'utf-8');

            // Should pass sidebarOverlayActive to BrowserArea
            expect(tsx).toMatch(/BrowserArea[\s\S]*sidebarOverlayActive/);
            // Should be based on useOverlayMode and sidebarVisible
            expect(tsx).toMatch(/sidebarOverlayActive=\{.*useOverlayMode.*sidebarVisible|sidebarOverlayActive=\{.*sidebarVisible.*useOverlayMode/);
        });
    });
});
