import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TreeView } from '../../src/components/TreeView';
import { TreeItem } from '../../src/components/TreeItem';
import { SpaceItemType } from '../../src/types';
import type { SpaceItem } from '../../src/types';

// Mock data factory matching actual SpaceItem type
const createMockFolder = (id: string, name: string, children: SpaceItem[] = []): SpaceItem => ({
    id,
    name,
    path: `/${name}`,
    type: SpaceItemType.folder,
    isExpanded: false,
    children,
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
});

const createMockLink = (id: string, name: string): SpaceItem => ({
    id,
    name,
    path: `/${name}`,
    type: SpaceItemType.link,
    isExpanded: false,
    children: [],
    faviconUrl: 'https://example.com/favicon.ico',
    description: 'Test link',
    visitCount: 0,
    lastVisited: null,
    createdAt: new Date(),
    isPinned: false,
    pinPosition: null,
    localPath: null,
    securityBookmark: null,
    lastSyncedAt: null,
    isWatching: false,
});

describe('TreeView', () => {
    const defaultProps = {
        items: [] as SpaceItem[],
        spaceId: 'space-1',
    };

    describe('rendering', () => {
        it('renders empty tree with aria-label', () => {
            render(<TreeView {...defaultProps} />);
            const tree = screen.getByRole('tree');
            expect(tree.getAttribute('aria-label')).toBe('Empty tree');
        });

        it('renders items in tree', () => {
            const items = [
                createMockFolder('folder-1', 'Test Folder'),
                createMockLink('link-1', 'Test Link'),
            ];
            render(<TreeView {...defaultProps} items={items} />);

            expect(screen.getByText('Test Folder')).toBeTruthy();
            expect(screen.getByText('Test Link')).toBeTruthy();
        });

        it('renders nested items when expanded', () => {
            const childLink = createMockLink('child-link', 'Child Link');
            const folder = createMockFolder('folder-1', 'Parent Folder', [childLink]);
            const expandedIds = new Set(['folder-1']);

            render(
                <TreeView
                    {...defaultProps}
                    items={[folder]}
                    expandedIds={expandedIds}
                />
            );

            expect(screen.getByText('Parent Folder')).toBeTruthy();
            expect(screen.getByText('Child Link')).toBeTruthy();
        });
    });

    describe('expand/collapse behavior', () => {
        it('calls onExpandedChange when folder is clicked', () => {
            const onExpandedChange = vi.fn();
            const folder = createMockFolder('folder-1', 'Test Folder');

            render(
                <TreeView
                    {...defaultProps}
                    items={[folder]}
                    onExpandedChange={onExpandedChange}
                />
            );

            fireEvent.click(screen.getByText('Test Folder'));
            expect(onExpandedChange).toHaveBeenCalled();
        });

        it('toggles empty folder open/close state on click', () => {
            const onExpandedChange = vi.fn();
            const onItemExpand = vi.fn();
            const emptyFolder = createMockFolder('empty-folder', 'Empty Folder', []);

            render(
                <TreeView
                    {...defaultProps}
                    items={[emptyFolder]}
                    onExpandedChange={onExpandedChange}
                    onItemExpand={onItemExpand}
                />
            );

            // Click empty folder - should still toggle
            fireEvent.click(screen.getByText('Empty Folder'));

            // onItemExpand should be called with the folder and expanded=true
            expect(onItemExpand).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'empty-folder' }),
                true
            );
        });

        it('collapses expanded empty folder on second click', () => {
            const onItemExpand = vi.fn();
            const emptyFolder = createMockFolder('empty-folder', 'Empty Folder', []);
            const expandedIds = new Set(['empty-folder']);

            render(
                <TreeView
                    {...defaultProps}
                    items={[emptyFolder]}
                    expandedIds={expandedIds}
                    onItemExpand={onItemExpand}
                />
            );

            fireEvent.click(screen.getByText('Empty Folder'));

            // Should collapse (expanded=false)
            expect(onItemExpand).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'empty-folder' }),
                false
            );
        });
    });

    describe('selection and focus', () => {
        it('applies selected class to selectedId item', () => {
            const link = createMockLink('link-1', 'Test Link');

            render(
                <TreeView
                    {...defaultProps}
                    items={[link]}
                    selectedId="link-1"
                />
            );

            const treeItem = screen.getByRole('treeitem');
            expect(treeItem.getAttribute('aria-selected')).toBe('true');
        });

        it('calls onItemClick when item is clicked', () => {
            const onItemClick = vi.fn();
            const link = createMockLink('link-1', 'Test Link');

            render(
                <TreeView
                    {...defaultProps}
                    items={[link]}
                    onItemClick={onItemClick}
                />
            );

            fireEvent.click(screen.getByText('Test Link'));
            expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'link-1' }));
        });
    });

    describe('context menu', () => {
        it('calls onItemContextMenu on right-click', () => {
            const onItemContextMenu = vi.fn();
            const link = createMockLink('link-1', 'Test Link');

            render(
                <TreeView
                    {...defaultProps}
                    items={[link]}
                    onItemContextMenu={onItemContextMenu}
                />
            );

            fireEvent.contextMenu(screen.getByText('Test Link'));
            expect(onItemContextMenu).toHaveBeenCalled();
        });
    });
});

describe('TreeItem', () => {
    const defaultProps = {
        item: createMockFolder('folder-1', 'Test Folder'),
        depth: 0,
        selectedId: null,
        activeId: null,
        expandedIds: new Set<string>(),
        accentColor: '#6D5AE6',
        spaceId: 'space-1',
    };

    describe('child item highlight offset', () => {
        it('applies treeItemChild class for depth > 0', () => {
            const childItem = createMockLink('child-1', 'Child Item');

            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={childItem}
                    depth={1}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]');
            expect(treeItem?.className).toContain('treeItemChild');
        });

        it('does not apply treeItemChild class for depth 0', () => {
            const { container } = render(
                <TreeItem {...defaultProps} depth={0} />
            );

            const treeItem = container.querySelector('[role="treeitem"]');
            expect(treeItem?.className).not.toContain('treeItemChild');
        });

        it('sets --child-highlight-offset CSS variable for child items', () => {
            const childItem = createMockLink('child-1', 'Child Item');

            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={childItem}
                    depth={1}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            const style = treeItem?.style;
            expect(style?.getPropertyValue('--child-highlight-offset')).toBeTruthy();
        });
    });

    describe('folder expand/collapse', () => {
        it('calls onItemExpand for empty folder click', () => {
            const onItemExpand = vi.fn();
            const emptyFolder = createMockFolder('empty-folder', 'Empty Folder', []);

            render(
                <TreeItem
                    {...defaultProps}
                    item={emptyFolder}
                    onItemExpand={onItemExpand}
                />
            );

            fireEvent.click(screen.getByText('Empty Folder'));
            expect(onItemExpand).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'empty-folder' }),
                true
            );
        });

        it('calls onItemExpand for folder with children', () => {
            const onItemExpand = vi.fn();
            const childLink = createMockLink('child-1', 'Child');
            const folder = createMockFolder('folder-1', 'Folder', [childLink]);

            render(
                <TreeItem
                    {...defaultProps}
                    item={folder}
                    onItemExpand={onItemExpand}
                />
            );

            fireEvent.click(screen.getByText('Folder'));
            expect(onItemExpand).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'folder-1' }),
                true
            );
        });
    });

    describe('aria attributes', () => {
        it('sets aria-expanded for folders', () => {
            const folder = createMockFolder('folder-1', 'Test Folder');

            render(<TreeItem {...defaultProps} item={folder} />);

            const treeItem = screen.getByRole('treeitem');
            expect(treeItem.getAttribute('aria-expanded')).toBe('false');
        });

        it('does not set aria-expanded for non-folders', () => {
            const link = createMockLink('link-1', 'Test Link');

            render(<TreeItem {...defaultProps} item={link} />);

            const treeItem = screen.getByRole('treeitem');
            expect(treeItem.getAttribute('aria-expanded')).toBeNull();
        });
    });
});
