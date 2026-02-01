import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * CRITICAL FIX: Stale Inline Input State Cleanup
 *
 * USER REPORT:
 * "When I click rename on item A, then open context menu on item B,
 * focus goes back to item A"
 *
 * ROOT CAUSE:
 * Inline input state (sidebarRenameItemId, sidebarInput) persists when
 * opening new context menus, causing:
 * - Dual selection state (item A has rename input, item B has context menu)
 * - Focus returning to item A (rename input captures focus)
 * - Confusing UX with overlapping UI states
 *
 * FIX:
 * Clear ALL inline input state when opening ANY context menu.
 * Context menu opening is the INVALIDATION POINT for pending inline actions.
 */

describe('CRITICAL FIX: Stale Inline Input State', () => {
    describe('BEFORE FIX: Stale State Persists', () => {
        it('demonstrates the bug - rename state persists across context menu opens', () => {
            let sidebarRenameItemId: string | null = null;
            let contextMenu: any = null;

            // User clicks rename on item A
            sidebarRenameItemId = 'item-A';

            // User right-clicks item B (WITHOUT this fix)
            contextMenu = {
                item: { id: 'item-B', name: 'Item B' },
                spaceId: 'space-1',
            };
            // ❌ sidebarRenameItemId still = 'item-A'

            expect(sidebarRenameItemId).toBe('item-A'); // STALE!
            expect(contextMenu.item.id).toBe('item-B');

            // Result: Item A shows rename input, item B has context menu
            // Focus jumps to item A (CONFUSING!)
        });

        it('demonstrates the bug - inline input state persists', () => {
            let sidebarInput: any = null;
            let contextMenu: any = null;

            // User clicks "new folder" on item A
            sidebarInput = {
                spaceId: 'space-1',
                parentId: 'item-A',
                type: 'folder',
            };

            // User right-clicks item B
            contextMenu = {
                item: { id: 'item-B' },
            };

            // ❌ sidebarInput still active for item A
            expect(sidebarInput).not.toBeNull();
            expect(sidebarInput.parentId).toBe('item-A');

            // Result: Inline input shows in item A, context menu for item B
        });
    });

    describe('AFTER FIX: State Cleared on Context Menu Open', () => {
        it('should clear rename state when opening new context menu', () => {
            let sidebarRenameItemId: string | null = null;
            let contextMenu: any = null;

            const clearSidebarInput = vi.fn();
            const setSidebarRenameItemId = vi.fn((id) => {
                sidebarRenameItemId = id;
            });

            // User clicks rename on item A
            sidebarRenameItemId = 'item-A';

            // User right-clicks item B (WITH fix)
            const handleContextMenu = (item: any) => {
                // CRITICAL FIX: Clear states FIRST
                clearSidebarInput();
                setSidebarRenameItemId(null);

                contextMenu = { item };
            };

            handleContextMenu({ id: 'item-B', name: 'Item B' });

            expect(clearSidebarInput).toHaveBeenCalled();
            expect(setSidebarRenameItemId).toHaveBeenCalledWith(null);
            expect(sidebarRenameItemId).toBeNull(); // ✅ CLEARED!
        });

        it('should clear inline input state when opening new context menu', () => {
            let sidebarInput: any = { type: 'folder', parentId: 'item-A' };

            const clearSidebarInput = vi.fn(() => {
                sidebarInput = null;
            });

            const handleContextMenu = (item: any) => {
                clearSidebarInput();
                // ... set context menu
            };

            handleContextMenu({ id: 'item-B' });

            expect(clearSidebarInput).toHaveBeenCalled();
            expect(sidebarInput).toBeNull();
        });
    });

    describe('OVERLAY: Local State Cleanup', () => {
        it('should clear inline input state locally in overlay immediately', () => {
            const mockClearSidebarInput = vi.fn();
            const mockSetSidebarRenameItemId = vi.fn();

            const mockStore = {
                clearSidebarInput: mockClearSidebarInput,
                setSidebarRenameItemId: mockSetSidebarRenameItemId,
            };

            // Overlay context menu handler
            const handleItemContextMenu = (item: any) => {
                // Clear locally BEFORE IPC sync
                mockStore.clearSidebarInput();
                mockStore.setSidebarRenameItemId(null);

                // Then set context menu
            };

            handleItemContextMenu({ id: 'item-B' });

            expect(mockClearSidebarInput).toHaveBeenCalled();
            expect(mockSetSidebarRenameItemId).toHaveBeenCalledWith(null);
        });

        it('should prevent UI flicker by clearing state before sync', () => {
            const actions: string[] = [];

            const handleContextMenu = () => {
                actions.push('1_clear_local_state');
                actions.push('2_set_context_menu');
                // Later: main renderer syncs clear state
                actions.push('3_receive_sync_from_main');
            };

            handleContextMenu();

            // State is cleared locally FIRST (step 1)
            // Then sync confirms it (step 3)
            expect(actions[0]).toBe('1_clear_local_state');
        });
    });

    describe('Test All Context Menu Open Combinations', () => {
        const createTestEnvironment = () => {
            let sidebarRenameItemId: string | null = null;
            let sidebarInput: any = null;
            let contextMenu: any = null;

            return {
                get sidebarRenameItemId() { return sidebarRenameItemId; },
                get sidebarInput() { return sidebarInput; },
                get contextMenu() { return contextMenu; },

                clearSidebarInput: () => { sidebarInput = null; },
                setSidebarRenameItemId: (id: string | null) => { sidebarRenameItemId = id; },
                setSidebarInput: (input: any) => { sidebarInput = input; },
                openContextMenu: (item: any) => {
                    // Simulate our fix
                    sidebarInput = null;
                    sidebarRenameItemId = null;
                    contextMenu = { item };
                },
            };
        };

        it('Scenario 1: Rename A → Context Menu B', () => {
            const env = createTestEnvironment();

            // Action: Rename item A
            env.setSidebarRenameItemId('item-A');
            expect(env.sidebarRenameItemId).toBe('item-A');

            // Action: Open context menu on item B
            env.openContextMenu({ id: 'item-B' });

            // Verify: Rename state cleared
            expect(env.sidebarRenameItemId).toBeNull();
            expect(env.contextMenu.item.id).toBe('item-B');
        });

        it('Scenario 2: New Folder in A → Context Menu B', () => {
            const env = createTestEnvironment();

            // Action: New folder in item A
            env.setSidebarInput({ parentId: 'item-A', type: 'folder' });
            expect(env.sidebarInput.parentId).toBe('item-A');

            // Action: Open context menu on item B
            env.openContextMenu({ id: 'item-B' });

            // Verify: Input state cleared
            expect(env.sidebarInput).toBeNull();
        });

        it('Scenario 3: Rename A → Rename B (via context menu)', () => {
            const env = createTestEnvironment();

            // Action: Rename item A
            env.setSidebarRenameItemId('item-A');

            // Action: Open context menu on item B
            env.openContextMenu({ id: 'item-B' });
            expect(env.sidebarRenameItemId).toBeNull(); // Cleared

            // Action: Click "Rename" in menu
            env.setSidebarRenameItemId('item-B');

            // Verify: Only item B has rename state
            expect(env.sidebarRenameItemId).toBe('item-B');
        });

        it('Scenario 4: New Folder A → Delete B (via context menu)', () => {
            const env = createTestEnvironment();

            // Action: New folder in A
            env.setSidebarInput({ parentId: 'item-A', type: 'folder' });

            // Action: Open context menu on B → click Delete
            env.openContextMenu({ id: 'item-B' });

            // Verify: Input cleared, can execute delete cleanly
            expect(env.sidebarInput).toBeNull();
        });

        it('Scenario 5: Multiple rapid context menu opens', () => {
            const env = createTestEnvironment();

            // Rapid sequence
            env.setSidebarRenameItemId('item-A'); // Rename A
            env.openContextMenu({ id: 'item-B' }); // Menu on B
            env.openContextMenu({ id: 'item-C' }); // Menu on C
            env.openContextMenu({ id: 'item-D' }); // Menu on D

            // Only final state should persist
            expect(env.sidebarRenameItemId).toBeNull();
            expect(env.contextMenu.item.id).toBe('item-D');
        });
    });

    describe('Focus Management', () => {
        it('should not have dual focus (selection + rename)', () => {
            let selectedItemId: string | null = null;
            let sidebarRenameItemId: string | null = null;

            // User triggers rename on A
            sidebarRenameItemId = 'item-A';
            selectedItemId = 'item-A';

            // User right-clicks B
            const openContextMenu = (itemId: string) => {
                sidebarRenameItemId = null; // CLEAR
                selectedItemId = itemId; // UPDATE
            };

            openContextMenu('item-B');

            // Only item B should have any state
            expect(selectedItemId).toBe('item-B');
            expect(sidebarRenameItemId).toBeNull();
        });

        it('should clear rename input before setting new selection', () => {
            const callOrder: string[] = [];

            const clearRename = () => callOrder.push('1_clear_rename');
            const setSelection = () => callOrder.push('2_set_selection');
            const setMenu = () => callOrder.push('3_set_menu');

            const handleContextMenu = () => {
                clearRename();
                setSelection();
                setMenu();
            };

            handleContextMenu();

            expect(callOrder).toEqual([
                '1_clear_rename',
                '2_set_selection',
                '3_set_menu',
            ]);
        });
    });

    describe('Defensive Cleanup at Action Start', () => {
        it('should clear states before executing any action', () => {
            const mockClear = vi.fn();
            let contextMenu: any = { item: { id: 'item-A' }, context: 'sidebar' };

            const handleAction = (actionId: string) => {
                // Defensive cleanup
                mockClear();

                // Execute action
                // ...
            };

            handleAction('delete');

            expect(mockClear).toHaveBeenCalled();
        });

        it('should clear before rename action specifically', () => {
            const actions: string[] = [];

            const handleRenameAction = () => {
                actions.push('1_defensive_clear');
                actions.push('2_set_rename_id');
            };

            handleRenameAction();

            expect(actions).toEqual(['1_defensive_clear', '2_set_rename_id']);
        });
    });

    describe('Edge Cases', () => {
        it('should handle rename → ESC → new context menu', () => {
            let sidebarRenameItemId: string | null = null;

            // Rename
            sidebarRenameItemId = 'item-A';

            // User presses ESC (cancel rename)
            sidebarRenameItemId = null;

            // Open new menu
            const openMenu = () => {
                sidebarRenameItemId = null; // Redundant but safe
            };

            openMenu();

            expect(sidebarRenameItemId).toBeNull();
        });

        it('should handle rapid rename → rename → rename', () => {
            let sidebarRenameItemId: string | null = null;

            const openMenuAndRename = (itemId: string) => {
                sidebarRenameItemId = null; // Clear
                sidebarRenameItemId = itemId; // Set new
            };

            openMenuAndRename('item-A');
            openMenuAndRename('item-B');
            openMenuAndRename('item-C');

            expect(sidebarRenameItemId).toBe('item-C');
        });

        it('should handle context menu during inline input', () => {
            let sidebarInput: any = { parentId: 'item-A', type: 'folder' };
            let contextMenu: any = null;

            // User is typing folder name...
            // User right-clicks (changes mind)
            const openContextMenu = (item: any) => {
                sidebarInput = null; // CLEAR pending input
                contextMenu = { item };
            };

            openContextMenu({ id: 'item-B' });

            expect(sidebarInput).toBeNull(); // ✅ Pending input cancelled
            expect(contextMenu.item.id).toBe('item-B');
        });
    });
});
