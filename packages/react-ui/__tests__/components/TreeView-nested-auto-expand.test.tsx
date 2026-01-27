import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TreeView } from '../../src/components/TreeView';
import { useDragDropUiStore } from '../../src/stores/dragDropUiStore';
import type { SpaceItem } from '../../src/types';
import { SpaceItemType } from '../../src/types';

/**
 * Comprehensive tests for TreeView's integration with drag-expanded folders
 * Tests the merging of expandedIds with dragExpandedFolderIds Set
 */

const createMockStore = (state: any) => {
    return (selector?: (state: any) => any) => {
        if (selector) {
            return selector(state);
        }
        return state;
    };
};

vi.mock('../../src/stores/dragDropUiStore', () => ({
    useDragDropUiStore: vi.fn(),
}));

const createMockItem = (overrides: Partial<SpaceItem> = {}): SpaceItem => ({
    id: 'item-1',
    name: 'Test Item',
    type: SpaceItemType.link,
    path: 'https://example.com',
    isExpanded: false,
    children: [],
    faviconUrl: null,
    description: null,
    visitCount: 0,
    lastVisited: null,
    createdAt: new Date(),
    isPinned: false,
    pinPosition: null,
    localPath: null,
    securityBookmark: null,
    lastSyncedAt: null,
    isWatching: false,
    ...overrides,
});

describe('TreeView - Nested Auto-Expand Integration', () => {
    beforeEach(() => {
        const mockState = {
            dragExpandedFolderIds: new Set<string>(),
        };
        (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));
    });

    describe('Merging expandedIds with dragExpandedFolderIds', () => {
        it('should use base expandedIds when no drag-expanded folders', () => {
            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
            ];

            const baseExpandedIds = new Set(['folder-1']);

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={baseExpandedIds}
                />
            );

            // TreeItem should receive the base expandedIds
            const treeItem = screen.getByRole('treeitem', { name: /Folder 1/i });
            expect(treeItem).toHaveAttribute('aria-expanded', 'true');
        });

        it('should merge single drag-expanded folder with base expandedIds', () => {
            const mockState = {
                dragExpandedFolderIds: new Set(['folder-2']),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
                createMockItem({ id: 'folder-2', type: SpaceItemType.folder, name: 'Folder 2' }),
            ];

            const baseExpandedIds = new Set(['folder-1']);

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={baseExpandedIds}
                />
            );

            // Both folders should be expanded
            const folder1 = screen.getByRole('treeitem', { name: /Folder 1/i });
            const folder2 = screen.getByRole('treeitem', { name: /Folder 2/i });

            expect(folder1).toHaveAttribute('aria-expanded', 'true');
            expect(folder2).toHaveAttribute('aria-expanded', 'true');
        });

        it('should merge multiple drag-expanded folders with base expandedIds', () => {
            const mockState = {
                dragExpandedFolderIds: new Set(['folder-2', 'folder-3', 'folder-4']),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
                createMockItem({ id: 'folder-2', type: SpaceItemType.folder, name: 'Folder 2' }),
                createMockItem({ id: 'folder-3', type: SpaceItemType.folder, name: 'Folder 3' }),
                createMockItem({ id: 'folder-4', type: SpaceItemType.folder, name: 'Folder 4' }),
            ];

            const baseExpandedIds = new Set(['folder-1']);

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={baseExpandedIds}
                />
            );

            // All four folders should be expanded
            expect(screen.getByRole('treeitem', { name: /Folder 1/i })).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByRole('treeitem', { name: /Folder 2/i })).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByRole('treeitem', { name: /Folder 3/i })).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByRole('treeitem', { name: /Folder 4/i })).toHaveAttribute('aria-expanded', 'true');
        });

        it('should handle overlapping IDs between base and drag-expanded', () => {
            const mockState = {
                dragExpandedFolderIds: new Set(['folder-1', 'folder-2']),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
                createMockItem({ id: 'folder-2', type: SpaceItemType.folder, name: 'Folder 2' }),
            ];

            const baseExpandedIds = new Set(['folder-1']); // folder-1 in both

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={baseExpandedIds}
                />
            );

            // Both should be expanded (no duplicates in Set)
            expect(screen.getByRole('treeitem', { name: /Folder 1/i })).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByRole('treeitem', { name: /Folder 2/i })).toHaveAttribute('aria-expanded', 'true');
        });

        it('should handle empty dragExpandedFolderIds Set', () => {
            const mockState = {
                dragExpandedFolderIds: new Set<string>(),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
            ];

            const baseExpandedIds = new Set(['folder-1']);

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={baseExpandedIds}
                />
            );

            expect(screen.getByRole('treeitem', { name: /Folder 1/i })).toHaveAttribute('aria-expanded', 'true');
        });
    });

    describe('Nested folder hierarchy scenarios', () => {
        it('should expand parent and child via drag-expand', () => {
            const mockState = {
                dragExpandedFolderIds: new Set(['parent-folder', 'child-folder']),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = [
                createMockItem({
                    id: 'parent-folder',
                    type: SpaceItemType.folder,
                    name: 'Parent Folder',
                    children: [
                        createMockItem({
                            id: 'child-folder',
                            type: SpaceItemType.folder,
                            name: 'Child Folder',
                        }),
                    ],
                }),
            ];

            const baseExpandedIds = new Set<string>();

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={baseExpandedIds}
                />
            );

            // Parent should be expanded
            const parent = screen.getByRole('treeitem', { name: /Parent Folder/i });
            expect(parent).toHaveAttribute('aria-expanded', 'true');

            // Child should be visible and expanded
            const child = screen.getByRole('treeitem', { name: /Child Folder/i });
            expect(child).toBeInTheDocument();
            expect(child).toHaveAttribute('aria-expanded', 'true');
        });

        it('should expand deeply nested folders (5 levels)', () => {
            const mockState = {
                dragExpandedFolderIds: new Set([
                    'level-1',
                    'level-2',
                    'level-3',
                    'level-4',
                    'level-5',
                ]),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = [
                createMockItem({
                    id: 'level-1',
                    type: SpaceItemType.folder,
                    name: 'Level 1',
                    children: [
                        createMockItem({
                            id: 'level-2',
                            type: SpaceItemType.folder,
                            name: 'Level 2',
                            children: [
                                createMockItem({
                                    id: 'level-3',
                                    type: SpaceItemType.folder,
                                    name: 'Level 3',
                                    children: [
                                        createMockItem({
                                            id: 'level-4',
                                            type: SpaceItemType.folder,
                                            name: 'Level 4',
                                            children: [
                                                createMockItem({
                                                    id: 'level-5',
                                                    type: SpaceItemType.folder,
                                                    name: 'Level 5',
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ];

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={new Set()}
                />
            );

            // All levels should be expanded
            expect(screen.getByRole('treeitem', { name: /Level 1/i })).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByRole('treeitem', { name: /Level 2/i })).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByRole('treeitem', { name: /Level 3/i })).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByRole('treeitem', { name: /Level 4/i })).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByRole('treeitem', { name: /Level 5/i })).toHaveAttribute('aria-expanded', 'true');
        });

        it('should keep parent expanded when child is drag-expanded', () => {
            const mockState = {
                dragExpandedFolderIds: new Set(['child-folder']),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = [
                createMockItem({
                    id: 'parent-folder',
                    type: SpaceItemType.folder,
                    name: 'Parent Folder',
                    children: [
                        createMockItem({
                            id: 'child-folder',
                            type: SpaceItemType.folder,
                            name: 'Child Folder',
                        }),
                    ],
                }),
            ];

            // Parent already expanded via base
            const baseExpandedIds = new Set(['parent-folder']);

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={baseExpandedIds}
                />
            );

            // Parent should still be expanded
            const parent = screen.getByRole('treeitem', { name: /Parent Folder/i });
            expect(parent).toHaveAttribute('aria-expanded', 'true');

            // Child should be expanded via drag
            const child = screen.getByRole('treeitem', { name: /Child Folder/i });
            expect(child).toHaveAttribute('aria-expanded', 'true');
        });
    });

    describe('Uncontrolled mode', () => {
        it('should merge dragExpandedFolderIds with internal expandedIds', () => {
            const mockState = {
                dragExpandedFolderIds: new Set(['folder-2']),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
                createMockItem({ id: 'folder-2', type: SpaceItemType.folder, name: 'Folder 2' }),
            ];

            // No expandedIds prop - uncontrolled mode
            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                />
            );

            // folder-2 should be expanded via drag
            const folder2 = screen.getByRole('treeitem', { name: /Folder 2/i });
            expect(folder2).toHaveAttribute('aria-expanded', 'true');
        });
    });

    describe('Edge cases', () => {
        it('should handle empty items array', () => {
            const mockState = {
                dragExpandedFolderIds: new Set(['folder-1']),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const { container } = render(
                <TreeView
                    items={[]}
                    spaceId="space-1"
                    expandedIds={new Set()}
                />
            );

            expect(container.querySelector('[role="tree"]')).toBeInTheDocument();
        });

        it('should handle drag-expanded folder not in tree', () => {
            const mockState = {
                dragExpandedFolderIds: new Set(['non-existent-folder']),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
            ];

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={new Set()}
                />
            );

            // Should not crash, folder-1 should not be expanded
            const folder1 = screen.getByRole('treeitem', { name: /Folder 1/i });
            expect(folder1).toHaveAttribute('aria-expanded', 'false');
        });

        it('should handle very large dragExpandedFolderIds Set', () => {
            const largeFolderSet = new Set(
                Array.from({ length: 100 }, (_, i) => `folder-${i}`)
            );

            const mockState = {
                dragExpandedFolderIds: largeFolderSet,
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = Array.from({ length: 100 }, (_, i) =>
                createMockItem({
                    id: `folder-${i}`,
                    type: SpaceItemType.folder,
                    name: `Folder ${i}`,
                })
            );

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={new Set()}
                />
            );

            // All 100 folders should be expanded
            const expandedItems = screen.getAllByRole('treeitem').filter(
                item => item.getAttribute('aria-expanded') === 'true'
            );
            expect(expandedItems).toHaveLength(100);
        });

        it('should not mutate original base expandedIds', () => {
            const mockState = {
                dragExpandedFolderIds: new Set(['folder-2']),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
                createMockItem({ id: 'folder-2', type: SpaceItemType.folder, name: 'Folder 2' }),
            ];

            const baseExpandedIds = new Set(['folder-1']);
            const originalSize = baseExpandedIds.size;
            const originalHasFolder1 = baseExpandedIds.has('folder-1');

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={baseExpandedIds}
                />
            );

            // Original Set should be unchanged
            expect(baseExpandedIds.size).toBe(originalSize);
            expect(baseExpandedIds.has('folder-1')).toBe(originalHasFolder1);
            expect(baseExpandedIds.has('folder-2')).toBe(false);
        });
    });

    describe('Reactivity to dragExpandedFolderIds changes', () => {
        it('should update when dragExpandedFolderIds changes', () => {
            const mockState = {
                dragExpandedFolderIds: new Set<string>(),
            };
            const mockStoreImpl = createMockStore(mockState);
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockStoreImpl);

            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
            ];

            const { rerender } = render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={new Set()}
                />
            );

            // Initially collapsed
            let folder1 = screen.getByRole('treeitem', { name: /Folder 1/i });
            expect(folder1).toHaveAttribute('aria-expanded', 'false');

            // Update drag-expanded folders
            mockState.dragExpandedFolderIds = new Set(['folder-1']);
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
                createMockStore(mockState)
            );

            rerender(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={new Set()}
                />
            );

            // Now expanded
            folder1 = screen.getByRole('treeitem', { name: /Folder 1/i });
            expect(folder1).toHaveAttribute('aria-expanded', 'true');
        });

        it('should update when folder is removed from dragExpandedFolderIds', () => {
            const mockState = {
                dragExpandedFolderIds: new Set(['folder-1']),
            };
            const mockStoreImpl = createMockStore(mockState);
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockStoreImpl);

            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
            ];

            const { rerender } = render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={new Set()}
                />
            );

            // Initially expanded
            let folder1 = screen.getByRole('treeitem', { name: /Folder 1/i });
            expect(folder1).toHaveAttribute('aria-expanded', 'true');

            // Clear drag-expanded folders
            mockState.dragExpandedFolderIds = new Set();
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
                createMockStore(mockState)
            );

            rerender(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={new Set()}
                />
            );

            // Now collapsed
            folder1 = screen.getByRole('treeitem', { name: /Folder 1/i });
            expect(folder1).toHaveAttribute('aria-expanded', 'false');
        });
    });

    describe('handleItemExpand does not persist drag-expanded folders', () => {
        it('should use base expandedIds for expand/collapse operations', () => {
            const mockState = {
                dragExpandedFolderIds: new Set(['folder-1']),
            };
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
            ];

            const baseExpandedIds = new Set<string>();
            const mockOnExpandedChange = vi.fn();

            render(
                <TreeView
                    items={items}
                    spaceId="space-1"
                    expandedIds={baseExpandedIds}
                    onExpandedChange={mockOnExpandedChange}
                />
            );

            // folder-1 appears expanded via drag
            const folder1 = screen.getByRole('treeitem', { name: /Folder 1/i });
            expect(folder1).toHaveAttribute('aria-expanded', 'true');

            // Click to collapse
            folder1.click();

            // Should NOT include drag-expanded folder in new state
            // onExpandedChange should receive base Set without drag-expanded folder
            expect(mockOnExpandedChange).toHaveBeenCalled();
            const newExpandedIds = mockOnExpandedChange.mock.calls[0][0];
            expect(newExpandedIds.has('folder-1')).toBe(false);
        });
    });
});
