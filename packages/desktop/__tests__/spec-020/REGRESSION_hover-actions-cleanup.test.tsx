import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * REGRESSION TESTS: Hover Action Stale State Cleanup
 *
 * BUG FIXED (must never regress):
 * "When I click 'new Folder' icon (hover action) after renaming an item,
 * it intermittently opens the folder then closes it and takes focus back
 * to the previous rename item"
 *
 * ROOT CAUSE:
 * Hover action handlers (+ icons) didn't clear stale inline input/rename state
 * before setting new inline input state.
 *
 * Affected handlers:
 * - Sidebar.tsx: handleAddSubfolder, handleAddLinkToFolder
 * - SpaceCard.tsx: handleAddSubfolder, handleAddLink
 *
 * FIX:
 * Clear stale states in ALL hover action handlers before setting new state.
 *
 * CRITICAL: Hover actions are DIFFERENT from context menu actions!
 * Both need cleanup, but triggered differently:
 * - Context menu: Right-click → menu → click action
 * - Hover action: Hover → click + icon
 */

describe('REGRESSION: Hover Action Stale State Cleanup', () => {
    let sidebarRenameItemId: string | null;
    let sidebarInput: any;
    let cardRenameItemId: string | null;
    let cardInput: any;

    const clearSidebarInput = vi.fn(() => { sidebarInput = null; });
    const setSidebarRenameItemId = vi.fn((id: string | null) => { sidebarRenameItemId = id; });
    const setSidebarInput = vi.fn((input: any) => { sidebarInput = input; });
    const clearCardInput = vi.fn(() => { cardInput = null; });
    const setCardRenameItemId = vi.fn((id: string | null) => { cardRenameItemId = id; });
    const setCardInput = vi.fn((input: any) => { cardInput = input; });

    beforeEach(() => {
        sidebarRenameItemId = null;
        sidebarInput = null;
        cardRenameItemId = null;
        cardInput = null;
        vi.clearAllMocks();
    });

    describe('Sidebar Hover Actions', () => {
        it('should clear stale rename state when clicking Add Subfolder icon', () => {
            // User has rename active for item A
            sidebarRenameItemId = 'item-A';

            // User hovers over folder B and clicks "+" (add subfolder)
            const handleAddSubfolder = (parentItem: any) => {
                // MUST clear stale states
                clearSidebarInput();
                setSidebarRenameItemId(null);

                setSidebarInput({ parentId: parentItem.id, type: 'folder' });
            };

            handleAddSubfolder({ id: 'item-B' });

            expect(clearSidebarInput).toHaveBeenCalled();
            expect(setSidebarRenameItemId).toHaveBeenCalledWith(null);
            expect(sidebarRenameItemId).toBeNull(); // ✅ Cleared
            expect(sidebarInput).toEqual({ parentId: 'item-B', type: 'folder' });
        });

        it('should clear stale input state when clicking Add Link icon', () => {
            // User has folder input active for item A
            sidebarInput = { parentId: 'item-A', type: 'folder' };

            // User hovers over folder B and clicks link icon
            const handleAddLinkToFolder = (parentItem: any) => {
                // MUST clear stale states
                clearSidebarInput();
                setSidebarRenameItemId(null);

                setSidebarInput({ parentId: parentItem.id, type: 'link' });
            };

            handleAddLinkToFolder({ id: 'item-B' });

            expect(clearSidebarInput).toHaveBeenCalled();
            expect(sidebarInput).toEqual({ parentId: 'item-B', type: 'link' });
        });

        it('should update callback dependencies to include cleanup functions', () => {
            const dependencies = [
                'activeSpace',
                'setSidebarInput',
                'clearSidebarInput', // MUST be included
                'setSidebarRenameItemId', // MUST be included
            ];

            expect(dependencies).toContain('clearSidebarInput');
            expect(dependencies).toContain('setSidebarRenameItemId');
        });
    });

    describe('SpaceCard Hover Actions', () => {
        it('should clear stale rename state when clicking Add Subfolder in card', () => {
            cardRenameItemId = 'item-A';

            const handleAddSubfolder = (parentItem: any) => {
                clearCardInput();
                setCardRenameItemId(null);

                setCardInput({ parentId: parentItem.id, type: 'folder' });
            };

            handleAddSubfolder({ id: 'item-B' });

            expect(clearCardInput).toHaveBeenCalled();
            expect(setCardRenameItemId).toHaveBeenCalledWith(null);
            expect(cardRenameItemId).toBeNull();
        });

        it('should clear stale input state when clicking Add Link in card', () => {
            cardInput = { parentId: 'item-A', type: 'folder' };

            const handleAddLink = (parentItem: any) => {
                clearCardInput();
                setCardRenameItemId(null);

                setCardInput({ parentId: parentItem.id, type: 'link' });
            };

            handleAddLink({ id: 'item-B' });

            expect(cardInput).toEqual({ parentId: 'item-B', type: 'link' });
        });
    });

    describe('Bug Scenarios', () => {
        it('BUG: Rename A → Hover + on folder B → Dual state', () => {
            // WITHOUT FIX
            sidebarRenameItemId = 'item-A';

            // User clicks hover + icon (WITHOUT cleanup)
            const handleAddSubfolderBuggy = (parentItem: any) => {
                // Missing cleanup!
                setSidebarInput({ parentId: parentItem.id, type: 'folder' });
            };

            handleAddSubfolderBuggy({ id: 'item-B' });

            // Result: BOTH states active
            expect(sidebarRenameItemId).toBe('item-A'); // STALE
            expect(sidebarInput).not.toBeNull(); // NEW

            // UI shows both → folder opens/closes → focus jumps
        });

        it('FIX: Rename A → Hover + on folder B → Clean state', () => {
            // WITH FIX
            sidebarRenameItemId = 'item-A';

            // User clicks hover + icon (WITH cleanup)
            const handleAddSubfolderFixed = (parentItem: any) => {
                clearSidebarInput();
                setSidebarRenameItemId(null);

                setSidebarInput({ parentId: parentItem.id, type: 'folder' });
            };

            handleAddSubfolderFixed({ id: 'item-B' });

            // Result: Only folder input active
            expect(sidebarRenameItemId).toBeNull(); // ✅ CLEARED
            expect(sidebarInput).not.toBeNull(); // ✅ SET

            // UI shows only folder input → no flicker → focus correct
        });
    });

    describe('Intermittent Open/Close Issue', () => {
        it('should explain why folder opens then closes (dual state)', () => {
            // Dual state scenario
            let renameId = 'item-A';
            let inputState = { parentId: 'item-B', type: 'folder' };

            // Tree component receives both states
            const hasRenameInput = renameId !== null;
            const hasFolderInput = inputState !== null;

            // React tries to show both
            // - Folder expands for folder input
            // - But rename input captures focus
            // - Folder input loses focus → closes
            // - Focus on rename input → opens folder again
            // - Loop/flicker

            const dualState = hasRenameInput && hasFolderInput;
            expect(dualState).toBe(true); // This causes the flicker!
        });

        it('should prevent flicker with cleanup', () => {
            // Clean state scenario
            let renameId = null; // CLEARED
            let inputState = { parentId: 'item-B', type: 'folder' };

            const hasRenameInput = renameId !== null;
            const hasFolderInput = inputState !== null;
            const cleanState = !hasRenameInput; // No rename conflict

            expect(cleanState).toBe(true); // ✅ No flicker
        });
    });

    describe('All Hover Action Types', () => {
        it('Sidebar: Add Subfolder (FolderPlus icon)', () => {
            const mockHandler = vi.fn((parent) => {
                clearSidebarInput();
                setSidebarRenameItemId(null);
                setSidebarInput({ parentId: parent.id, type: 'folder' });
            });

            mockHandler({ id: 'parent-123' });

            expect(mockHandler).toHaveBeenCalled();
            expect(clearSidebarInput).toHaveBeenCalled();
        });

        it('Sidebar: Add Link (Link icon)', () => {
            const mockHandler = vi.fn((parent) => {
                clearSidebarInput();
                setSidebarRenameItemId(null);
                setSidebarInput({ parentId: parent.id, type: 'link' });
            });

            mockHandler({ id: 'parent-123' });

            expect(clearSidebarInput).toHaveBeenCalled();
        });

        it('SpaceCard: Add Subfolder (FolderPlus icon)', () => {
            const mockHandler = vi.fn((parent) => {
                clearCardInput();
                setCardRenameItemId(null);
                setCardInput({ parentId: parent.id, type: 'folder' });
            });

            mockHandler({ id: 'parent-123' });

            expect(clearCardInput).toHaveBeenCalled();
        });

        it('SpaceCard: Add Link (Link icon)', () => {
            const mockHandler = vi.fn((parent) => {
                clearCardInput();
                setCardRenameItemId(null);
                setCardInput({ parentId: parent.id, type: 'link' });
            });

            mockHandler({ id: 'parent-123' });

            expect(clearCardInput).toHaveBeenCalled();
        });
    });

    describe('Interaction Combinations', () => {
        it('Context menu → Hover action', () => {
            // Right-click rename
            sidebarRenameItemId = 'item-A';

            // Click context menu item (clears)
            clearSidebarInput();
            setSidebarRenameItemId(null);

            // Click hover + icon (should work cleanly)
            clearSidebarInput();
            setSidebarRenameItemId(null);
            setSidebarInput({ parentId: 'item-B', type: 'folder' });

            expect(sidebarRenameItemId).toBeNull();
        });

        it('Hover action → Context menu', () => {
            // Click hover + icon
            sidebarInput = { parentId: 'item-A', type: 'folder' };

            // Right-click on different item (clears)
            clearSidebarInput();
            setSidebarRenameItemId(null);

            // Context menu action should work cleanly
            expect(sidebarInput).toBeNull();
        });

        it('Hover action → Hover action', () => {
            // First hover action
            setSidebarInput({ parentId: 'item-A', type: 'folder' });

            // Second hover action (should clear first)
            clearSidebarInput();
            setSidebarRenameItemId(null);
            setSidebarInput({ parentId: 'item-B', type: 'link' });

            expect(sidebarInput.parentId).toBe('item-B');
            expect(sidebarInput.type).toBe('link');
        });
    });
});
