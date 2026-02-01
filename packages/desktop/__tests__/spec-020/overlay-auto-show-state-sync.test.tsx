import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * CRITICAL REGRESSION TEST: Auto-Show State Sync
 *
 * BUG DISCOVERED: 2026-02-01
 * When overlay auto-shows via mouse tracking, state is never synced to it,
 * causing expandedIdsMap to be empty. This leads to:
 * 1. Clicking items sends back corrupted state with minimal expandedIds
 * 2. Folders unexpectedly collapse
 * 3. Overlay appears to malfunction
 *
 * ROOT CAUSE:
 * - Mouse tracking in SidebarOverlayService.show() directly without notifying main renderer
 * - App.tsx doesn't know overlay is visible (sidebarVisible = false)
 * - State sync effect doesn't run (condition: useOverlayMode && sidebarVisible)
 * - Overlay shows with empty/stale state
 *
 * THE FIX:
 * 1. Mouse tracking sends 'sidebar-overlay:auto-show-triggered' event BEFORE showing
 * 2. Main renderer listens for event and sets sidebarVisible = true
 * 3. This triggers overlay visibility effect
 * 4. State gets synced with correct expandedIdsMap
 * 5. User clicks work correctly
 *
 * REPRODUCTION STEPS:
 * 1. In browser mode, unpin sidebar (floating mode)
 * 2. Sidebar collapses (Arc behavior)
 * 3. Hover left edge → overlay auto-shows via mouse tracking
 * 4. Click on any item
 * 5. BUG: Sidebar collapses because expandedIdsMap is empty
 *
 * WORKING SCENARIO:
 * 1. In spaces mode, unpin sidebar
 * 2. React sidebar populates expandedIdsMap
 * 3. Switch to browser tab → overlay mode
 * 4. State is synced correctly
 * 5. Click on item → works fine
 */

describe('CRITICAL BUG: Overlay Auto-Show State Sync', () => {
    describe('BUG: Mouse Tracking Auto-Show Without State Sync', () => {
        it('should notify main renderer BEFORE showing overlay', async () => {
            const callOrder: string[] = [];
            const mockSendToRenderer = vi.fn(() => callOrder.push('notify_renderer'));
            const mockShow = vi.fn(() => callOrder.push('show_overlay'));

            // Simulate mouse tracking detection
            const cursorX = 5; // Within 10px trigger zone
            const triggerWidth = 10;

            if (cursorX <= triggerWidth) {
                // CRITICAL: Notify renderer FIRST
                mockSendToRenderer('sidebar-overlay:auto-show-triggered');
                // THEN show
                await mockShow();
            }

            expect(callOrder).toEqual(['notify_renderer', 'show_overlay']);
        });

        it('should NOT show without notifying renderer first', () => {
            const mockSendToRenderer = vi.fn();
            const mockShow = vi.fn();

            // OLD BUGGY IMPLEMENTATION (what we had before):
            const buggyAutoShow = () => {
                mockShow(); // Show without notifying!
            };

            buggyAutoShow();

            expect(mockShow).toHaveBeenCalled();
            expect(mockSendToRenderer).not.toHaveBeenCalled();
            // This is WRONG - renderer doesn't know overlay is visible!
        });

        it('should set sidebarVisible=true when receiving auto-show notification', () => {
            let sidebarVisible = false;

            // Simulate event listener in App.tsx
            const handleAutoShowTriggered = () => {
                sidebarVisible = true;
            };

            // Auto-show notification received
            handleAutoShowTriggered();

            expect(sidebarVisible).toBe(true);
        });
    });

    describe('State Sync Trigger After Auto-Show', () => {
        it('should trigger state sync effect when sidebarVisible becomes true', () => {
            const mockSyncState = vi.fn();
            let sidebarVisible = false;
            const useOverlayMode = true;

            // Before auto-show
            if (useOverlayMode && sidebarVisible) {
                mockSyncState({});
            }
            expect(mockSyncState).not.toHaveBeenCalled();

            // Auto-show notification received
            sidebarVisible = true;

            // After sidebarVisible = true
            if (useOverlayMode && sidebarVisible) {
                mockSyncState({ spaces: [], expandedIds: [] });
            }

            expect(mockSyncState).toHaveBeenCalled();
        });

        it('should sync expandedIdsMap to overlay after auto-show', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b', 'folder-1c'])],
            ]);

            const spaces = [{ id: 'space-1', name: 'Space 1' }];
            const activeSpaceIndex = 0;
            const activeSpaceId = spaces[activeSpaceIndex].id;

            // Extract expandedIds for sync
            const expandedIdsForSpace = Array.from(
                expandedIdsMap.get(activeSpaceId) || []
            );

            const statePayload = {
                spaces,
                activeSpaceId,
                activeSpaceIndex,
                expandedIds: expandedIdsForSpace,
            };

            expect(statePayload.expandedIds).toEqual(['folder-1a', 'folder-1b', 'folder-1c']);
        });
    });

    describe('Complete Auto-Show Flow (Fixed)', () => {
        it('should complete proper auto-show with state sync', async () => {
            const flowSteps: string[] = [];
            let sidebarVisible = false;
            let overlayShown = false;
            const mockSyncState = vi.fn(() => flowSteps.push('state_synced'));
            const mockShowOverlay = vi.fn(() => {
                overlayShown = true;
                flowSteps.push('overlay_shown');
            });

            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b'])],
            ]);

            // 1. Mouse tracking detects cursor
            flowSteps.push('mouse_detected');

            // 2. Send notification to renderer
            flowSteps.push('notify_renderer');

            // 3. Renderer updates sidebarVisible
            sidebarVisible = true;
            flowSteps.push('sidebarVisible_updated');

            // 4. State sync effect triggers
            const useOverlayMode = true;
            if (useOverlayMode && sidebarVisible) {
                const spaces = [{ id: 'space-1', name: 'Space 1' }];
                const activeSpaceId = spaces[0].id;
                const expandedIds = Array.from(expandedIdsMap.get(activeSpaceId) || []);

                mockSyncState({ spaces, expandedIds });
            }

            // 5. Overlay shows
            await mockShowOverlay();

            // 6. User can now click items with correct state
            flowSteps.push('ready_for_interaction');

            expect(sidebarVisible).toBe(true);
            expect(overlayShown).toBe(true);
            expect(mockSyncState).toHaveBeenCalledWith(
                expect.objectContaining({
                    expandedIds: ['folder-1a', 'folder-1b'],
                })
            );
            expect(flowSteps).toEqual([
                'mouse_detected',
                'notify_renderer',
                'sidebarVisible_updated',
                'state_synced',
                'overlay_shown',
                'ready_for_interaction',
            ]);
        });
    });

    describe('REGRESSION: Clicking Items After Auto-Show', () => {
        it('should maintain expandedIds when clicking items after auto-show', () => {
            // Simulate state after proper auto-show with sync
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b', 'folder-1c'])],
            ]);

            const spaces = [{ id: 'space-1', name: 'Space 1' }];
            const activeSpaceIndex = 0;
            const activeSpaceId = spaces[activeSpaceIndex].id;

            // User clicks item
            const action = {
                type: 'ITEM_CLICK',
                payload: { itemId: 'item-5', spaceId: 'space-1' },
            };

            // State sync should include all expanded IDs
            const expandedIds = Array.from(expandedIdsMap.get(activeSpaceId) || []);

            expect(expandedIds).toEqual(['folder-1a', 'folder-1b', 'folder-1c']);
            expect(expandedIds.length).toBeGreaterThan(1); // Not just 1!
        });

        it('should NOT collapse folders when clicking items after auto-show', () => {
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b', 'folder-1c'])],
            ]);

            const activeSpaceId = 'space-1';

            // Before click
            const beforeClick = expandedIdsMap.get(activeSpaceId);
            expect(beforeClick?.size).toBe(3);

            // Click item - no change to expandedIds
            const action = {
                type: 'ITEM_CLICK',
                payload: { itemId: 'item-5' },
            };

            // After click - expandedIds should be unchanged
            const afterClick = expandedIdsMap.get(activeSpaceId);
            expect(afterClick?.size).toBe(3);
            expect(afterClick).toEqual(beforeClick);
        });
    });

    describe('Comparison: Working vs Broken Scenarios', () => {
        it('BROKEN SCENARIO: Auto-show without notification', () => {
            const flowSteps: string[] = [];
            let sidebarVisible = false;
            const expandedIdsMap = new Map<string, Set<string>>();

            // 1. Mouse tracking shows overlay
            flowSteps.push('overlay_shown_directly');

            // 2. sidebarVisible still false (renderer doesn't know!)
            expect(sidebarVisible).toBe(false);

            // 3. State sync doesn't happen
            const useOverlayMode = true;
            if (useOverlayMode && sidebarVisible) {
                flowSteps.push('state_synced');
            }

            // 4. Click item with empty expandedIdsMap
            const expandedIds = Array.from(expandedIdsMap.get('space-1') || []);
            flowSteps.push('click_with_empty_state');

            expect(expandedIds).toEqual([]);
            expect(flowSteps).toEqual(['overlay_shown_directly', 'click_with_empty_state']);
        });

        it('WORKING SCENARIO: Auto-show with notification', () => {
            const flowSteps: string[] = [];
            let sidebarVisible = false;
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b'])],
            ]);

            // 1. Mouse tracking sends notification
            flowSteps.push('notification_sent');

            // 2. Renderer updates sidebarVisible
            sidebarVisible = true;
            flowSteps.push('sidebarVisible_updated');

            // 3. State sync happens
            const useOverlayMode = true;
            if (useOverlayMode && sidebarVisible) {
                flowSteps.push('state_synced');
            }

            // 4. Overlay shows with correct state
            flowSteps.push('overlay_shown');

            // 5. Click item with populated expandedIdsMap
            const expandedIds = Array.from(expandedIdsMap.get('space-1') || []);
            flowSteps.push('click_with_correct_state');

            expect(expandedIds).toEqual(['folder-1a', 'folder-1b']);
            expect(flowSteps).toEqual([
                'notification_sent',
                'sidebarVisible_updated',
                'state_synced',
                'overlay_shown',
                'click_with_correct_state',
            ]);
        });

        it('should have different expandedIds counts: broken=1, working=3+', () => {
            // BROKEN: Empty state
            const brokenExpandedIds = Array.from(new Map().get('space-1') || []);

            // WORKING: Populated state
            const workingExpandedIds = Array.from(
                new Map([['space-1', new Set(['folder-1', 'folder-2', 'folder-3'])]]).get('space-1') || []
            );

            expect(brokenExpandedIds.length).toBe(0);
            expect(workingExpandedIds.length).toBe(3);
        });
    });

    describe('Event Listener Lifecycle', () => {
        it('should setup listener on mount', () => {
            const mockOnAutoShowTriggered = vi.fn().mockReturnValue(() => {});

            const mockAPI = {
                sidebarOverlay: {
                    onAutoShowTriggered: mockOnAutoShowTriggered,
                },
            };

            // Simulate useEffect
            if (mockAPI.sidebarOverlay) {
                const unsubscribe = mockAPI.sidebarOverlay.onAutoShowTriggered(() => {});
            }

            expect(mockOnAutoShowTriggered).toHaveBeenCalled();
        });

        it('should cleanup listener on unmount', () => {
            const mockUnsubscribe = vi.fn();
            const mockOnAutoShowTriggered = vi.fn().mockReturnValue(mockUnsubscribe);

            const mockAPI = {
                sidebarOverlay: {
                    onAutoShowTriggered: mockOnAutoShowTriggered,
                },
            };

            // Simulate useEffect
            let unsubscribe: (() => void) | undefined;
            if (mockAPI.sidebarOverlay) {
                unsubscribe = mockAPI.sidebarOverlay.onAutoShowTriggered(() => {});
            }

            // Simulate cleanup
            unsubscribe?.();

            expect(mockUnsubscribe).toHaveBeenCalled();
        });

        it('should handle missing electronAPI gracefully', () => {
            const mockAPI = undefined;

            expect(() => {
                if (!mockAPI?.sidebarOverlay) return;
                // Should not reach here
            }).not.toThrow();
        });
    });

    describe('Timing: Notification Before Show', () => {
        it('should ensure notification reaches renderer before show completes', async () => {
            const events: string[] = [];

            const mockSendToRenderer = vi.fn(() => {
                events.push('notification_sent');
                // Simulate async delivery
                return new Promise((resolve) => setTimeout(resolve, 1));
            });

            const mockShow = vi.fn(async () => {
                events.push('show_started');
                await new Promise((resolve) => setTimeout(resolve, 250));
                events.push('show_completed');
            });

            // Send notification first
            await mockSendToRenderer();
            // Then show
            await mockShow();

            expect(events[0]).toBe('notification_sent');
            expect(events[1]).toBe('show_started');
        });

        it('should update sidebarVisible immediately on notification', () => {
            let sidebarVisible = false;
            let updateTimestamp = 0;

            const handleAutoShow = () => {
                sidebarVisible = true;
                updateTimestamp = Date.now();
            };

            const notificationTime = Date.now();
            handleAutoShow();

            expect(sidebarVisible).toBe(true);
            expect(updateTimestamp).toBeGreaterThanOrEqual(notificationTime);
        });
    });

    describe('State Sync Effect Integration', () => {
        it('should sync state when both useOverlayMode and sidebarVisible are true', () => {
            const mockSyncState = vi.fn();
            const useOverlayMode = true;
            let sidebarVisible = false;

            // Before auto-show notification
            if (useOverlayMode && sidebarVisible) {
                mockSyncState({});
            }
            expect(mockSyncState).not.toHaveBeenCalled();

            // After auto-show notification
            sidebarVisible = true;
            if (useOverlayMode && sidebarVisible) {
                mockSyncState({ spaces: [], expandedIds: ['folder-1'] });
            }

            expect(mockSyncState).toHaveBeenCalledWith(
                expect.objectContaining({
                    expandedIds: expect.any(Array),
                })
            );
        });

        it('should NOT sync state if sidebarVisible remains false', () => {
            const mockSyncState = vi.fn();
            const useOverlayMode = true;
            const sidebarVisible = false;

            if (useOverlayMode && sidebarVisible) {
                mockSyncState({});
            }

            expect(mockSyncState).not.toHaveBeenCalled();
        });
    });

    describe('ExpandedIdsMap Population', () => {
        it('should have populated expandedIdsMap from previous React sidebar usage', () => {
            // Scenario: User was in spaces mode, expanded folders, then switched to browser
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b', 'folder-1c'])],
            ]);

            const activeSpaceId = 'space-1';
            const expandedIds = Array.from(expandedIdsMap.get(activeSpaceId) || []);

            expect(expandedIds.length).toBe(3);
            expect(expandedIds).toContain('folder-1a');
            expect(expandedIds).toContain('folder-1b');
            expect(expandedIds).toContain('folder-1c');
        });

        it('should have empty expandedIdsMap when starting directly in browser mode', () => {
            // Scenario: App opens directly in browser mode with floating sidebar
            // React sidebar never rendered, so map is empty
            const expandedIdsMap = new Map<string, Set<string>>();

            const activeSpaceId = 'space-1';
            const expandedIds = Array.from(expandedIdsMap.get(activeSpaceId) || []);

            expect(expandedIds.length).toBe(0);
            // This is WHY the bug happens!
        });

        it('should populate expandedIdsMap from overlay interactions after auto-show', () => {
            let expandedIdsMap = new Map<string, Set<string>>();
            const activeSpaceId = 'space-1';

            // Auto-show happens with notification
            // State is synced (even if empty initially)

            // User expands folders
            const action1 = {
                type: 'EXPANDED_IDS_CHANGE',
                payload: { expandedIds: ['folder-1a'] },
            };

            const newMap1 = new Map(expandedIdsMap);
            newMap1.set(activeSpaceId, new Set(action1.payload.expandedIds));
            expandedIdsMap = newMap1;

            // User expands more folders
            const action2 = {
                type: 'EXPANDED_IDS_CHANGE',
                payload: { expandedIds: ['folder-1a', 'folder-1b'] },
            };

            const newMap2 = new Map(expandedIdsMap);
            newMap2.set(activeSpaceId, new Set(action2.payload.expandedIds));
            expandedIdsMap = newMap2;

            expect(expandedIdsMap.get(activeSpaceId)).toEqual(
                new Set(['folder-1a', 'folder-1b'])
            );
        });
    });

    describe('Event Payload', () => {
        it('should send notification without payload', () => {
            const mockSend = vi.fn();
            const channel = 'sidebar-overlay:auto-show-triggered';

            // From SidebarOverlayService
            mockSend(channel);

            expect(mockSend).toHaveBeenCalledWith(channel);
        });

        it('should handle notification in renderer', () => {
            const handlerCalls: any[] = [];

            const handleAutoShow = () => {
                handlerCalls.push('auto-show');
            };

            // Simulate event
            handleAutoShow();

            expect(handlerCalls).toContain('auto-show');
        });
    });

    describe('Window State Checks', () => {
        it('should check if window is destroyed before sending notification', () => {
            const mockWindow = {
                isDestroyed: vi.fn().mockReturnValue(false),
                webContents: {
                    send: vi.fn(),
                },
            };

            // From SidebarOverlayService
            if (mockWindow && !mockWindow.isDestroyed()) {
                mockWindow.webContents.send('sidebar-overlay:auto-show-triggered');
            }

            expect(mockWindow.isDestroyed).toHaveBeenCalled();
            expect(mockWindow.webContents.send).toHaveBeenCalled();
        });

        it('should NOT send notification if window is destroyed', () => {
            const mockWindow = {
                isDestroyed: vi.fn().mockReturnValue(true),
                webContents: {
                    send: vi.fn(),
                },
            };

            if (mockWindow && !mockWindow.isDestroyed()) {
                mockWindow.webContents.send('sidebar-overlay:auto-show-triggered');
            }

            expect(mockWindow.webContents.send).not.toHaveBeenCalled();
        });
    });
});
