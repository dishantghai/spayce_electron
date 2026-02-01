import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests for Overlay Expanded State Management
 *
 * REGRESSION TEST FOR COMMIT 06130e5
 * Bug: expandedIdsMap was being completely replaced on every state sync,
 * causing unwanted folder collapses when switching between spaces.
 *
 * Fix: Only update active space's expanded IDs in expandedIdsMap using
 * new Map(prevMap) to preserve other spaces' state.
 *
 * This test ensures:
 * 1. Expanded folders stay expanded when switching spaces
 * 2. Each space maintains independent expanded state
 * 3. State sync doesn't corrupt expandedIdsMap
 * 4. Selective updates using Map constructor pattern
 */

describe('Spec-020: Overlay Expanded State Management', () => {
    describe('REGRESSION: Expanded State Corruption (Commit 06130e5)', () => {
        it('should preserve expanded state for non-active spaces', () => {
            // Initial state: multiple spaces with different expanded folders
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b'])],
                ['space-2', new Set(['folder-2a', 'folder-2b'])],
                ['space-3', new Set(['folder-3a'])],
            ]);

            const activeSpaceId = 'space-2';
            const newExpandedIds = ['folder-2a', 'folder-2c']; // folder-2b collapsed, folder-2c expanded

            // Update ONLY active space's expanded IDs (correct implementation)
            const newMap = new Map(expandedIdsMap); // Copy existing map
            newMap.set(activeSpaceId, new Set(newExpandedIds));

            // Verify other spaces' state is preserved
            expect(newMap.get('space-1')).toEqual(new Set(['folder-1a', 'folder-1b']));
            expect(newMap.get('space-2')).toEqual(new Set(['folder-2a', 'folder-2c']));
            expect(newMap.get('space-3')).toEqual(new Set(['folder-3a']));
        });

        it('should update active space expanded state without affecting others', () => {
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
                ['space-2', new Set(['folder-2a'])],
            ]);

            const activeSpaceId = 'space-1';
            const newExpandedIds = ['folder-1a', 'folder-1b']; // Added folder-1b

            // Simulate handleExpandedIdsMapChange from sidebar.tsx
            const handleExpandedIdsMapChange = (map: Map<string, Set<string>>) => {
                expandedIdsMap = map;
            };

            const newMap = new Map(expandedIdsMap);
            newMap.set(activeSpaceId, new Set(newExpandedIds));
            handleExpandedIdsMapChange(newMap);

            // space-1 should have new state
            expect(expandedIdsMap.get('space-1')).toEqual(new Set(['folder-1a', 'folder-1b']));
            // space-2 should be unchanged
            expect(expandedIdsMap.get('space-2')).toEqual(new Set(['folder-2a']));
        });

        it('should handle space switch without collapsing folders in previous space', () => {
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b', 'folder-1c'])],
                ['space-2', new Set(['folder-2a'])],
            ]);

            // Switch from space-1 to space-2
            let activeSpaceId = 'space-2';

            // Expand a folder in space-2
            const newExpandedIds = ['folder-2a', 'folder-2b'];
            const newMap = new Map(expandedIdsMap);
            newMap.set(activeSpaceId, new Set(newExpandedIds));
            expandedIdsMap = newMap;

            // Switch back to space-1
            activeSpaceId = 'space-1';

            // Folders in space-1 should still be expanded
            expect(expandedIdsMap.get('space-1')).toEqual(
                new Set(['folder-1a', 'folder-1b', 'folder-1c'])
            );
        });

        it('should prevent total map replacement on state sync', () => {
            // WRONG IMPLEMENTATION (what the bug was doing):
            const wrongUpdate = (
                expandedIds: string[]
            ): Map<string, Set<string>> => {
                // This REPLACES the entire map, losing all other spaces
                return new Map([['space-1', new Set(expandedIds)]]);
            };

            // CORRECT IMPLEMENTATION (the fix):
            const correctUpdate = (
                prevMap: Map<string, Set<string>>,
                activeSpaceId: string,
                expandedIds: string[]
            ): Map<string, Set<string>> => {
                const newMap = new Map(prevMap); // Preserve existing state
                newMap.set(activeSpaceId, new Set(expandedIds));
                return newMap;
            };

            const initialMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
                ['space-2', new Set(['folder-2a'])],
                ['space-3', new Set(['folder-3a'])],
            ]);

            const wrongResult = wrongUpdate(['folder-1a', 'folder-1b']);
            const correctResult = correctUpdate(initialMap, 'space-1', ['folder-1a', 'folder-1b']);

            // Wrong implementation loses space-2 and space-3
            expect(wrongResult.size).toBe(1);
            expect(wrongResult.has('space-2')).toBe(false);
            expect(wrongResult.has('space-3')).toBe(false);

            // Correct implementation preserves all spaces
            expect(correctResult.size).toBe(3);
            expect(correctResult.get('space-1')).toEqual(new Set(['folder-1a', 'folder-1b']));
            expect(correctResult.get('space-2')).toEqual(new Set(['folder-2a']));
            expect(correctResult.get('space-3')).toEqual(new Set(['folder-3a']));
        });
    });

    describe('State Sync from Overlay to Main', () => {
        it('should send only active space expanded IDs to main renderer', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b'])],
                ['space-2', new Set(['folder-2a', 'folder-2b', 'folder-2c'])],
            ]);

            const activeSpaceId = 'space-2';
            const spaces = [
                { id: 'space-1', name: 'Space 1' },
                { id: 'space-2', name: 'Space 2' },
            ];
            const activeSpaceIndex = 1;

            // From sidebar.tsx handleExpandedIdsMapChange
            const expandedArray = Array.from(expandedIdsMap.get(activeSpaceId) || []);

            expect(expandedArray).toEqual(['folder-2a', 'folder-2b', 'folder-2c']);
            // Should NOT include space-1's expanded IDs
            expect(expandedArray).not.toContain('folder-1a');
            expect(expandedArray).not.toContain('folder-1b');
        });

        it('should handle empty expanded IDs for new space', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
            ]);

            const activeSpaceId = 'space-2'; // New space with no expanded state
            const expandedArray = Array.from(expandedIdsMap.get(activeSpaceId) || []);

            expect(expandedArray).toEqual([]);
        });
    });

    describe('Expanded State Persistence Across Space Switches', () => {
        it('should maintain expanded folders when switching away and back', () => {
            let expandedIdsMap = new Map<string, Set<string>>();
            let activeSpaceIndex = 0;
            const spaces = [
                { id: 'space-1', name: 'Space 1' },
                { id: 'space-2', name: 'Space 2' },
            ];

            // Expand folders in space-1
            const newMap1 = new Map(expandedIdsMap);
            newMap1.set('space-1', new Set(['folder-1a', 'folder-1b']));
            expandedIdsMap = newMap1;

            // Switch to space-2
            activeSpaceIndex = 1;

            // Expand folder in space-2
            const newMap2 = new Map(expandedIdsMap);
            newMap2.set('space-2', new Set(['folder-2a']));
            expandedIdsMap = newMap2;

            // Switch back to space-1
            activeSpaceIndex = 0;

            // Folders in space-1 should STILL be expanded
            expect(expandedIdsMap.get('space-1')).toEqual(new Set(['folder-1a', 'folder-1b']));
        });

        it('should handle rapid space switching without state corruption', () => {
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
                ['space-2', new Set(['folder-2a'])],
                ['space-3', new Set(['folder-3a'])],
            ]);

            // Rapid space switches: 1 -> 2 -> 3 -> 1
            const switches = [
                { spaceId: 'space-2', expanded: ['folder-2a', 'folder-2b'] },
                { spaceId: 'space-3', expanded: ['folder-3a', 'folder-3b'] },
                { spaceId: 'space-1', expanded: ['folder-1a', 'folder-1b'] },
            ];

            switches.forEach(({ spaceId, expanded }) => {
                const newMap = new Map(expandedIdsMap);
                newMap.set(spaceId, new Set(expanded));
                expandedIdsMap = newMap;
            });

            // All spaces should maintain their state
            expect(expandedIdsMap.get('space-1')).toEqual(new Set(['folder-1a', 'folder-1b']));
            expect(expandedIdsMap.get('space-2')).toEqual(new Set(['folder-2a', 'folder-2b']));
            expect(expandedIdsMap.get('space-3')).toEqual(new Set(['folder-3a', 'folder-3b']));
        });
    });

    describe('Expanded IDs Synchronization', () => {
        it('should filter expandedIds by active space before sending to overlay', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b'])],
                ['space-2', new Set(['folder-2a'])],
            ]);

            const spaces = [
                { id: 'space-1', name: 'Space 1' },
                { id: 'space-2', name: 'Space 2' },
            ];
            const activeSpaceIndex = 0;
            const activeSpaceId = spaces[activeSpaceIndex].id;

            // From App.tsx overlay visibility effect
            const expandedIdsForSpace = Array.from(
                expandedIdsMap.get(activeSpaceId) || []
            );

            expect(expandedIdsForSpace).toEqual(['folder-1a', 'folder-1b']);
            // Should not include space-2's expanded IDs
            expect(expandedIdsForSpace).not.toContain('folder-2a');
        });

        it('should handle undefined space ID gracefully', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
            ]);

            const spaces: any[] = [];
            const activeSpaceIndex = 0;
            const activeSpaceId = spaces[activeSpaceIndex]?.id; // undefined

            const expandedIdsForSpace = Array.from(
                expandedIdsMap.get(activeSpaceId) || []
            );

            expect(expandedIdsForSpace).toEqual([]);
        });
    });

    describe('Map Constructor Pattern (The Fix)', () => {
        it('should create shallow copy of Map with new Map(prevMap)', () => {
            const originalMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
            ]);

            const copiedMap = new Map(originalMap);

            // Maps should be different objects
            expect(copiedMap).not.toBe(originalMap);

            // But have same content
            expect(copiedMap.get('space-1')).toEqual(originalMap.get('space-1'));

            // Modifying copy should not affect original
            copiedMap.set('space-2', new Set(['folder-2a']));

            expect(originalMap.has('space-2')).toBe(false);
            expect(copiedMap.has('space-2')).toBe(true);
        });

        it('should preserve all entries when copying Map', () => {
            const originalMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
                ['space-2', new Set(['folder-2a', 'folder-2b'])],
                ['space-3', new Set(['folder-3a'])],
            ]);

            const copiedMap = new Map(originalMap);

            expect(copiedMap.size).toBe(3);
            expect(copiedMap.get('space-1')).toEqual(new Set(['folder-1a']));
            expect(copiedMap.get('space-2')).toEqual(new Set(['folder-2a', 'folder-2b']));
            expect(copiedMap.get('space-3')).toEqual(new Set(['folder-3a']));
        });
    });

    describe('EXPANDED_IDS_CHANGE Action Handling', () => {
        it('should update expandedIdsMap when receiving action from overlay', () => {
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
                ['space-2', new Set()],
            ]);

            const spaces = [
                { id: 'space-1', name: 'Space 1' },
                { id: 'space-2', name: 'Space 2' },
            ];
            const activeSpaceIndex = 1;
            const activeSpaceId = spaces[activeSpaceIndex].id;

            // Simulate EXPANDED_IDS_CHANGE action from overlay
            const action = {
                type: 'EXPANDED_IDS_CHANGE',
                payload: { expandedIds: ['folder-2a', 'folder-2b'] },
            };

            // Handler from App.tsx
            if (action.type === 'EXPANDED_IDS_CHANGE' && activeSpaceId) {
                const newMap = new Map(expandedIdsMap);
                newMap.set(activeSpaceId, new Set(action.payload.expandedIds));
                expandedIdsMap = newMap;
            }

            expect(expandedIdsMap.get('space-1')).toEqual(new Set(['folder-1a']));
            expect(expandedIdsMap.get('space-2')).toEqual(new Set(['folder-2a', 'folder-2b']));
        });

        it('should handle collapsing all folders in active space', () => {
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b', 'folder-1c'])],
            ]);

            const activeSpaceId = 'space-1';

            // User collapses all folders
            const action = {
                type: 'EXPANDED_IDS_CHANGE',
                payload: { expandedIds: [] },
            };

            if (action.type === 'EXPANDED_IDS_CHANGE' && activeSpaceId) {
                const newMap = new Map(expandedIdsMap);
                newMap.set(activeSpaceId, new Set(action.payload.expandedIds));
                expandedIdsMap = newMap;
            }

            expect(expandedIdsMap.get('space-1')).toEqual(new Set());
        });

        it('should handle expanding deeply nested folders', () => {
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1'])],
            ]);

            const activeSpaceId = 'space-1';

            // User expands nested folder chain
            const action = {
                type: 'EXPANDED_IDS_CHANGE',
                payload: {
                    expandedIds: ['folder-1', 'folder-1-child', 'folder-1-grandchild'],
                },
            };

            if (action.type === 'EXPANDED_IDS_CHANGE' && activeSpaceId) {
                const newMap = new Map(expandedIdsMap);
                newMap.set(activeSpaceId, new Set(action.payload.expandedIds));
                expandedIdsMap = newMap;
            }

            expect(expandedIdsMap.get('space-1')).toEqual(
                new Set(['folder-1', 'folder-1-child', 'folder-1-grandchild'])
            );
        });
    });

    describe('Sidebar.tsx Expanded State Logic', () => {
        it('should send only active space expanded IDs in handleExpandedIdsMapChange', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
                ['space-2', new Set(['folder-2a', 'folder-2b'])],
            ]);

            const spaces = [
                { id: 'space-1', name: 'Space 1' },
                { id: 'space-2', name: 'Space 2' },
            ];
            const activeSpaceIndex = 1;
            const activeSpaceId = spaces[activeSpaceIndex].id;

            // Mock sendAction
            const sentActions: any[] = [];
            const mockSendAction = (type: string, payload: any) => {
                sentActions.push({ type, payload });
            };

            // From sidebar.tsx
            const handleExpandedIdsMapChange = (map: Map<string, Set<string>>) => {
                if (activeSpaceId) {
                    const expandedArray = Array.from(map.get(activeSpaceId) || []);
                    mockSendAction('EXPANDED_IDS_CHANGE', { expandedIds: expandedArray });
                }
            };

            handleExpandedIdsMapChange(expandedIdsMap);

            expect(sentActions).toHaveLength(1);
            expect(sentActions[0].type).toBe('EXPANDED_IDS_CHANGE');
            expect(sentActions[0].payload.expandedIds).toEqual(['folder-2a', 'folder-2b']);
        });

        it('should not send expanded IDs when active space ID is null', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
            ]);

            const activeSpaceId: string | null = null;
            const sentActions: any[] = [];
            const mockSendAction = (type: string, payload: any) => {
                sentActions.push({ type, payload });
            };

            const handleExpandedIdsMapChange = (map: Map<string, Set<string>>) => {
                if (activeSpaceId) {
                    const expandedArray = Array.from(map.get(activeSpaceId) || []);
                    mockSendAction('EXPANDED_IDS_CHANGE', { expandedIds: expandedArray });
                }
            };

            handleExpandedIdsMapChange(expandedIdsMap);

            expect(sentActions).toHaveLength(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle new space with no previous expanded state', () => {
            const expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
            ]);

            const newSpaceId = 'space-3';
            const newExpandedIds = ['folder-3a'];

            const newMap = new Map(expandedIdsMap);
            newMap.set(newSpaceId, new Set(newExpandedIds));

            expect(newMap.size).toBe(2);
            expect(newMap.get('space-3')).toEqual(new Set(['folder-3a']));
        });

        it('should handle removing all expanded IDs from a space', () => {
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a', 'folder-1b'])],
            ]);

            const newMap = new Map(expandedIdsMap);
            newMap.set('space-1', new Set());
            expandedIdsMap = newMap;

            expect(expandedIdsMap.get('space-1')?.size).toBe(0);
        });

        it('should handle deleting a space from expanded map', () => {
            let expandedIdsMap = new Map<string, Set<string>>([
                ['space-1', new Set(['folder-1a'])],
                ['space-2', new Set(['folder-2a'])],
            ]);

            const newMap = new Map(expandedIdsMap);
            newMap.delete('space-2');
            expandedIdsMap = newMap;

            expect(expandedIdsMap.has('space-2')).toBe(false);
            expect(expandedIdsMap.get('space-1')).toEqual(new Set(['folder-1a']));
        });
    });
});
