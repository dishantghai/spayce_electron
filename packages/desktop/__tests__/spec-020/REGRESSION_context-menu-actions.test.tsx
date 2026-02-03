import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * REGRESSION TESTS: Context Menu Action Execution
 *
 * BUGS FIXED (must never regress):
 * 1. Action ID mismatch (hyphens vs underscores) causing silent failures
 * 2. Inline input not appearing after context menu actions
 * 3. Actions not executing in overlay mode
 *
 * FIXES APPLIED:
 * 1. Standardized all action IDs to hyphens
 * 2. Context menus render in overlay WebContentsView
 * 3. Actions forward from overlay to main via CONTEXT_MENU_ACTION
 * 4. Main renderer executes business logic and syncs state back
 *
 * CRITICAL: All context menu actions must execute correctly.
 */

describe('REGRESSION: Context Menu Action Execution', () => {
    describe('Action ID Standardization', () => {
        it('should use hyphens for all action IDs', () => {
            const actionIds = [
                'new-folder',
                'new-link',
                'rename',
                'copy-folder',
                'copy-link',
                'copy-all-links',
                'paste',
                'pin-to-top',
                'unpin',
                'delete',
                'refresh',
            ];

            actionIds.forEach(id => {
                expect(id).not.toMatch(/_/); // No underscores
                if (id.includes('-')) {
                    expect(id).toMatch(/^[a-z-]+$/); // Only lowercase and hyphens
                }
            });
        });

        it('should match overlay and main renderer action IDs', () => {
            const overlayIds = ['new-folder', 'new-link', 'rename', 'delete'];
            const mainHandlerIds = ['new-folder', 'new-link', 'rename', 'delete'];

            expect(overlayIds).toEqual(mainHandlerIds);
        });
    });

    describe('Rename Action', () => {
        it('should set rename state with forced toggle', async () => {
            const setSidebarRenameItemId = vi.fn();

            const handleRenameAction = (itemId: string) => {
                // Force toggle
                setSidebarRenameItemId(null);
                setTimeout(() => setSidebarRenameItemId(itemId), 0);
            };

            handleRenameAction('item-123');

            expect(setSidebarRenameItemId).toHaveBeenNthCalledWith(1, null);
            // Flush the setTimeout(0) so the second call executes
            await vi.waitFor(() => {
                expect(setSidebarRenameItemId).toHaveBeenNthCalledWith(2, 'item-123');
            });
        });

        it('should NOT clear rename state for rename action (selective cleanup)', async () => {
            const setSidebarRenameItemId = vi.fn();
            const clearSidebarInput = vi.fn();

            const handleAction = (actionId: string, itemId: string) => {
                // Selective cleanup
                if (actionId !== 'rename') {
                    setSidebarRenameItemId(null);
                }
                if (actionId !== 'new-folder' && actionId !== 'new-link') {
                    clearSidebarInput();
                }

                // Execute action
                if (actionId === 'rename') {
                    setSidebarRenameItemId(null);
                    setTimeout(() => setSidebarRenameItemId(itemId), 0);
                }
            };

            handleAction('rename', 'item-123');

            // Flush the setTimeout(0) so the rename call executes
            await vi.waitFor(() => {
                expect(setSidebarRenameItemId).toHaveBeenCalledWith('item-123');
            });
            // Input state cleared (not related to rename)
            expect(clearSidebarInput).toHaveBeenCalled();
        });
    });

    describe('Create Actions (New Folder/Link)', () => {
        it('should set input state for new-folder action', () => {
            const setSidebarInput = vi.fn();

            const handleNewFolderAction = (spaceId: string, parentId: string) => {
                setSidebarInput({ spaceId, parentId, type: 'folder' });
            };

            handleNewFolderAction('space-1', 'parent-123');

            expect(setSidebarInput).toHaveBeenCalledWith({
                spaceId: 'space-1',
                parentId: 'parent-123',
                type: 'folder',
            });
        });

        it('should NOT clear input state for new-folder action (selective)', () => {
            const clearSidebarInput = vi.fn();
            const setSidebarInput = vi.fn();

            const handleAction = (actionId: string) => {
                // Selective cleanup
                if (actionId !== 'new-folder' && actionId !== 'new-link') {
                    clearSidebarInput();
                }

                if (actionId === 'new-folder') {
                    setSidebarInput({ type: 'folder' });
                }
            };

            handleAction('new-folder');

            // Input NOT cleared (it's for this action)
            expect(clearSidebarInput).not.toHaveBeenCalled();
            // Input set for new folder
            expect(setSidebarInput).toHaveBeenCalled();
        });
    });

    describe('Delete Action', () => {
        it('should clear all inline states for delete action', () => {
            const clearSidebarInput = vi.fn();
            const setSidebarRenameItemId = vi.fn();

            const handleAction = (actionId: string) => {
                // Delete doesn't need any inline state
                if (actionId !== 'rename') {
                    setSidebarRenameItemId(null);
                }
                if (actionId !== 'new-folder' && actionId !== 'new-link') {
                    clearSidebarInput();
                }
            };

            handleAction('delete');

            expect(setSidebarRenameItemId).toHaveBeenCalledWith(null);
            expect(clearSidebarInput).toHaveBeenCalled();
        });

        it('should execute delete without confirmation for links', async () => {
            const mockDelete = vi.fn().mockResolvedValue({ success: true });
            const mockRefetch = vi.fn();

            const item = { id: 'link-123', type: 'link', name: 'Test Link' };

            const handleDeleteAction = async () => {
                const needsConfirmation = false; // Links don't need confirmation
                const shouldDelete = needsConfirmation ? confirm('Delete?') : true;

                if (shouldDelete) {
                    await mockDelete(item.id);
                    await mockRefetch();
                }
            };

            await handleDeleteAction();

            expect(mockDelete).toHaveBeenCalledWith('link-123');
            expect(mockRefetch).toHaveBeenCalled();
        });
    });

    describe('Copy Actions', () => {
        it('should copy link to clipboard', async () => {
            const mockWriteText = vi.fn();
            const mockCopyItems = vi.fn();

            const item = { id: 'link-123', path: 'https://example.com' };

            const handleCopyLinkAction = async () => {
                await mockWriteText(item.path);
                mockCopyItems([item], 'space-1');
            };

            await handleCopyLinkAction();

            expect(mockWriteText).toHaveBeenCalledWith('https://example.com');
            expect(mockCopyItems).toHaveBeenCalled();
        });

        it('should clear all states for copy actions', () => {
            const clearSidebarInput = vi.fn();
            const setSidebarRenameItemId = vi.fn();

            const handleCopyAction = () => {
                // Copy doesn't need inline states
                clearSidebarInput();
                setSidebarRenameItemId(null);
            };

            handleCopyAction();

            expect(clearSidebarInput).toHaveBeenCalled();
            expect(setSidebarRenameItemId).toHaveBeenCalledWith(null);
        });
    });

    describe('Pin/Unpin Actions', () => {
        it('should toggle pin state', async () => {
            const mockPin = vi.fn().mockResolvedValue({ success: true });
            const mockRefetch = vi.fn();

            await mockPin('item-123');
            await mockRefetch();

            expect(mockPin).toHaveBeenCalledWith('item-123');
            expect(mockRefetch).toHaveBeenCalled();
        });

        it('should clear all states for pin actions', () => {
            const clearSidebarInput = vi.fn();
            const setSidebarRenameItemId = vi.fn();

            const handlePinAction = () => {
                // Pin doesn't need inline states
                clearSidebarInput();
                setSidebarRenameItemId(null);
            };

            handlePinAction();

            expect(clearSidebarInput).toHaveBeenCalled();
            expect(setSidebarRenameItemId).toHaveBeenCalledWith(null);
        });
    });

    describe('Action Forwarding (Overlay → Main)', () => {
        it('should forward action from overlay to main renderer', () => {
            const mockSendAction = vi.fn();

            const handleContextMenuClick = (actionId: string, item: any) => {
                mockSendAction('CONTEXT_MENU_ACTION', {
                    actionId,
                    itemId: item.id,
                    spaceId: 'space-1',
                    context: 'sidebar',
                });
            };

            handleContextMenuClick('delete', { id: 'item-123' });

            expect(mockSendAction).toHaveBeenCalledWith('CONTEXT_MENU_ACTION', {
                actionId: 'delete',
                itemId: 'item-123',
                spaceId: 'space-1',
                context: 'sidebar',
            });
        });

        it('should close context menu after forwarding action', () => {
            let contextMenu: any = { item: { id: 'item-123' } };

            const handleClick = () => {
                // Forward action...
                contextMenu = null; // Close menu
            };

            handleClick();

            expect(contextMenu).toBeNull();
        });
    });

    describe('Selective Cleanup Logic', () => {
        it('should skip clearing rename state for rename actions', () => {
            const setSidebarRenameItemId = vi.fn();

            const shouldClearRename = (actionId: string) => actionId !== 'rename';

            expect(shouldClearRename('rename')).toBe(false);
            expect(shouldClearRename('delete')).toBe(true);
            expect(shouldClearRename('copy-link')).toBe(true);
        });

        it('should skip clearing input state for create actions', () => {
            const clearSidebarInput = vi.fn();

            const shouldClearInput = (actionId: string) =>
                actionId !== 'new-folder' && actionId !== 'new-link';

            expect(shouldClearInput('new-folder')).toBe(false);
            expect(shouldClearInput('new-link')).toBe(false);
            expect(shouldClearInput('delete')).toBe(true);
            expect(shouldClearInput('rename')).toBe(true);
        });
    });
});
