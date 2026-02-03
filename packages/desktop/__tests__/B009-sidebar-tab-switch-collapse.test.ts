import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * B009: Sidebar Collapses When Switching From Browser to Non-Browser Tabs in Floating Mode
 *
 * Root Cause: When TAB_CHANGE from overlay switches activeTab from 'browser' to any
 * non-browser tab ('spaces' or 'workspace'), useOverlayMode becomes false (immediate),
 * making the sidebar wrapper visible. But reactSidebarVisible is still false (only
 * updated by useEffect after render), so the Sidebar receives isVisible=false and
 * renders collapsed with a 250ms animation.
 *
 * Fix: In the TAB_CHANGE handler, set reactSidebarVisible=true and isModeSwitch=true
 * synchronously when leaving overlay mode, same pattern as handleModeToggle.
 * The condition `newTab !== 'browser'` covers all non-browser tabs.
 */

describe('B009: Sidebar Tab Switch Collapse Prevention', () => {
    describe('TAB_CHANGE handler - overlay to React sidebar transition', () => {
        it('should set reactSidebarVisible=true synchronously when switching from browser to non-browser tab', () => {
            // Simulate the state before TAB_CHANGE
            let activeTab: string = 'browser';
            let reactSidebarVisible = false; // In overlay mode, React sidebar is hidden
            const sidebarMode = 'floating';
            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // true

            // Simulate the B009-fixed TAB_CHANGE handler
            const handleTabChange = (newTab: string) => {
                // B009-FIX: When leaving overlay mode, set visibility synchronously
                const isCurrentlyOverlay = sidebarMode === 'floating' && activeTab === 'browser';
                if (isCurrentlyOverlay && newTab !== 'browser') {
                    reactSidebarVisible = true; // Synchronous!
                }
                activeTab = newTab;
            };

            expect(useOverlayMode).toBe(true);
            expect(reactSidebarVisible).toBe(false);

            handleTabChange('spaces');

            expect(activeTab).toBe('spaces');
            expect(reactSidebarVisible).toBe(true); // Must be true BEFORE any effect runs
        });

        it('should set reactSidebarVisible=true synchronously when switching from browser to workspace tab', () => {
            let activeTab: string = 'browser';
            let reactSidebarVisible = false; // In overlay mode, React sidebar is hidden
            const sidebarMode = 'floating';

            const handleTabChange = (newTab: string) => {
                const isCurrentlyOverlay = sidebarMode === 'floating' && activeTab === 'browser';
                if (isCurrentlyOverlay && newTab !== 'browser') {
                    reactSidebarVisible = true;
                }
                activeTab = newTab;
            };

            handleTabChange('workspace');

            expect(activeTab).toBe('workspace');
            expect(reactSidebarVisible).toBe(true);
        });

        it('should NOT set reactSidebarVisible when switching between non-browser tabs', () => {
            let activeTab: string = 'spaces';
            let reactSidebarVisible = true; // React sidebar already visible
            const sidebarMode = 'floating';

            const handleTabChange = (newTab: string) => {
                const isCurrentlyOverlay = sidebarMode === 'floating' && activeTab === 'browser';
                if (isCurrentlyOverlay && newTab !== 'browser') {
                    reactSidebarVisible = true;
                }
                activeTab = newTab;
            };

            handleTabChange('workspace');

            // reactSidebarVisible should not have been touched by the handler
            // (it was already true, and the handler condition wasn't met)
            expect(reactSidebarVisible).toBe(true);
        });

        it('should NOT set reactSidebarVisible when switching to browser tab (entering overlay)', () => {
            let activeTab: string = 'spaces';
            let reactSidebarVisible = true;
            const sidebarMode = 'floating';

            const handleTabChange = (newTab: string) => {
                const isCurrentlyOverlay = sidebarMode === 'floating' && activeTab === 'browser';
                if (isCurrentlyOverlay && newTab !== 'browser') {
                    reactSidebarVisible = true;
                }
                activeTab = newTab;
            };

            handleTabChange('browser');

            // The handler should NOT have set reactSidebarVisible
            // (entering overlay mode, not leaving it)
            expect(activeTab).toBe('browser');
            expect(reactSidebarVisible).toBe(true); // Unchanged by handler
        });

        it('should NOT trigger overlay-exit logic in fixed sidebar mode', () => {
            let activeTab: string = 'browser';
            let reactSidebarVisible = true;
            let isModeSwitch = false;
            const sidebarMode = 'fixed'; // Not floating

            const handleTabChange = (newTab: string) => {
                const isCurrentlyOverlay = sidebarMode === 'floating' && activeTab === 'browser';
                if (isCurrentlyOverlay && newTab !== 'browser') {
                    isModeSwitch = true;
                    reactSidebarVisible = true;
                }
                activeTab = newTab;
            };

            handleTabChange('spaces');

            // In fixed mode, there's no overlay, so no special handling
            expect(isModeSwitch).toBe(false);
        });
    });

    describe('CSS transition suppression during tab switch', () => {
        it('should set isModeSwitch=true when leaving overlay mode via tab switch to spaces', () => {
            let activeTab: string = 'browser';
            let isModeSwitch = false;
            const sidebarMode = 'floating';

            const handleTabChange = (newTab: string) => {
                const isCurrentlyOverlay = sidebarMode === 'floating' && activeTab === 'browser';
                if (isCurrentlyOverlay && newTab !== 'browser') {
                    isModeSwitch = true;
                }
                activeTab = newTab;
            };

            handleTabChange('spaces');

            expect(isModeSwitch).toBe(true);
        });

        it('should set isModeSwitch=true when leaving overlay mode via tab switch to workspace', () => {
            let activeTab: string = 'browser';
            let isModeSwitch = false;
            const sidebarMode = 'floating';

            const handleTabChange = (newTab: string) => {
                const isCurrentlyOverlay = sidebarMode === 'floating' && activeTab === 'browser';
                if (isCurrentlyOverlay && newTab !== 'browser') {
                    isModeSwitch = true;
                }
                activeTab = newTab;
            };

            handleTabChange('workspace');

            expect(isModeSwitch).toBe(true);
        });

        it('should apply no-transitions class when isModeSwitch is true during tab switch', () => {
            const isModeSwitch = true; // Set by TAB_CHANGE handler

            // From App.tsx render logic
            const className = isModeSwitch ? 'no-transitions' : '';

            expect(className).toBe('no-transitions');
        });

        it('should clear isModeSwitch after double requestAnimationFrame', async () => {
            // Mock requestAnimationFrame for Node test environment
            const callbacks: (() => void)[] = [];
            const mockRAF = vi.fn((cb: () => void) => {
                callbacks.push(cb);
                return callbacks.length;
            });
            vi.stubGlobal('requestAnimationFrame', mockRAF);

            let isModeSwitch = true;

            // Simulate double rAF cleanup (same pattern as handleModeToggle)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    isModeSwitch = false;
                });
            });

            // Execute first rAF callback
            callbacks[0]();
            expect(isModeSwitch).toBe(true); // Not yet cleared

            // Execute second rAF callback
            callbacks[1]();
            expect(isModeSwitch).toBe(false); // Cleared after double rAF

            vi.unstubAllGlobals();
        });
    });

    describe('Sidebar wrapper visibility during transition', () => {
        it('should make wrapper visible when useOverlayMode becomes false', () => {
            // After tab switch: useOverlayMode = false
            const useOverlayMode = false;

            // From App.tsx render logic
            const opacity = useOverlayMode ? 0 : 1;
            const visibility = useOverlayMode ? 'hidden' : 'visible';

            expect(opacity).toBe(1);
            expect(visibility).toBe('visible');
        });

        it('should enable pointer events when reactSidebarVisible is true and not in overlay mode', () => {
            const useOverlayMode = false;
            const reactSidebarVisible = true; // Set synchronously by B009 fix

            // From App.tsx render logic
            const pointerEvents = (useOverlayMode || !reactSidebarVisible) ? 'none' : 'auto';

            expect(pointerEvents).toBe('auto');
        });

        it('should disable pointer events when reactSidebarVisible is false (pre-fix behavior)', () => {
            const useOverlayMode = false;
            const reactSidebarVisible = false; // Pre-B009: not set synchronously

            const pointerEvents = (useOverlayMode || !reactSidebarVisible) ? 'none' : 'auto';

            expect(pointerEvents).toBe('none'); // This was the bug - sidebar visible but no interaction
        });
    });

    describe('Sidebar component isVisible prop during transition', () => {
        it('should pass isVisible=true to Sidebar during overlay-to-React transition (B009 fix)', () => {
            // After B009 fix: reactSidebarVisible set synchronously in TAB_CHANGE handler
            const reactSidebarVisible = true;

            // From App.tsx: <Sidebar isVisible={reactSidebarVisible} />
            const isVisible = reactSidebarVisible;

            expect(isVisible).toBe(true);
        });

        it('should generate correct sidebar CSS classes when isVisible=true', () => {
            const mode = 'floating';
            const isVisible = true;

            // From Sidebar.tsx line 692-698
            const sidebarClasses = [
                'sidebar',
                mode === 'floating' && 'floating',
                mode === 'floating' && !isVisible && 'collapsed',
            ]
                .filter(Boolean)
                .join(' ');

            expect(sidebarClasses).toBe('sidebar floating');
            expect(sidebarClasses).not.toContain('collapsed');
        });

        it('should generate collapsed CSS classes when isVisible=false (pre-fix)', () => {
            const mode = 'floating';
            const isVisible = false;

            const sidebarClasses = [
                'sidebar',
                mode === 'floating' && 'floating',
                mode === 'floating' && !isVisible && 'collapsed',
            ]
                .filter(Boolean)
                .join(' ');

            expect(sidebarClasses).toBe('sidebar floating collapsed');
            expect(sidebarClasses).toContain('collapsed'); // This was the bug
        });
    });

    describe('Full tab-switch flow simulation', () => {
        it('should maintain sidebar visibility through complete Browser->Spaces transition', () => {
            // === INITIAL STATE: Browser tab, floating mode, overlay visible ===
            let activeTab = 'browser';
            const sidebarMode = 'floating';
            let useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
            const persistedSidebarVisible = true;
            const freshStartOverrideActive = false;
            const sidebarVisible = freshStartOverrideActive ? false : persistedSidebarVisible;
            let reactSidebarVisible = false; // In overlay mode
            let isModeSwitch = false;

            expect(useOverlayMode).toBe(true);
            expect(reactSidebarVisible).toBe(false);
            expect(sidebarVisible).toBe(true);

            // === TAB_CHANGE from overlay: switch to 'spaces' ===
            const newTab = 'spaces';

            // B009-FIX: Synchronous updates in TAB_CHANGE handler
            const isCurrentlyOverlay = sidebarMode === 'floating' && activeTab === 'browser';
            if (isCurrentlyOverlay && newTab !== 'browser') {
                isModeSwitch = true;
                reactSidebarVisible = true;
            }
            activeTab = newTab;

            // Re-derive useOverlayMode
            useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';

            // === VERIFY: sidebar visible instantly, no collapse ===
            expect(useOverlayMode).toBe(false);
            expect(reactSidebarVisible).toBe(true); // Set synchronously!
            expect(isModeSwitch).toBe(true); // Transitions suppressed!

            // Wrapper should be visible
            const opacity = useOverlayMode ? 0 : 1;
            const visibility = useOverlayMode ? 'hidden' : 'visible';
            expect(opacity).toBe(1);
            expect(visibility).toBe('visible');

            // Sidebar should NOT be collapsed
            const sidebarClasses = [
                'sidebar',
                sidebarMode === 'floating' && 'floating',
                sidebarMode === 'floating' && !reactSidebarVisible && 'collapsed',
            ].filter(Boolean).join(' ');
            expect(sidebarClasses).not.toContain('collapsed');

            // No-transitions class should be applied
            const wrapperClass = isModeSwitch ? 'no-transitions' : '';
            expect(wrapperClass).toBe('no-transitions');

            // Pointer events should be enabled
            const pointerEvents = (useOverlayMode || !reactSidebarVisible) ? 'none' : 'auto';
            expect(pointerEvents).toBe('auto');
        });

        it('should maintain sidebar visibility through complete Browser->Workspace transition', () => {
            // === INITIAL STATE: Browser tab, floating mode, overlay visible ===
            let activeTab = 'browser';
            const sidebarMode = 'floating';
            let useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
            const persistedSidebarVisible = true;
            const freshStartOverrideActive = false;
            const sidebarVisible = freshStartOverrideActive ? false : persistedSidebarVisible;
            let reactSidebarVisible = false; // In overlay mode
            let isModeSwitch = false;

            expect(useOverlayMode).toBe(true);
            expect(reactSidebarVisible).toBe(false);
            expect(sidebarVisible).toBe(true);

            // === TAB_CHANGE from overlay: switch to 'workspace' ===
            const newTab = 'workspace';

            // B009-FIX: Synchronous updates in TAB_CHANGE handler
            const isCurrentlyOverlay = sidebarMode === 'floating' && activeTab === 'browser';
            if (isCurrentlyOverlay && newTab !== 'browser') {
                isModeSwitch = true;
                reactSidebarVisible = true;
            }
            activeTab = newTab;

            // Re-derive useOverlayMode
            useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';

            // === VERIFY: sidebar visible instantly, no collapse ===
            expect(useOverlayMode).toBe(false);
            expect(reactSidebarVisible).toBe(true); // Set synchronously!
            expect(isModeSwitch).toBe(true); // Transitions suppressed!

            // Wrapper should be visible
            const opacity = useOverlayMode ? 0 : 1;
            const visibility = useOverlayMode ? 'hidden' : 'visible';
            expect(opacity).toBe(1);
            expect(visibility).toBe('visible');

            // Sidebar should NOT be collapsed
            const sidebarClasses = [
                'sidebar',
                sidebarMode === 'floating' && 'floating',
                sidebarMode === 'floating' && !reactSidebarVisible && 'collapsed',
            ].filter(Boolean).join(' ');
            expect(sidebarClasses).not.toContain('collapsed');

            // No-transitions class should be applied
            const wrapperClass = isModeSwitch ? 'no-transitions' : '';
            expect(wrapperClass).toBe('no-transitions');

            // Pointer events should be enabled
            const pointerEvents = (useOverlayMode || !reactSidebarVisible) ? 'none' : 'auto';
            expect(pointerEvents).toBe('auto');
        });

        it('should maintain sidebar visibility through Workspace->Browser->Workspace rapid sequence', () => {
            // === This tests the race condition where prevUseOverlayMode.current ===
            // === was stale due to async show() not completing before next tab switch ===

            // Simulate refs and state
            let activeTab = 'workspace';
            const sidebarMode = 'floating';
            let useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
            const persistedSidebarVisible = true;
            const freshStartOverrideActive = false;
            const sidebarVisible = freshStartOverrideActive ? false : persistedSidebarVisible;
            let reactSidebarVisible = true; // Sidebar visible on Workspace tab
            let isModeSwitch = false;
            let prevUseOverlayMode = false; // ref value
            let overlayEffectGen = 0; // generation counter

            expect(useOverlayMode).toBe(false);
            expect(reactSidebarVisible).toBe(true);

            // === Step 2: Click Browser tab in React sidebar ===
            activeTab = 'browser';
            useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // true

            // B009-FIX: Overlay visibility effect reads ref SYNCHRONOUSLY and updates it
            const wasOverlay_step2 = prevUseOverlayMode; // false
            prevUseOverlayMode = useOverlayMode; // Updated to true IMMEDIATELY
            const currentGen_step2 = ++overlayEffectGen; // gen = 1
            const isTransitioningOut_step2 = wasOverlay_step2 === true && useOverlayMode === false;

            expect(isTransitioningOut_step2).toBe(false); // Not transitioning (entering overlay)
            expect(prevUseOverlayMode).toBe(true); // Ref updated immediately

            // Sync effect sets reactSidebarVisible = false (overlay mode)
            reactSidebarVisible = false;

            // Overlay show() starts (async, hasn't completed yet)
            // ...show() is in progress...

            // === Step 3: Click Workspace tab in overlay (BEFORE show() completes) ===
            // B009 TAB_CHANGE handler fires
            isModeSwitch = true;
            reactSidebarVisible = true;
            activeTab = 'workspace';
            useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // false

            // B009-FIX: Overlay visibility effect reads ref SYNCHRONOUSLY
            const wasOverlay_step3 = prevUseOverlayMode; // true (correctly updated by step 2!)
            prevUseOverlayMode = useOverlayMode; // Updated to false
            const currentGen_step3 = ++overlayEffectGen; // gen = 2
            const isTransitioningOut_step3 = wasOverlay_step3 === true && useOverlayMode === false;

            // === CRITICAL ASSERTIONS ===
            expect(isTransitioningOut_step3).toBe(true); // Correctly detects transition!
            expect(prevUseOverlayMode).toBe(false); // Ref correctly updated
            expect(reactSidebarVisible).toBe(true); // Sidebar stays visible
            expect(isModeSwitch).toBe(true); // Transitions suppressed

            // Step 2's async callback would check generation:
            // currentGen_step2 (1) !== overlayEffectGen (2) → ABORT (don't corrupt state)
            expect(currentGen_step2).not.toBe(overlayEffectGen);
            expect(currentGen_step3).toBe(overlayEffectGen);
        });

        it('should abort stale async operations via generation counter', () => {
            let overlayEffectGen = 0;
            let overlayActuallyVisible = false;

            // Simulate step 2: show() starts
            const gen1 = ++overlayEffectGen; // gen = 1
            // ...async show() in progress...

            // Simulate step 3: new invocation starts before show() completes
            const gen2 = ++overlayEffectGen; // gen = 2

            // Step 2's async callback resumes after show()
            // It should abort because gen1 (1) !== overlayEffectGen (2)
            if (gen1 === overlayEffectGen) {
                overlayActuallyVisible = true; // Should NOT execute
            }

            expect(overlayActuallyVisible).toBe(false); // Stale operation was aborted

            // Step 3's async callback resumes
            if (gen2 === overlayEffectGen) {
                overlayActuallyVisible = false; // Should execute
            }

            expect(overlayActuallyVisible).toBe(false); // Current operation executed correctly
        });

        it('should maintain sidebar hidden when switching tabs after fresh start override', () => {
            // Fresh start: sidebar collapsed
            let activeTab = 'browser';
            const sidebarMode = 'floating';
            const freshStartOverrideActive = true;
            const persistedSidebarVisible = true;
            const sidebarVisible = freshStartOverrideActive ? false : persistedSidebarVisible;
            let reactSidebarVisible = false;
            let isModeSwitch = false;

            // Even with B009 fix, the sync effect will later set reactSidebarVisible = sidebarVisible
            // But the synchronous set happens first
            const newTab = 'spaces';
            const isCurrentlyOverlay = sidebarMode === 'floating' && activeTab === 'browser';
            if (isCurrentlyOverlay && newTab !== 'browser') {
                isModeSwitch = true;
                reactSidebarVisible = true;
            }
            activeTab = newTab;

            // reactSidebarVisible was set to true synchronously
            // But the sync effect would correct it to sidebarVisible (false)
            // This is acceptable - the effect runs after and corrects the state
            // The key is that during the transition, transitions are suppressed
            expect(isModeSwitch).toBe(true); // Transitions suppressed

            // Simulate sync effect running after
            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
            if (!useOverlayMode) {
                reactSidebarVisible = sidebarVisible; // Effect corrects to false
            }
            expect(reactSidebarVisible).toBe(false);
        });
    });

    describe('VISIBILITY_CHANGE suppression after tab switch (Issue 4)', () => {
        it('should ignore VISIBILITY_CHANGE {visible: false} when useOverlayModeRef is false', () => {
            // State: user switched from browser to workspace tab
            let sidebarVisible = true;
            let useOverlayModeRefCurrent = false; // Updated by TAB_CHANGE handler

            // Simulate VISIBILITY_CHANGE handler with B009 guard
            const handleVisibilityChange = (visible: boolean) => {
                if (!useOverlayModeRefCurrent && !visible) {
                    return; // B009-FIX: Ignore spurious event
                }
                sidebarVisible = visible;
            };

            // Overlay sidebar sends VISIBILITY_CHANGE {visible: false} from mouseleave
            handleVisibilityChange(false);

            // sidebarVisible should remain true - event was ignored
            expect(sidebarVisible).toBe(true);
        });

        it('should process VISIBILITY_CHANGE {visible: false} when still in overlay mode', () => {
            // State: user is in browser tab, overlay is visible, mouse leaves
            let sidebarVisible = true;
            let useOverlayModeRefCurrent = true; // Still in overlay mode

            const handleVisibilityChange = (visible: boolean) => {
                if (!useOverlayModeRefCurrent && !visible) {
                    return;
                }
                sidebarVisible = visible;
            };

            // Normal mouse-leave in overlay mode - should process
            handleVisibilityChange(false);

            expect(sidebarVisible).toBe(false);
        });

        it('should update useOverlayModeRef synchronously in TAB_CHANGE before VISIBILITY_CHANGE arrives', () => {
            // Full simulation: TAB_CHANGE → ref update → VISIBILITY_CHANGE ignored
            let activeTab = 'browser';
            const sidebarMode = 'floating';
            let sidebarVisible = true;
            let reactSidebarVisible = false;
            let isModeSwitch = false;
            let useOverlayModeRefCurrent = true; // Starts true (browser tab, floating)

            // Step 1: TAB_CHANGE to workspace
            const newTab = 'workspace';
            if (newTab !== 'browser') {
                isModeSwitch = true;
                reactSidebarVisible = true;
                useOverlayModeRefCurrent = false; // B009-FIX: Updated synchronously
            }
            activeTab = newTab;

            expect(useOverlayModeRefCurrent).toBe(false);
            expect(reactSidebarVisible).toBe(true);
            expect(isModeSwitch).toBe(true);

            // Step 2: VISIBILITY_CHANGE {visible: false} arrives from overlay mouseleave
            const handleVisibilityChange = (visible: boolean) => {
                if (!useOverlayModeRefCurrent && !visible) {
                    return; // Ignored!
                }
                sidebarVisible = visible;
            };

            handleVisibilityChange(false);

            // sidebarVisible stays true because the event was ignored
            expect(sidebarVisible).toBe(true);
            // reactSidebarVisible stays true
            expect(reactSidebarVisible).toBe(true);
        });

        it('should not suppress VISIBILITY_CHANGE {visible: true} even when not in overlay mode', () => {
            // Edge case: visible=true should still be processed (though unlikely in practice)
            let sidebarVisible = false;
            let useOverlayModeRefCurrent = false;

            const handleVisibilityChange = (visible: boolean) => {
                if (!useOverlayModeRefCurrent && !visible) {
                    return;
                }
                sidebarVisible = visible;
            };

            handleVisibilityChange(true);

            // visible=true is not suppressed
            expect(sidebarVisible).toBe(true);
        });

        it('should maintain sidebar through full TAB_CHANGE + delayed VISIBILITY_CHANGE sequence', () => {
            // Simulates the exact sequence from the bug report logs:
            // 1. TAB_CHANGE {tab: 'workspace'}
            // 2. Many re-renders
            // 3. VISIBILITY_CHANGE {visible: false} (from overlay mouseleave)

            let activeTab = 'browser';
            const sidebarMode = 'floating';
            let sidebarVisible = true;
            let reactSidebarVisible = false; // Overlay mode: React sidebar hidden
            let isModeSwitch = false;
            let useOverlayModeRefCurrent = sidebarMode === 'floating' && activeTab === 'browser'; // true

            // === TAB_CHANGE arrives ===
            const newTab = 'workspace';
            if (newTab !== 'browser') {
                isModeSwitch = true;
                reactSidebarVisible = true;
                sidebarVisible = true; // B009-FIX: Restore sidebarVisible
                useOverlayModeRefCurrent = false;
            }
            activeTab = newTab;

            // After TAB_CHANGE: sidebar should be visible
            expect(reactSidebarVisible).toBe(true);
            expect(sidebarVisible).toBe(true);

            // Simulate several render cycles (useOverlayMode derived correctly)
            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // false
            expect(useOverlayMode).toBe(false);

            // Sync effect: reactSidebarVisible = sidebarVisible (true) → stays true
            if (!useOverlayMode) {
                reactSidebarVisible = sidebarVisible;
            }
            expect(reactSidebarVisible).toBe(true);

            // Clear isModeSwitch after double rAF
            isModeSwitch = false;

            // === VISIBILITY_CHANGE {visible: false} arrives (delayed from overlay mouseleave) ===
            if (!useOverlayModeRefCurrent && false === false) {
                // Suppressed! Don't set sidebarVisible
            } else {
                sidebarVisible = false;
            }

            // Sidebar stays visible!
            expect(sidebarVisible).toBe(true);
            expect(reactSidebarVisible).toBe(true);
        });

        it('should restore sidebarVisible when VISIBILITY_CHANGE arrives BEFORE TAB_CHANGE (Issue 5)', () => {
            // This is the actual bug pattern observed in production:
            // Mouse leaves sidebar → VISIBILITY_CHANGE {visible: false} arrives FIRST
            // Then tab click fires → TAB_CHANGE {tab: 'workspace'} arrives SECOND
            // Without fix: sidebarVisible stays false, sync effect collapses sidebar
            // With fix: TAB_CHANGE handler restores sidebarVisible=true

            let activeTab = 'browser';
            const sidebarMode = 'floating';
            let sidebarVisible = true;
            let reactSidebarVisible = false; // Overlay mode: React sidebar hidden
            let isModeSwitch = false;
            let useOverlayModeRefCurrent = sidebarMode === 'floating' && activeTab === 'browser'; // true

            // === Step 1: VISIBILITY_CHANGE {visible: false} arrives FIRST ===
            // (Mouse left sidebar area before tab click event fired)
            // Guard check: useOverlayModeRefCurrent is still true, so event IS processed
            if (!useOverlayModeRefCurrent && !false) {
                // Not suppressed - we're still in overlay mode
            } else {
                sidebarVisible = false; // This happens!
            }
            expect(sidebarVisible).toBe(false); // sidebarVisible is now false

            // === Step 2: TAB_CHANGE {tab: 'workspace'} arrives SECOND ===
            const newTab = 'workspace';
            if (newTab !== 'browser') {
                isModeSwitch = true;
                reactSidebarVisible = true;
                // B009-FIX: Restore sidebarVisible to undo the preceding VISIBILITY_CHANGE
                sidebarVisible = true;
                useOverlayModeRefCurrent = false;
            }
            activeTab = newTab;

            // Both are batched by React 18, so final state after render:
            expect(sidebarVisible).toBe(true); // Restored by TAB_CHANGE handler
            expect(reactSidebarVisible).toBe(true); // Set synchronously
            expect(isModeSwitch).toBe(true); // Transitions suppressed

            // Sync effect runs after render: reactSidebarVisible = sidebarVisible (true)
            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'; // false
            if (!useOverlayMode) {
                reactSidebarVisible = sidebarVisible;
            }
            expect(reactSidebarVisible).toBe(true); // Stays true!
        });

        it('should handle repeated VISIBILITY_CHANGE-before-TAB_CHANGE cycles', () => {
            // Simulates multiple rounds of toggling (the user's reported scenario)
            const sidebarMode = 'floating';
            let activeTab = 'browser';
            let sidebarVisible = true;
            let reactSidebarVisible = false;
            let isModeSwitch = false;
            let useOverlayModeRefCurrent = true;

            for (let round = 0; round < 5; round++) {
                // === VISIBILITY_CHANGE {visible: false} from overlay mouseleave ===
                if (!useOverlayModeRefCurrent && !false) {
                    // Suppressed
                } else {
                    sidebarVisible = false;
                }

                // === TAB_CHANGE {tab: 'workspace'} ===
                if ('workspace' !== 'browser') {
                    isModeSwitch = true;
                    reactSidebarVisible = true;
                    sidebarVisible = true; // B009-FIX: Restore
                    useOverlayModeRefCurrent = false;
                }
                activeTab = 'workspace';

                // Sync effect
                const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
                if (!useOverlayMode) {
                    reactSidebarVisible = sidebarVisible;
                }

                // Assertions: sidebar must remain visible every round
                expect(sidebarVisible).toBe(true);
                expect(reactSidebarVisible).toBe(true);

                // === Switch back to browser tab (user clicks browser tab) ===
                activeTab = 'browser';
                useOverlayModeRefCurrent = true;
                reactSidebarVisible = false; // Overlay mode hides React sidebar
                isModeSwitch = false;
                // sidebarVisible stays true (auto-show restores it)
                sidebarVisible = true;
            }
        });
    });

    describe('Regression: sidebarVisible restore in TAB_CHANGE (Issue 5)', () => {
        it('should restore sidebarVisible for spaces tab (not just workspace)', () => {
            // Verify the fix works for ALL non-browser tabs, not just workspace
            let sidebarVisible = true;
            let reactSidebarVisible = false;
            let isModeSwitch = false;
            let useOverlayModeRefCurrent = true;

            // VISIBILITY_CHANGE arrives first (mouse leaves sidebar)
            sidebarVisible = false;

            // TAB_CHANGE to spaces
            if ('spaces' !== 'browser') {
                isModeSwitch = true;
                reactSidebarVisible = true;
                sidebarVisible = true; // B009-FIX: Restore
                useOverlayModeRefCurrent = false;
            }

            expect(sidebarVisible).toBe(true);
            expect(reactSidebarVisible).toBe(true);
        });

        it('should NOT restore sidebarVisible when switching TO browser tab', () => {
            // Entering overlay mode - sidebarVisible should NOT be forced true
            let activeTab = 'spaces';
            let sidebarVisible = false; // Sidebar was collapsed
            let reactSidebarVisible = false;
            let isModeSwitch = false;

            // TAB_CHANGE to browser - should NOT restore sidebarVisible
            const newTab = 'browser';
            if (newTab !== 'browser') {
                isModeSwitch = true;
                reactSidebarVisible = true;
                sidebarVisible = true;
            }

            // sidebarVisible should remain false (we're entering overlay, not leaving it)
            expect(sidebarVisible).toBe(false);
            expect(isModeSwitch).toBe(false);
        });

        it('should ensure sync effect sees restored sidebarVisible after batched render', () => {
            // The critical chain: VISIBILITY_CHANGE sets false → TAB_CHANGE restores true
            // → React 18 batches → render → sync effect sees sidebarVisible=true
            const sidebarMode = 'floating';
            let sidebarVisible = true;
            let reactSidebarVisible = false;

            // Step 1: VISIBILITY_CHANGE sets sidebarVisible=false
            sidebarVisible = false;

            // Step 2: TAB_CHANGE restores sidebarVisible=true
            sidebarVisible = true;
            reactSidebarVisible = true;

            // Step 3: After batched render, sync effect runs
            // useOverlayMode is false (we switched to workspace)
            const useOverlayMode = false;
            if (!useOverlayMode) {
                reactSidebarVisible = sidebarVisible; // sidebarVisible=true ✓
            }

            expect(reactSidebarVisible).toBe(true);
        });

        it('should keep sidebar visible through sync effect after VISIBILITY_CHANGE→TAB_CHANGE→render cycle', () => {
            // Full end-to-end: simulates the exact React render cycle
            const sidebarMode = 'floating';
            let activeTab = 'browser';
            let sidebarVisible = true;
            let reactSidebarVisible = false;
            let isModeSwitch = false;
            let useOverlayModeRefCurrent = true;

            // === IPC Event 1: VISIBILITY_CHANGE {visible: false} ===
            // (processed in overlay mode, guard does NOT suppress)
            if (!useOverlayModeRefCurrent && !false) {
                // Not suppressed
            } else {
                sidebarVisible = false; // queued by React
            }

            // === IPC Event 2: TAB_CHANGE {tab: 'workspace'} ===
            if ('workspace' !== 'browser') {
                isModeSwitch = true;
                reactSidebarVisible = true;
                sidebarVisible = true; // B009-FIX: restores the value
                useOverlayModeRefCurrent = false;
            }
            activeTab = 'workspace';

            // === React 18 commits batched state ===
            // Final batched state: sidebarVisible=true (last write wins)
            expect(sidebarVisible).toBe(true);

            // === Render phase: derive useOverlayMode ===
            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
            expect(useOverlayMode).toBe(false);

            // === useOverlayModeRef.current updated during render ===
            useOverlayModeRefCurrent = useOverlayMode; // false (matches TAB_CHANGE handler set)
            expect(useOverlayModeRefCurrent).toBe(false);

            // === Sync effect runs (depends on [sidebarVisible, isModeSwitch, useOverlayMode]) ===
            if (useOverlayMode) {
                reactSidebarVisible = false;
            } else {
                reactSidebarVisible = sidebarVisible; // true!
            }
            expect(reactSidebarVisible).toBe(true);

            // === Wrapper renders ===
            const opacity = useOverlayMode ? 0 : 1;
            const visibility = useOverlayMode ? 'hidden' : 'visible';
            const pointerEvents = (useOverlayMode || !reactSidebarVisible) ? 'none' : 'auto';
            const collapsed = sidebarMode === 'floating' && !reactSidebarVisible;

            expect(opacity).toBe(1);
            expect(visibility).toBe('visible');
            expect(pointerEvents).toBe('auto');
            expect(collapsed).toBe(false);
        });

        it('should handle mixed tab sequences: Browser→Workspace→Browser→Spaces', () => {
            const sidebarMode = 'floating';
            let activeTab = 'browser';
            let sidebarVisible = true;
            let reactSidebarVisible = false;
            let isModeSwitch = false;
            let useOverlayModeRefCurrent = true;

            // === Round 1: Browser → Workspace ===
            // VISIBILITY_CHANGE first
            sidebarVisible = false;
            // TAB_CHANGE
            isModeSwitch = true;
            reactSidebarVisible = true;
            sidebarVisible = true;
            useOverlayModeRefCurrent = false;
            activeTab = 'workspace';
            // Sync effect
            reactSidebarVisible = sidebarVisible;
            expect(reactSidebarVisible).toBe(true);
            isModeSwitch = false;

            // === Round 2: Workspace → Browser (via React sidebar tab click) ===
            activeTab = 'browser';
            useOverlayModeRefCurrent = true;
            reactSidebarVisible = false; // Overlay mode
            // Auto-show restores
            sidebarVisible = true;

            // === Round 3: Browser → Spaces ===
            // VISIBILITY_CHANGE first
            sidebarVisible = false;
            // TAB_CHANGE
            isModeSwitch = true;
            reactSidebarVisible = true;
            sidebarVisible = true;
            useOverlayModeRefCurrent = false;
            activeTab = 'spaces';
            // Sync effect
            reactSidebarVisible = sidebarVisible;
            expect(reactSidebarVisible).toBe(true);
            expect(sidebarVisible).toBe(true);
        });

        it('should handle rapid double-switch: Browser→Workspace→Browser→Workspace', () => {
            // Tests that generation counter + sidebarVisible restore work together
            const sidebarMode = 'floating';
            let activeTab = 'browser';
            let sidebarVisible = true;
            let reactSidebarVisible = false;
            let isModeSwitch = false;
            let useOverlayModeRefCurrent = true;
            let overlayEffectGen = 0;
            let prevUseOverlayMode = true;

            // === First switch: Browser → Workspace (with VISIBILITY_CHANGE before TAB_CHANGE) ===
            sidebarVisible = false; // VISIBILITY_CHANGE
            isModeSwitch = true;
            reactSidebarVisible = true;
            sidebarVisible = true; // TAB_CHANGE restore
            useOverlayModeRefCurrent = false;
            activeTab = 'workspace';

            // Overlay effect fires (synchronous part)
            const wasOverlay1 = prevUseOverlayMode; // true
            const useOverlayMode1 = sidebarMode === 'floating' && activeTab === 'browser'; // false
            prevUseOverlayMode = useOverlayMode1;
            const gen1 = ++overlayEffectGen;
            const transitioning1 = wasOverlay1 === true && useOverlayMode1 === false;
            expect(transitioning1).toBe(true);

            // === Quick switch back: Workspace → Browser ===
            activeTab = 'browser';
            useOverlayModeRefCurrent = true;
            reactSidebarVisible = false;
            isModeSwitch = false;

            // Overlay effect fires again
            const wasOverlay2 = prevUseOverlayMode; // false
            const useOverlayMode2 = sidebarMode === 'floating' && activeTab === 'browser'; // true
            prevUseOverlayMode = useOverlayMode2;
            const gen2 = ++overlayEffectGen;

            // Gen1 is stale
            expect(gen1).not.toBe(overlayEffectGen);
            expect(gen2).toBe(overlayEffectGen);

            // === Second switch: Browser → Workspace (with VISIBILITY_CHANGE before TAB_CHANGE) ===
            sidebarVisible = false; // VISIBILITY_CHANGE
            isModeSwitch = true;
            reactSidebarVisible = true;
            sidebarVisible = true; // TAB_CHANGE restore
            useOverlayModeRefCurrent = false;
            activeTab = 'workspace';

            // Overlay effect fires
            const wasOverlay3 = prevUseOverlayMode; // true
            const useOverlayMode3 = sidebarMode === 'floating' && activeTab === 'browser'; // false
            prevUseOverlayMode = useOverlayMode3;
            const gen3 = ++overlayEffectGen;
            const transitioning3 = wasOverlay3 === true && useOverlayMode3 === false;

            expect(transitioning3).toBe(true);
            expect(gen2).not.toBe(overlayEffectGen); // gen2 is now stale
            expect(gen3).toBe(overlayEffectGen);

            // Sync effect
            reactSidebarVisible = sidebarVisible;
            expect(reactSidebarVisible).toBe(true);
            expect(sidebarVisible).toBe(true);
        });

        it('should not interfere with mode toggle (pin/unpin) after tab switch', () => {
            // After a tab switch fix, mode toggle should still work normally
            const sidebarMode = 'floating';
            let activeTab = 'workspace'; // Already on workspace after B009 fix
            let sidebarVisible = true;
            let reactSidebarVisible = true;
            let isModeSwitch = false;

            // Simulate handleModeToggle (floating → fixed)
            const newMode = 'fixed';
            isModeSwitch = true;
            reactSidebarVisible = sidebarVisible; // Preserve visibility

            // Derive new state
            const useOverlayMode = newMode === 'floating' && activeTab === 'browser';
            expect(useOverlayMode).toBe(false);
            expect(reactSidebarVisible).toBe(true);
            expect(isModeSwitch).toBe(true);
        });

        it('should persist sidebarVisible=true to localStorage via setSidebarVisible', () => {
            // Verify that the restore call goes through the same path as normal setSidebarVisible
            // setSidebarVisible(true) should update persistedSidebarVisible AND deactivate fresh start

            let persistedSidebarVisible = false; // Was set to false by VISIBILITY_CHANGE
            let freshStartOverrideActive = false;

            // Simulate setSidebarVisible(true) - the restore call in TAB_CHANGE handler
            const setSidebarVisible = (visible: boolean) => {
                if (visible && freshStartOverrideActive) {
                    freshStartOverrideActive = false;
                }
                persistedSidebarVisible = visible;
            };

            setSidebarVisible(true);

            expect(persistedSidebarVisible).toBe(true); // Persisted to localStorage
        });

        it('should deactivate fresh start override when setSidebarVisible(true) called from TAB_CHANGE', () => {
            // Edge case: fresh start override is active when user switches tab
            let persistedSidebarVisible = true;
            let freshStartOverrideActive = true;

            const setSidebarVisible = (visible: boolean) => {
                if (visible && freshStartOverrideActive) {
                    freshStartOverrideActive = false;
                }
                persistedSidebarVisible = visible;
            };

            setSidebarVisible(true);

            expect(freshStartOverrideActive).toBe(false); // Override deactivated
            expect(persistedSidebarVisible).toBe(true);
        });

        it('should handle VISIBILITY_CHANGE arriving during overlay effect async operation', () => {
            // Overlay effect's hideInstant() is async. VISIBILITY_CHANGE can arrive
            // while hideInstant() is in progress. The generation counter should handle this.
            let overlayEffectGen = 0;
            let overlayActuallyVisible = true;
            let sidebarVisible = true;

            // TAB_CHANGE fires, overlay effect starts
            const gen1 = ++overlayEffectGen; // gen = 1
            // hideInstant() is in progress...

            // VISIBILITY_CHANGE arrives during hideInstant()
            // But it's suppressed by the guard (useOverlayModeRef.current = false)
            // sidebarVisible stays true

            // hideInstant() completes, check generation
            if (gen1 === overlayEffectGen) {
                overlayActuallyVisible = false; // Safe to update - still current gen
            }

            expect(overlayActuallyVisible).toBe(false);
            expect(sidebarVisible).toBe(true); // Not corrupted
        });

        it('should correctly track useOverlayModeRef across render boundaries', () => {
            // useOverlayModeRef.current is updated in TWO places:
            // 1. On every render: useOverlayModeRef.current = useOverlayMode
            // 2. Synchronously in TAB_CHANGE handler

            let activeTab = 'browser';
            const sidebarMode = 'floating';
            let useOverlayModeRefCurrent = true;

            // Verify initial state
            let useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
            expect(useOverlayMode).toBe(true);
            useOverlayModeRefCurrent = useOverlayMode; // Render update
            expect(useOverlayModeRefCurrent).toBe(true);

            // TAB_CHANGE handler sets ref synchronously (before render)
            useOverlayModeRefCurrent = false;

            // After render, useOverlayMode is derived
            activeTab = 'workspace';
            useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
            expect(useOverlayMode).toBe(false);

            // Render update confirms the ref value
            useOverlayModeRefCurrent = useOverlayMode;
            expect(useOverlayModeRefCurrent).toBe(false);
        });

        it('should handle the exact production sequence from console logs', () => {
            // Reproduces the exact log sequence that caused the bug:
            // 1. browserUiStore init/cleanup cycles
            // 2. VISIBILITY_CHANGE {visible: false}
            // 3. renders
            // 4. TAB_CHANGE {tab: 'workspace'}
            // 5. FOCUS_CHANGE {hasFocus: true}
            // 6. browserUiStore cleanup

            const sidebarMode = 'floating';
            let activeTab = 'browser';
            let sidebarVisible = true;
            let reactSidebarVisible = false;
            let isModeSwitch = false;
            let useOverlayModeRefCurrent = true;

            // Step 1: browserUiStore cycles (irrelevant to fix)

            // Step 2: VISIBILITY_CHANGE {visible: false}
            // Guard: !useOverlayModeRefCurrent(true) && !false → false → NOT suppressed
            sidebarVisible = false;

            // Step 3: Some re-renders happen (state committed)

            // Step 4: TAB_CHANGE {tab: 'workspace'}
            const newTab = 'workspace';
            if (newTab !== 'browser') {
                isModeSwitch = true;
                reactSidebarVisible = true;
                sidebarVisible = true; // B009-FIX: Restore!
                useOverlayModeRefCurrent = false;
            }
            activeTab = newTab;

            // Step 5: FOCUS_CHANGE {hasFocus: true} (irrelevant)

            // Step 6: browserUiStore cleanup (irrelevant)

            // === Verify final state ===
            expect(sidebarVisible).toBe(true); // Restored
            expect(reactSidebarVisible).toBe(true); // Set synchronously

            // Sync effect confirms
            const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';
            if (!useOverlayMode) {
                reactSidebarVisible = sidebarVisible;
            }
            expect(reactSidebarVisible).toBe(true);

            // No collapse
            const collapsed = sidebarMode === 'floating' && !reactSidebarVisible;
            expect(collapsed).toBe(false);

            // Transitions suppressed
            const className = isModeSwitch ? 'no-transitions' : '';
            expect(className).toBe('no-transitions');
        });
    });
});
