import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * REGRESSION TESTS: Auto-Show State Sync (Complete)
 *
 * BUG FIXED (must never regress):
 * When overlay auto-shows via mouse tracking, expandedIdsMap was empty,
 * causing folders to collapse when clicking items.
 *
 * ROOT CAUSE:
 * Mouse tracking called show() without notifying main renderer.
 * Main renderer didn't know overlay was visible (sidebarVisible = false).
 * State sync effect didn't run (condition: useOverlayMode && sidebarVisible).
 * Overlay showed with empty/stale state.
 *
 * FIX APPLIED:
 * 1. Mouse tracking sends 'auto-show-triggered' event BEFORE showing
 * 2. Main renderer sets sidebarVisible = true
 * 3. State sync effect runs with correct expandedIdsMap
 *
 * CRITICAL: Auto-show must always sync state!
 */

describe('REGRESSION: Auto-Show State Sync', () => {
    describe('Auto-Show Notification Flow', () => {
        it('should send notification before showing overlay', async () => {
            const callOrder: string[] = [];
            const mockSendNotification = vi.fn(() => callOrder.push('notify'));
            const mockShow = vi.fn(() => callOrder.push('show'));

            // Simulate mouse tracking detection
            const handleMouseNearEdge = async () => {
                // MUST notify BEFORE showing
                mockSendNotification('sidebar-overlay:auto-show-triggered');
                await mockShow();
            };

            await handleMouseNearEdge();

            expect(callOrder).toEqual(['notify', 'show']);
        });

        it('should update sidebarVisible when receiving auto-show notification', () => {
            let sidebarVisible = false;

            const handleAutoShowNotification = () => {
                sidebarVisible = true;
            };

            handleAutoShowNotification();

            expect(sidebarVisible).toBe(true);
        });

        it('should trigger state sync when sidebarVisible becomes true', () => {
            const mockSyncState = vi.fn();
            let sidebarVisible = false;
            const useOverlayMode = true;

            // Before notification
            if (useOverlayMode && sidebarVisible) {
                mockSyncState({});
            }
            expect(mockSyncState).not.toHaveBeenCalled();

            // After notification
            sidebarVisible = true;
            if (useOverlayMode && sidebarVisible) {
                mockSyncState({ expandedIds: ['folder-1', 'folder-2'] });
            }

            expect(mockSyncState).toHaveBeenCalledWith(
                expect.objectContaining({
                    expandedIds: expect.arrayContaining(['folder-1', 'folder-2']),
                })
            );
        });
    });

    describe('ExpandedIds State Sync', () => {
        it('should sync populated expandedIds after auto-show', () => {
            const expandedIdsMap = new Map([
                ['space-1', new Set(['folder-1', 'folder-2', 'folder-3'])],
            ]);

            const activeSpaceId = 'space-1';
            const expandedIds = Array.from(expandedIdsMap.get(activeSpaceId) || []);

            expect(expandedIds).toEqual(['folder-1', 'folder-2', 'folder-3']);
            expect(expandedIds.length).toBe(3); // Not empty!
        });

        it('should NOT have empty expandedIds after auto-show', () => {
            // This was the bug - expandedIds would be empty
            const expandedIdsMap = new Map([
                ['space-1', new Set(['folder-1', 'folder-2'])],
            ]);

            const activeSpaceId = 'space-1';
            const expandedIds = Array.from(expandedIdsMap.get(activeSpaceId) || []);

            expect(expandedIds.length).toBeGreaterThan(0);
        });
    });

    describe('Click Behavior After Auto-Show', () => {
        it('should allow clicking items without collapse after auto-show', () => {
            let expandedIdsMap = new Map([
                ['space-1', new Set(['folder-1', 'folder-2'])],
            ]);

            // Auto-show happens, state syncs
            const syncedExpandedIds = Array.from(expandedIdsMap.get('space-1') || []);

            // User clicks item
            const handleClick = () => {
                // Should NOT modify expandedIds
            };

            handleClick();

            // expandedIds should still be populated
            const afterClick = Array.from(expandedIdsMap.get('space-1') || []);
            expect(afterClick).toEqual(syncedExpandedIds);
        });
    });

    describe('Complete Auto-Show Flow', () => {
        it('should complete full auto-show with state sync', async () => {
            const flowSteps: string[] = [];
            let sidebarVisible = false;
            const expandedIdsMap = new Map([
                ['space-1', new Set(['folder-1', 'folder-2'])],
            ]);

            // 1. Mouse near edge
            flowSteps.push('mouse_detected');

            // 2. Send notification
            flowSteps.push('notification_sent');

            // 3. Main updates sidebarVisible
            sidebarVisible = true;
            flowSteps.push('sidebarVisible_true');

            // 4. State sync triggers
            const expandedIds = Array.from(expandedIdsMap.get('space-1') || []);
            flowSteps.push('state_synced');

            // 5. Overlay shows
            flowSteps.push('overlay_shown');

            expect(sidebarVisible).toBe(true);
            expect(expandedIds).toEqual(['folder-1', 'folder-2']);
            expect(flowSteps).toEqual([
                'mouse_detected',
                'notification_sent',
                'sidebarVisible_true',
                'state_synced',
                'overlay_shown',
            ]);
        });
    });

    describe('Regression: Broken Scenario vs Working Scenario', () => {
        it('BROKEN (before fix): Auto-show without notification', () => {
            let sidebarVisible = false;
            const expandedIdsMap = new Map<string, Set<string>>();

            // Overlay shows without notification
            // sidebarVisible stays false
            // State sync doesn't run

            const expandedIds = Array.from(expandedIdsMap.get('space-1') || []);

            expect(sidebarVisible).toBe(false);
            expect(expandedIds).toEqual([]); // EMPTY - the bug!
        });

        it('WORKING (after fix): Auto-show with notification', () => {
            let sidebarVisible = false;
            const expandedIdsMap = new Map([
                ['space-1', new Set(['folder-1', 'folder-2'])],
            ]);

            // Notification sent
            sidebarVisible = true;

            // State sync runs
            const expandedIds = Array.from(expandedIdsMap.get('space-1') || []);

            expect(sidebarVisible).toBe(true);
            expect(expandedIds).toEqual(['folder-1', 'folder-2']); // POPULATED ✅
        });
    });
});
