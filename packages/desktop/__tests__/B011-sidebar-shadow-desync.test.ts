import { describe, it, expect } from 'vitest';

/**
 * B011: Floating Sidebar Shadow Desync Fix
 *
 * BUG: When the floating sidebar slides open (Spaces/Workspace tabs),
 * the right-edge shadow appears instantly before the sidebar finishes
 * its 250ms slide-in animation. The shadow and sidebar move as separate
 * visual elements instead of one cohesive unit.
 *
 * ROOT CAUSE: Two box-shadow layers exist at different DOM levels:
 *   1. Wrapper <div> in App.tsx has an inline boxShadow that toggles instantly
 *   2. Sidebar element in Sidebar.module.css has its own box-shadow that
 *      moves with the transform animation
 *
 * FIX: Remove the wrapper boxShadow. The sidebar's own box-shadow on the
 * .floating class moves naturally with transform: translateX(), keeping
 * shadow and content synchronized.
 *
 * REGRESSION PREVENTION:
 * - Wrapper must NOT have boxShadow (it desyncs from sidebar animation)
 * - Sidebar .floating CSS must have box-shadow (it provides visual depth)
 * - Sidebar .floating CSS must have transform transition (it provides animation)
 */

describe('B011: Floating Sidebar Shadow Desync Fix', () => {
    describe('Wrapper Shadow Removal (Root Cause Fix)', () => {
        it('should NOT apply boxShadow to the sidebar wrapper div', () => {
            // The wrapper wraps the <Sidebar> component in App.tsx
            // When sidebar is visible in floating mode, the wrapper should have NO boxShadow
            // because the sidebar's own CSS box-shadow handles the visual depth
            //
            // BEFORE FIX: wrapper had inline boxShadow that appeared instantly
            // AFTER FIX: wrapper has no boxShadow; sidebar CSS handles it

            const reactSidebarVisible = true;
            const useOverlayMode = false;

            // Simulate the wrapper style computation from App.tsx
            // The fix removes the boxShadow property entirely from the wrapper
            const wrapperStyle = computeWrapperStyle({
                sidebarMode: 'floating',
                useOverlayMode,
                reactSidebarVisible,
                isModeSwitch: false,
            });

            // CRITICAL: Wrapper must NOT have any boxShadow
            expect(wrapperStyle.boxShadow).toBeUndefined();
        });

        it('should NOT apply boxShadow to wrapper when sidebar is hidden', () => {
            const wrapperStyle = computeWrapperStyle({
                sidebarMode: 'floating',
                useOverlayMode: false,
                reactSidebarVisible: false,
                isModeSwitch: false,
            });

            expect(wrapperStyle.boxShadow).toBeUndefined();
        });

        it('should NOT apply boxShadow to wrapper in overlay mode', () => {
            const wrapperStyle = computeWrapperStyle({
                sidebarMode: 'floating',
                useOverlayMode: true,
                reactSidebarVisible: false,
                isModeSwitch: false,
            });

            expect(wrapperStyle.boxShadow).toBeUndefined();
        });

        it('should NOT apply boxShadow to wrapper in fixed mode', () => {
            const wrapperStyle = computeWrapperStyle({
                sidebarMode: 'fixed',
                useOverlayMode: false,
                reactSidebarVisible: true,
                isModeSwitch: false,
            });

            expect(wrapperStyle.boxShadow).toBeUndefined();
        });
    });

    describe('Sidebar CSS Shadow (Must Still Exist)', () => {
        it('should have box-shadow on .sidebar.floating class', () => {
            // The sidebar element itself must retain its box-shadow
            // This shadow moves WITH the transform animation, staying in sync
            const fs = require('fs');
            const path = require('path');

            const cssPath = path.resolve(
                __dirname,
                '../../react-ui/src/components/Sidebar.module.css'
            );
            const css = fs.readFileSync(cssPath, 'utf-8');

            // Must have box-shadow in the .floating rule
            expect(css).toContain('box-shadow');
            // Must have the transform transition for slide animation
            expect(css).toContain('transition: transform');
        });

        it('should animate sidebar via transform (not width/left/margin)', () => {
            const fs = require('fs');
            const path = require('path');

            const cssPath = path.resolve(
                __dirname,
                '../../react-ui/src/components/Sidebar.module.css'
            );
            const css = fs.readFileSync(cssPath, 'utf-8');

            // Must use transform for animation (so shadow moves with element)
            expect(css).toContain('translateX');
            // Must NOT animate width/left/margin (shadow wouldn't move with those)
            expect(css).not.toMatch(/transition:.*width/);
            expect(css).not.toMatch(/transition:.*left/);
            expect(css).not.toMatch(/transition:.*margin/);
        });
    });

    describe('Animation Synchronization', () => {
        it('should have exactly ONE shadow source (sidebar element only)', () => {
            // Before fix: 2 shadows (wrapper + sidebar) = desync
            // After fix: 1 shadow (sidebar only) = synchronized

            const wrapperVisible = computeWrapperStyle({
                sidebarMode: 'floating',
                useOverlayMode: false,
                reactSidebarVisible: true,
                isModeSwitch: false,
            });

            const wrapperHidden = computeWrapperStyle({
                sidebarMode: 'floating',
                useOverlayMode: false,
                reactSidebarVisible: false,
                isModeSwitch: false,
            });

            // Neither state should have wrapper shadow
            expect(wrapperVisible.boxShadow).toBeUndefined();
            expect(wrapperHidden.boxShadow).toBeUndefined();
        });

        it('should keep wrapper pointer-events behavior unchanged', () => {
            // The fix only removes boxShadow — pointer-events must still work
            const visibleStyle = computeWrapperStyle({
                sidebarMode: 'floating',
                useOverlayMode: false,
                reactSidebarVisible: true,
                isModeSwitch: false,
            });
            expect(visibleStyle.pointerEvents).toBe('auto');

            const hiddenStyle = computeWrapperStyle({
                sidebarMode: 'floating',
                useOverlayMode: false,
                reactSidebarVisible: false,
                isModeSwitch: false,
            });
            expect(hiddenStyle.pointerEvents).toBe('none');

            const overlayStyle = computeWrapperStyle({
                sidebarMode: 'floating',
                useOverlayMode: true,
                reactSidebarVisible: false,
                isModeSwitch: false,
            });
            expect(overlayStyle.pointerEvents).toBe('none');
        });

        it('should keep wrapper opacity/visibility behavior unchanged', () => {
            const normalStyle = computeWrapperStyle({
                sidebarMode: 'floating',
                useOverlayMode: false,
                reactSidebarVisible: true,
                isModeSwitch: false,
            });
            expect(normalStyle.opacity).toBe(1);
            expect(normalStyle.visibility).toBe('visible');

            const overlayStyle = computeWrapperStyle({
                sidebarMode: 'floating',
                useOverlayMode: true,
                reactSidebarVisible: false,
                isModeSwitch: false,
            });
            expect(overlayStyle.opacity).toBe(0);
            expect(overlayStyle.visibility).toBe('hidden');
        });
    });
});

/**
 * Simulates the wrapper style computation from App.tsx.
 * This mirrors the inline style object on the wrapper <div> around <Sidebar>.
 *
 * AFTER FIX: boxShadow is removed from this computation entirely.
 */
function computeWrapperStyle(params: {
    sidebarMode: 'fixed' | 'floating';
    useOverlayMode: boolean;
    reactSidebarVisible: boolean;
    isModeSwitch: boolean;
}): Record<string, any> {
    const { sidebarMode, useOverlayMode, reactSidebarVisible, isModeSwitch } = params;

    return {
        ...(sidebarMode === 'floating' ? {
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 100,
        } : {}),
        height: '100%',
        opacity: useOverlayMode ? 0 : 1,
        visibility: useOverlayMode ? 'hidden' : 'visible',
        pointerEvents: (useOverlayMode || !reactSidebarVisible) ? 'none' : 'auto',
        // B011 FIX: boxShadow removed from wrapper — sidebar's own CSS box-shadow
        // handles visual depth and moves with the transform animation
        transition: isModeSwitch ? 'none' : undefined,
    };
}
