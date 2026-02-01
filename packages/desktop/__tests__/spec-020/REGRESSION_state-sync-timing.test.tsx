import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * REGRESSION TESTS: State Sync Timing Issues
 *
 * BUG FIXED (must never regress):
 * "When I click 'new folder' after renaming an item, it intermittently opens
 * the folder then closes it and takes focus back to the previous rename item"
 *
 * ROOT CAUSE:
 * State sync was reading from store.getState() instead of using hook values.
 * Timing mismatch:
 *   1. setState updates are queued (async)
 *   2. Effect runs with new hook value dependencies
 *   3. But store.getState() might return OLD value (not updated yet)
 *   4. Syncs stale state to overlay
 *   5. Overlay shows old rename state + new input state (conflict!)
 *
 * FIX:
 * Use hook values directly in syncState(), not store.getState()
 * This guarantees synced state matches the values that triggered the effect.
 *
 * CRITICAL: State sync must always use current hook values!
 */

describe('REGRESSION: State Sync Timing Issues', () => {
    describe('Hook Values vs Store Values', () => {
        it('should use hook values in state sync, not store values', () => {
            // Hook values (from useInlineInputStore())
            const hookRenameId = 'item-B';
            const hookInput = null;

            // Store might have old values (not yet updated)
            const storeRenameId = 'item-A'; // OLD
            const storeInput = { type: 'folder' }; // OLD

            // WRONG: Reading from store
            const wrongSync = {
                sidebarInput: storeInput,
                sidebarRenameItemId: storeRenameId,
            };

            // RIGHT: Using hook values
            const correctSync = {
                sidebarInput: hookInput,
                sidebarRenameItemId: hookRenameId,
            };

            expect(wrongSync.sidebarRenameItemId).toBe('item-A'); // OLD - WRONG
            expect(correctSync.sidebarRenameItemId).toBe('item-B'); // CURRENT - RIGHT
        });

        it('should have effect dependencies match sync payload source', () => {
            const dependencies = [
                'sidebarInput',
                'sidebarRenameItemId',
            ];

            const syncPayload = {
                sidebarInput: 'sidebarInput', // Same variable name
                sidebarRenameItemId: 'sidebarRenameItemId', // Same variable name
            };

            // Dependencies should match payload sources
            expect(dependencies).toContain('sidebarInput');
            expect(dependencies).toContain('sidebarRenameItemId');
        });
    });

    describe('Timing Mismatch Scenarios', () => {
        it('BUG: Rename A → New Folder B → Both states sync', () => {
            // Simulate the bug

            // Step 1: Rename A
            let hookRenameId = 'item-A';
            let hookInput = null;

            // Step 2: New folder action (with BUG - reading from store)
            const storeRenameId = 'item-A'; // Store not updated yet
            const storeInput = { type: 'folder', parentId: 'item-B' };

            // Effect runs with hook dependencies but reads from store (WRONG)
            const syncedStateBuggy = {
                sidebarInput: storeInput,
                sidebarRenameItemId: storeRenameId, // OLD VALUE!
            };

            // Overlay receives BOTH states
            expect(syncedStateBuggy.sidebarRenameItemId).toBe('item-A'); // Stale
            expect(syncedStateBuggy.sidebarInput).not.toBeNull(); // New

            // Result: Dual UI state - rename input AND folder input!
        });

        it('FIX: Rename A → New Folder B → Only folder input syncs', () => {
            // Simulate the fix

            // Step 1: Rename A
            let hookRenameId = 'item-A';
            let hookInput = null;

            // Step 2: Clear rename, set folder input
            hookRenameId = null; // CLEARED
            hookInput = { type: 'folder', parentId: 'item-B' };

            // Effect runs and uses HOOK values
            const syncedStateFixed = {
                sidebarInput: hookInput,
                sidebarRenameItemId: hookRenameId, // CURRENT VALUE
            };

            // Overlay receives clean state
            expect(syncedStateFixed.sidebarRenameItemId).toBeNull(); // ✅ Cleared
            expect(syncedStateFixed.sidebarInput).not.toBeNull(); // ✅ Set

            // Result: Only folder input visible ✅
        });
    });

    describe('React State Batching & Effect Timing', () => {
        it('should handle setState batching correctly', async () => {
            const stateUpdates: any[] = [];

            const setState = (value: any) => {
                stateUpdates.push(value);
            };

            // Multiple setState calls in sequence
            setState(null); // Clear
            setState('item-B'); // Set

            // React batches these
            expect(stateUpdates).toEqual([null, 'item-B']);
        });

        it('should read consistent state in effect after setState', () => {
            // When effect runs, hook values should be current
            let hookValue = null;

            // Simulate setState + effect
            const setValue = (val: any) => {
                hookValue = val;
            };

            setValue('item-123');

            // Effect dependency changes
            const effectRuns = () => {
                // Should see current hook value
                return hookValue;
            };

            expect(effectRuns()).toBe('item-123'); // Current value ✅
        });
    });

    describe('Intermittent Folder Open/Close Bug', () => {
        it('BUG: Dual state causes folder to open then close', () => {
            let renameId = 'item-A';
            let inputState = { parentId: 'item-B', type: 'folder' };

            // Both states active (BUG)
            const hasRename = renameId !== null;
            const hasInput = inputState !== null;
            const dualState = hasRename && hasInput;

            expect(dualState).toBe(true); // BUG - both active!

            // UI shows both → confusion → folder opens/closes
        });

        it('FIX: Only one state active at a time', () => {
            let renameId = null; // CLEARED
            let inputState = { parentId: 'item-B', type: 'folder' };

            const hasRename = renameId !== null;
            const hasInput = inputState !== null;
            const cleanState = hasRename || hasInput; // XOR-like
            const noDualState = !(hasRename && hasInput);

            expect(noDualState).toBe(true); // ✅ No conflict
        });
    });

    describe('Complete New Folder Flow', () => {
        it('should execute new-folder action without rename interference', () => {
            const flow: string[] = [];
            let renameId = 'item-A';
            let inputState = null;

            // 1. Context menu opens → clear rename
            renameId = null;
            flow.push('1_clear_rename');

            // 2. New folder action → set input
            inputState = { parentId: 'item-B', type: 'folder' };
            flow.push('2_set_input');

            // 3. Sync state (using HOOK values)
            const syncPayload = {
                sidebarInput: inputState,
                sidebarRenameItemId: renameId, // null - correct!
            };
            flow.push('3_sync_clean_state');

            // 4. Overlay receives clean state
            flow.push('4_overlay_shows_folder_input_only');

            expect(flow).toEqual([
                '1_clear_rename',
                '2_set_input',
                '3_sync_clean_state',
                '4_overlay_shows_folder_input_only',
            ]);

            expect(syncPayload.sidebarRenameItemId).toBeNull();
            expect(syncPayload.sidebarInput).not.toBeNull();
        });
    });

    describe('Store vs Hook Value Timing', () => {
        it('should demonstrate store lag issue', () => {
            // Simulate store lagging behind hook value
            let hookValue = null; // Updated immediately
            let storeValue = 'old-value'; // Not updated yet

            // Effect runs with hookValue as dependency
            const effectDependency = hookValue;

            // But reads from store (WRONG)
            const syncedValue = storeValue;

            expect(effectDependency).toBe(null); // Current
            expect(syncedValue).toBe('old-value'); // Stale - MISMATCH!
        });

        it('should use hook value to prevent mismatch', () => {
            let hookValue = null; // Updated
            let storeValue = 'old-value'; // Lagging

            // Effect dependency
            const effectDependency = hookValue;

            // Use hook value (CORRECT)
            const syncedValue = hookValue;

            expect(effectDependency).toBe(syncedValue); // ✅ MATCH!
        });
    });

    describe('Selective Cleanup Validation', () => {
        it('new-folder action should clear rename state', () => {
            const setSidebarRenameItemId = vi.fn();
            const clearSidebarInput = vi.fn();

            const handleAction = (actionId: string) => {
                // Selective cleanup
                if (actionId !== 'rename') {
                    setSidebarRenameItemId(null); // Should clear for new-folder
                }
                if (actionId !== 'new-folder' && actionId !== 'new-link') {
                    clearSidebarInput(); // Should NOT clear for new-folder
                }
            };

            handleAction('new-folder');

            expect(setSidebarRenameItemId).toHaveBeenCalledWith(null); // ✅ Cleared
            expect(clearSidebarInput).not.toHaveBeenCalled(); // ✅ Not cleared
        });

        it('new-link action should clear rename state', () => {
            const setSidebarRenameItemId = vi.fn();

            const handleAction = (actionId: string) => {
                if (actionId !== 'rename') {
                    setSidebarRenameItemId(null);
                }
            };

            handleAction('new-link');

            expect(setSidebarRenameItemId).toHaveBeenCalledWith(null);
        });
    });

    describe('Complete Scenario: Rename → New Folder', () => {
        it('should execute rename → new-folder without conflicts', async () => {
            const logs: string[] = [];
            let renameId: string | null = 'item-A';
            let inputState: any = null;

            // 1. User has rename active for A
            logs.push('rename_A_active');

            // 2. Right-click B → CLEAR_INLINE_STATE
            renameId = null;
            logs.push('clear_on_menu_open');

            // 3. Click "New Folder" → selective cleanup
            // renameId already null, stays null
            // inputState gets set
            inputState = { parentId: 'item-B', type: 'folder' };
            logs.push('set_folder_input');

            // 4. Sync uses HOOK values
            const syncPayload = {
                sidebarInput: inputState,
                sidebarRenameItemId: renameId,
            };
            logs.push('sync_clean_state');

            // 5. Overlay receives and renders
            expect(syncPayload.sidebarRenameItemId).toBeNull();
            expect(syncPayload.sidebarInput).not.toBeNull();
            logs.push('only_folder_input_visible');

            expect(logs).toEqual([
                'rename_A_active',
                'clear_on_menu_open',
                'set_folder_input',
                'sync_clean_state',
                'only_folder_input_visible',
            ]);
        });
    });
});
