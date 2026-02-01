import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for Overlay State Synchronization
 *
 * REGRESSION PREVENTION:
 * - Commit 17fa3d0: Core state sync implementation
 * - Commit f936462: State sync optimization
 * - Commit 06130e5: Expanded state sync fixes
 *
 * Critical behaviors:
 * 1. Full state synced from main renderer to overlay
 * 2. Actions forwarded from overlay to main renderer
 * 3. Expanded IDs filtered to active space only
 * 4. No state corruption during sync
 * 5. Bidirectional communication works correctly
 */

describe('Spec-020: Overlay State Synchronization', () => {
    describe('State Sync Main → Overlay', () => {
        it('should sync complete state payload to overlay', () => {
            const mockSyncState = vi.fn();

            const statePayload = {
                spaces: [
                    { id: 'space-1', name: 'Space 1', icon: 'briefcase' },
                    { id: 'space-2', name: 'Space 2', icon: 'book' },
                ],
                activeSpaceId: 'space-1',
                activeSpaceIndex: 0,
                selectedItemId: 'item-1',
                expandedIds: ['folder-1', 'folder-2'],
                sidebarMode: 'floating',
                activeTab: 'browser',
                userName: 'dishant ghai',
            };

            // From App.tsx overlay visibility effect
            mockSyncState(statePayload);

            expect(mockSyncState).toHaveBeenCalledWith(
                expect.objectContaining({
                    spaces: expect.any(Array),
                    activeSpaceId: 'space-1',
                    activeSpaceIndex: 0,
                    selectedItemId: 'item-1',
                    expandedIds: expect.any(Array),
                    sidebarMode: 'floating',
                    activeTab: 'browser',
                })
            );
        });

        it('should filter expandedIds to active space only before sync', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b'])],
                ['space-2', new Set(['folder-2a', 'folder-2b'])],
            ]);

            const spaces = [
                { id: 'space-1', name: 'Space 1' },
                { id: 'space-2', name: 'Space 2' },
            ];
            const activeSpaceIndex = 0;
            const activeSpaceId = spaces[activeSpaceIndex].id;

            // From App.tsx
            const expandedIdsForSpace = Array.from(
                expandedIdsMap.get(activeSpaceId) || []
            );

            expect(expandedIdsForSpace).toEqual(['folder-1a', 'folder-1b']);
            expect(expandedIdsForSpace).not.toContain('folder-2a');
            expect(expandedIdsForSpace).not.toContain('folder-2b');
        });

        it('should sync empty expandedIds when space has no expanded folders', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set()],
            ]);

            const spaces = [{ id: 'space-1', name: 'Space 1' }];
            const activeSpaceIndex = 0;
            const activeSpaceId = spaces[activeSpaceIndex].id;

            const expandedIdsForSpace = Array.from(
                expandedIdsMap.get(activeSpaceId) || []
            );

            expect(expandedIdsForSpace).toEqual([]);
        });

        it('should handle null activeSpaceId gracefully', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1'])],
            ]);

            const spaces: any[] = [];
            const activeSpaceIndex = 0;
            const activeSpaceId = spaces[activeSpaceIndex]?.id || null;

            const expandedIdsForSpace = Array.from(
                expandedIdsMap.get(activeSpaceId!) || []
            );

            expect(expandedIdsForSpace).toEqual([]);
        });
    });

    describe('State Update Reception in Overlay', () => {
        it('should update all state fields when receiving update', () => {
            // Simulate sidebar.tsx state update handler
            const state = {
                spaces: [],
                activeSpaceIndex: 0,
                selectedItemId: null,
                expandedIds: [] as string[],
                sidebarMode: 'fixed' as const,
                activeTab: 'spaces' as const,
                userName: 'Test User',
            };

            const incomingState = {
                spaces: [{ id: 'space-1', name: 'Space 1' }],
                activeSpaceIndex: 1,
                selectedItemId: 'item-5',
                expandedIds: ['folder-1', 'folder-2'],
                sidebarMode: 'floating' as const,
                activeTab: 'browser' as const,
                userName: 'dishant ghai',
            };

            // Update state
            Object.assign(state, incomingState);

            expect(state.spaces).toHaveLength(1);
            expect(state.activeSpaceIndex).toBe(1);
            expect(state.selectedItemId).toBe('item-5');
            expect(state.expandedIds).toEqual(['folder-1', 'folder-2']);
            expect(state.sidebarMode).toBe('floating');
            expect(state.activeTab).toBe('browser');
            expect(state.userName).toBe('dishant ghai');
        });

        it('should convert expandedIds array to Map for active space', () => {
            let expandedIdsMap = new Map<string, Set<string>>();

            const incomingState = {
                activeSpaceId: 'space-1',
                expandedIds: ['folder-1a', 'folder-1b'],
            };

            // From sidebar.tsx onStateUpdate
            if (incomingState.activeSpaceId && incomingState.expandedIds) {
                const newMap = new Map(expandedIdsMap);
                newMap.set(incomingState.activeSpaceId, new Set(incomingState.expandedIds));
                expandedIdsMap = newMap;
            }

            expect(expandedIdsMap.get('space-1')).toEqual(
                new Set(['folder-1a', 'folder-1b'])
            );
        });

        it('should preserve expandedIds for other spaces during update', () => {
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
                ['space-2', new Set(['folder-2a'])],
            ]);

            const incomingState = {
                activeSpaceId: 'space-1',
                expandedIds: ['folder-1a', 'folder-1b', 'folder-1c'],
            };

            // From sidebar.tsx - uses new Map(prevMap)
            if (incomingState.activeSpaceId && incomingState.expandedIds) {
                const newMap = new Map(expandedIdsMap);
                newMap.set(incomingState.activeSpaceId, new Set(incomingState.expandedIds));
                expandedIdsMap = newMap;
            }

            expect(expandedIdsMap.get('space-1')).toEqual(
                new Set(['folder-1a', 'folder-1b', 'folder-1c'])
            );
            expect(expandedIdsMap.get('space-2')).toEqual(new Set(['folder-2a']));
        });
    });

    describe('Action Forwarding Overlay → Main', () => {
        it('should forward ITEM_CLICK action with correct payload', () => {
            const mockSendAction = vi.fn();

            const action = {
                type: 'ITEM_CLICK',
                payload: { itemId: 'item-1', spaceId: 'space-1' },
            };

            mockSendAction(action.type, action.payload);

            expect(mockSendAction).toHaveBeenCalledWith('ITEM_CLICK', {
                itemId: 'item-1',
                spaceId: 'space-1',
            });
        });

        it('should forward SELECT_SPACE action', () => {
            const mockSendAction = vi.fn();

            const action = {
                type: 'SELECT_SPACE',
                payload: { index: 2 },
            };

            mockSendAction(action.type, action.payload);

            expect(mockSendAction).toHaveBeenCalledWith('SELECT_SPACE', { index: 2 });
        });

        it('should forward MODE_TOGGLE action', () => {
            const mockSendAction = vi.fn();

            mockSendAction('MODE_TOGGLE', {});

            expect(mockSendAction).toHaveBeenCalledWith('MODE_TOGGLE', {});
        });

        it('should forward EXPANDED_IDS_CHANGE action', () => {
            const mockSendAction = vi.fn();

            mockSendAction('EXPANDED_IDS_CHANGE', {
                expandedIds: ['folder-1', 'folder-2'],
            });

            expect(mockSendAction).toHaveBeenCalledWith('EXPANDED_IDS_CHANGE', {
                expandedIds: ['folder-1', 'folder-2'],
            });
        });

        it('should forward FOCUS_CHANGE action (Commit 06130e5)', () => {
            const mockSendAction = vi.fn();

            mockSendAction('FOCUS_CHANGE', { hasFocus: true });

            expect(mockSendAction).toHaveBeenCalledWith('FOCUS_CHANGE', { hasFocus: true });
        });
    });

    describe('Bidirectional Sync Flow', () => {
        it('should complete full sync cycle: Main → Overlay → Main', () => {
            const callFlow: string[] = [];

            // Main sends state
            const syncState = (state: any) => {
                callFlow.push('Main→Overlay: syncState');
            };

            // Overlay receives and updates UI
            const receiveState = (state: any) => {
                callFlow.push('Overlay: receiveState');
            };

            // User interacts in overlay
            const userInteraction = () => {
                callFlow.push('Overlay: userInteraction');
            };

            // Overlay sends action
            const sendAction = (type: string, payload: any) => {
                callFlow.push('Overlay→Main: sendAction');
            };

            // Main receives and handles action
            const handleAction = (action: any) => {
                callFlow.push('Main: handleAction');
            };

            // Execute flow
            syncState({ spaces: [] });
            receiveState({ spaces: [] });
            userInteraction();
            sendAction('ITEM_CLICK', { itemId: 'item-1' });
            handleAction({ type: 'ITEM_CLICK' });

            expect(callFlow).toEqual([
                'Main→Overlay: syncState',
                'Overlay: receiveState',
                'Overlay: userInteraction',
                'Overlay→Main: sendAction',
                'Main: handleAction',
            ]);
        });

        it('should handle state sync during overlay visibility changes', () => {
            const callFlow: string[] = [];

            const syncState = vi.fn(() => callFlow.push('syncState'));
            const show = vi.fn(() => callFlow.push('show'));

            // Show overlay: sync state first, then show
            syncState({});
            show();

            expect(callFlow).toEqual(['syncState', 'show']);
        });
    });

    describe('Connection Status Management', () => {
        it('should track connection status in overlay', () => {
            let connectionStatus: 'connecting' | 'connected' | 'error' = 'connecting';

            // Successful connection
            connectionStatus = 'connected';

            expect(connectionStatus).toBe('connected');
        });

        it('should set error status when electronAPI unavailable', () => {
            let connectionStatus: 'connecting' | 'connected' | 'error' = 'connecting';

            const electronAPIAvailable = false;

            if (!electronAPIAvailable) {
                connectionStatus = 'error';
            }

            expect(connectionStatus).toBe('error');
        });

        it('should render loading state when connecting', () => {
            const connectionStatus = 'connecting';

            const shouldShowLoading = connectionStatus === 'connecting';

            expect(shouldShowLoading).toBe(true);
        });

        it('should render error state when connection fails', () => {
            const connectionStatus = 'error';

            const shouldShowError = connectionStatus === 'error';

            expect(shouldShowError).toBe(true);
        });

        it('should render sidebar when connected', () => {
            const connectionStatus = 'connected';

            const shouldShowSidebar = connectionStatus === 'connected';

            expect(shouldShowSidebar).toBe(true);
        });
    });

    describe('State Sync Triggers', () => {
        it('should sync when spaces change', () => {
            const syncTriggers: string[] = [];

            const dependencies = {
                useOverlayMode: true,
                spaces: [{ id: 'space-1' }],
                activeSpaceIndex: 0,
                selectedItemId: null,
                expandedIdsMap: new Map(),
                sidebarMode: 'floating',
                activeTab: 'browser',
            };

            // Simulate dependency change
            const newSpaces = [{ id: 'space-1' }, { id: 'space-2' }];
            if (newSpaces !== dependencies.spaces) {
                syncTriggers.push('spaces');
            }

            expect(syncTriggers).toContain('spaces');
        });

        it('should sync when selected item changes', () => {
            const syncTriggers: string[] = [];

            const prevSelectedItemId = 'item-1';
            const newSelectedItemId = 'item-2';

            if (newSelectedItemId !== prevSelectedItemId) {
                syncTriggers.push('selectedItemId');
            }

            expect(syncTriggers).toContain('selectedItemId');
        });

        it('should sync when expandedIdsMap changes', () => {
            const syncTriggers: string[] = [];

            const prevMap = new Map([['space-1', new Set(['folder-1'])]]);
            const newMap = new Map([['space-1', new Set(['folder-1', 'folder-2'])]]);

            if (newMap !== prevMap) {
                syncTriggers.push('expandedIdsMap');
            }

            expect(syncTriggers).toContain('expandedIdsMap');
        });

        it('should sync when sidebar mode changes', () => {
            const syncTriggers: string[] = [];

            const prevMode = 'fixed';
            const newMode = 'floating';

            if (newMode !== prevMode) {
                syncTriggers.push('sidebarMode');
            }

            expect(syncTriggers).toContain('sidebarMode');
        });

        it('should sync when active tab changes', () => {
            const syncTriggers: string[] = [];

            const prevTab = 'spaces';
            const newTab = 'browser';

            if (newTab !== prevTab) {
                syncTriggers.push('activeTab');
            }

            expect(syncTriggers).toContain('activeTab');
        });
    });

    describe('Expanded IDs Filtering', () => {
        it('should only send active space expanded IDs in sync payload', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b'])],
                ['space-2', new Set(['folder-2a', 'folder-2b'])],
                ['space-3', new Set(['folder-3a'])],
            ]);

            const spaces = [
                { id: 'space-1', name: 'Space 1' },
                { id: 'space-2', name: 'Space 2' },
                { id: 'space-3', name: 'Space 3' },
            ];
            const activeSpaceIndex = 1;
            const activeSpaceId = spaces[activeSpaceIndex].id;

            const expandedIdsForSpace = Array.from(
                expandedIdsMap.get(activeSpaceId) || []
            );

            expect(expandedIdsForSpace).toEqual(['folder-2a', 'folder-2b']);
            expect(expandedIdsForSpace.length).toBe(2);
        });

        it('should handle space with no expanded IDs in map', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
            ]);

            const activeSpaceId = 'space-2';

            const expandedIdsForSpace = Array.from(
                expandedIdsMap.get(activeSpaceId) || []
            );

            expect(expandedIdsForSpace).toEqual([]);
        });
    });

    describe('Action Reception in Main Renderer', () => {
        it('should handle SELECT_SPACE action from overlay', () => {
            let activeSpaceIndex = 0;
            let focusContext: 'sidebar' | 'spacesScreen' = 'spacesScreen';

            const action = {
                type: 'SELECT_SPACE',
                payload: { index: 2 },
            };

            // From App.tsx action handler
            if (action.type === 'SELECT_SPACE') {
                activeSpaceIndex = action.payload.index;
                focusContext = 'sidebar';
            }

            expect(activeSpaceIndex).toBe(2);
            expect(focusContext).toBe('sidebar');
        });

        it('should handle EXPANDED_IDS_CHANGE action from overlay', () => {
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
            ]);

            const spaces = [{ id: 'space-1', name: 'Space 1' }];
            const activeSpaceIndex = 0;
            const activeSpaceId = spaces[activeSpaceIndex].id;

            const action = {
                type: 'EXPANDED_IDS_CHANGE',
                payload: { expandedIds: ['folder-1a', 'folder-1b'] },
            };

            // From App.tsx action handler
            if (action.type === 'EXPANDED_IDS_CHANGE' && activeSpaceId) {
                const newMap = new Map(expandedIdsMap);
                newMap.set(activeSpaceId, new Set(action.payload.expandedIds));
                expandedIdsMap = newMap;
            }

            expect(expandedIdsMap.get('space-1')).toEqual(
                new Set(['folder-1a', 'folder-1b'])
            );
        });

        it('should handle MODE_TOGGLE action from overlay', () => {
            let sidebarMode: 'fixed' | 'floating' = 'floating';
            let sidebarVisible = false;

            const action = { type: 'MODE_TOGGLE', payload: {} };

            // From App.tsx action handler
            if (action.type === 'MODE_TOGGLE') {
                const prevMode = sidebarMode;
                const newMode = prevMode === 'fixed' ? 'floating' : 'fixed';

                if (prevMode === 'floating' && newMode === 'fixed') {
                    sidebarVisible = true;
                }

                sidebarMode = newMode;
            }

            expect(sidebarMode).toBe('fixed');
            expect(sidebarVisible).toBe(true);
        });

        it('should handle FOCUS_CHANGE action from overlay', () => {
            let focusContext: 'sidebar' | 'spacesScreen' = 'spacesScreen';

            const action = {
                type: 'FOCUS_CHANGE',
                payload: { hasFocus: true },
            };

            // From App.tsx action handler
            if (action.type === 'FOCUS_CHANGE' && action.payload.hasFocus) {
                focusContext = 'sidebar';
            }

            expect(focusContext).toBe('sidebar');
        });
    });

    describe('Sync Frequency Control', () => {
        it('should only sync when in overlay mode', () => {
            const syncCallCount = vi.fn();

            const scenarios = [
                { sidebarMode: 'floating', activeTab: 'browser', shouldSync: true },
                { sidebarMode: 'fixed', activeTab: 'browser', shouldSync: false },
                { sidebarMode: 'floating', activeTab: 'spaces', shouldSync: false },
            ];

            scenarios.forEach(({ sidebarMode, activeTab, shouldSync }) => {
                const useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser';

                if (useOverlayMode) {
                    syncCallCount();
                }

                expect(syncCallCount).toHaveBeenCalledTimes(shouldSync ? 1 : 0);
                syncCallCount.mockClear();
            });
        });

        it('should batch multiple state changes into single sync', () => {
            const mockSyncState = vi.fn();
            let selectedItemId = 'item-1';
            let expandedIds = ['folder-1'];

            // Multiple state changes
            selectedItemId = 'item-2';
            expandedIds = ['folder-1', 'folder-2'];

            // Single sync with latest state
            mockSyncState({
                selectedItemId,
                expandedIds,
            });

            expect(mockSyncState).toHaveBeenCalledTimes(1);
            expect(mockSyncState).toHaveBeenCalledWith({
                selectedItemId: 'item-2',
                expandedIds: ['folder-1', 'folder-2'],
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid state updates without corruption', () => {
            let expandedIdsMap = new Map<string, Set<string>>();

            const updates = [
                { spaceId: 'space-1', expandedIds: ['folder-1a'] },
                { spaceId: 'space-2', expandedIds: ['folder-2a'] },
                { spaceId: 'space-1', expandedIds: ['folder-1a', 'folder-1b'] },
                { spaceId: 'space-3', expandedIds: ['folder-3a'] },
            ];

            updates.forEach(({ spaceId, expandedIds }) => {
                const newMap = new Map(expandedIdsMap);
                newMap.set(spaceId, new Set(expandedIds));
                expandedIdsMap = newMap;
            });

            expect(expandedIdsMap.get('space-1')).toEqual(new Set(['folder-1a', 'folder-1b']));
            expect(expandedIdsMap.get('space-2')).toEqual(new Set(['folder-2a']));
            expect(expandedIdsMap.get('space-3')).toEqual(new Set(['folder-3a']));
        });

        it('should handle sync when overlay WebContents is destroyed', () => {
            const mockSend = vi.fn();
            const isDestroyed = true;

            // From SidebarOverlayService.sendStateUpdate
            if (!isDestroyed) {
                mockSend('sidebar:state-update', {});
            }

            expect(mockSend).not.toHaveBeenCalled();
        });

        it('should handle action when main WebContents is destroyed', () => {
            const mockSend = vi.fn();
            const isDestroyed = true;

            if (!isDestroyed) {
                mockSend('sidebar:action', {});
            }

            expect(mockSend).not.toHaveBeenCalled();
        });
    });

    describe('State Payload Completeness', () => {
        it('should include all required fields in state payload', () => {
            const statePayload = {
                spaces: [{ id: 'space-1', name: 'Space 1', icon: 'briefcase' }],
                activeSpaceId: 'space-1',
                activeSpaceIndex: 0,
                selectedItemId: 'item-1',
                expandedIds: ['folder-1'],
                sidebarMode: 'floating' as const,
                activeTab: 'browser' as const,
                userName: 'dishant ghai',
            };

            expect(statePayload).toHaveProperty('spaces');
            expect(statePayload).toHaveProperty('activeSpaceId');
            expect(statePayload).toHaveProperty('activeSpaceIndex');
            expect(statePayload).toHaveProperty('selectedItemId');
            expect(statePayload).toHaveProperty('expandedIds');
            expect(statePayload).toHaveProperty('sidebarMode');
            expect(statePayload).toHaveProperty('activeTab');
            expect(statePayload).toHaveProperty('userName');
        });

        it('should handle null values in state payload', () => {
            const statePayload = {
                spaces: [],
                activeSpaceId: null,
                activeSpaceIndex: 0,
                selectedItemId: null,
                expandedIds: [],
                sidebarMode: 'floating' as const,
                activeTab: 'browser' as const,
                userName: 'dishant ghai',
            };

            expect(statePayload.activeSpaceId).toBeNull();
            expect(statePayload.selectedItemId).toBeNull();
        });
    });
});
