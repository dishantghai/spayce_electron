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

            expect(screen.getByRole('treeitem', { name: /Test Folder/i })).toBeTruthy();
            expect(screen.getByRole('treeitem', { name: /Test Link/i })).toBeTruthy();
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

            expect(screen.getByRole('treeitem', { name: /Parent Folder/i })).toBeTruthy();
            expect(screen.getByRole('treeitem', { name: /Child Link/i })).toBeTruthy();
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

            const folderElement = screen.getByRole('treeitem', { name: /Test Folder/i });
            fireEvent.click(folderElement);
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
            const folderElement = screen.getByRole('treeitem', { name: /Empty Folder/i });
            fireEvent.click(folderElement);

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

            const folderElement = screen.getByRole('treeitem', { name: /Empty Folder/i });
            fireEvent.click(folderElement);

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

            const linkElement = screen.getByRole('treeitem', { name: /Test Link/i });
            fireEvent.click(linkElement);
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

            const treeItem = screen.getByRole('treeitem');
            fireEvent.contextMenu(treeItem);

            expect(onItemContextMenu).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'link-1' }),
                expect.any(Object)
            );
        });

        it('calls onItemClick when context menu is opened to set focus', () => {
            const onItemClick = vi.fn();
            const onItemContextMenu = vi.fn();
            const link = createMockLink('link-1', 'Test Link');

            render(
                <TreeView
                    {...defaultProps}
                    items={[link]}
                    onItemClick={onItemClick}
                    onItemContextMenu={onItemContextMenu}
                />
            );

            const treeItem = screen.getByRole('treeitem');
            fireEvent.contextMenu(treeItem);

            // Should call onItemClick to set focus before opening context menu
            expect(onItemClick).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'link-1' })
            );
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

    describe('item padding alignment', () => {
        it('applies correct padding for depth 0 (root)', () => {
            const { container } = render(
                <TreeItem {...defaultProps} depth={0} />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            expect(treeItem.style.paddingLeft).toBe('8px');
        });

        it('applies correct padding for depth 1 (first child)', () => {
            const childItem = createMockLink('child-1', 'Child Item');

            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={childItem}
                    depth={1}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            // depth 1: 8 + (1 * 24) = 32px
            expect(treeItem.style.paddingLeft).toBe('32px');
        });

        it('applies correct padding for depth 2 (nested child)', () => {
            const childItem = createMockLink('child-2', 'Nested Child');

            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={childItem}
                    depth={2}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            // depth 2: 8 + (2 * 24) = 56px
            expect(treeItem.style.paddingLeft).toBe('56px');
        });

        it('applies correct padding for depth 3 (deeply nested)', () => {
            const childItem = createMockLink('child-3', 'Deeply Nested');

            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={childItem}
                    depth={3}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            // depth 3: 8 + (3 * 24) = 80px
            expect(treeItem.style.paddingLeft).toBe('80px');
        });

        it('child icon aligns with parent text start position', () => {
            // Parent at depth 0: padding 8px, icon 16px, margin 8px = text starts at 32px
            // Child at depth 1: padding should be 32px to align icon with parent text
            const childItem = createMockLink('child-1', 'Child');

            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={childItem}
                    depth={1}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            const childPadding = parseInt(treeItem.style.paddingLeft);

            // Parent text starts at 8 + 16 + 8 = 32px
            // Child icon should be at 32px
            expect(childPadding).toBe(32);
        });
    });

    describe('vertical line positioning', () => {
        it('positions vertical line centered with folder icon at depth 0', () => {
            const childLink = createMockLink('child-1', 'Child');
            const folder = createMockFolder('folder-1', 'Root Folder', [childLink]);
            const expandedIds = new Set(['folder-1']);

            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={folder}
                    depth={0}
                    expandedIds={expandedIds}
                />
            );

            const childrenContainer = container.querySelector('[role="group"]') as HTMLElement;
            expect(childrenContainer).toBeTruthy();

            const verticalLineLeft = childrenContainer.style.getPropertyValue('--folder-line-left');

            // Depth 0: padding 8px + 8px (half of 16px icon) = 16px
            expect(verticalLineLeft).toBe('16px');
        });

        it('positions vertical line centered with folder icon at depth 1', () => {
            const childLink = createMockLink('child-1', 'Child');
            const folder = createMockFolder('folder-1', 'Nested Folder', [childLink]);
            const expandedIds = new Set(['folder-1']);

            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={folder}
                    depth={1}
                    expandedIds={expandedIds}
                />
            );

            const childrenContainer = container.querySelector('[role="group"]') as HTMLElement;
            expect(childrenContainer).toBeTruthy();

            const verticalLineLeft = childrenContainer.style.getPropertyValue('--folder-line-left');

            // Depth 1: padding 32px + 8px (half of 16px icon) = 40px
            expect(verticalLineLeft).toBe('40px');
        });

        it('positions vertical line centered with folder icon at depth 2', () => {
            const childLink = createMockLink('child-1', 'Child');
            const folder = createMockFolder('folder-2', 'Deeply Nested', [childLink]);
            const expandedIds = new Set(['folder-2']);

            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={folder}
                    depth={2}
                    expandedIds={expandedIds}
                />
            );

            const childrenContainer = container.querySelector('[role="group"]') as HTMLElement;
            expect(childrenContainer).toBeTruthy();

            const verticalLineLeft = childrenContainer.style.getPropertyValue('--folder-line-left');

            // Depth 2: padding 56px + 8px (half of 16px icon) = 64px
            expect(verticalLineLeft).toBe('64px');
        });
    });

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

        it('sets --child-highlight-offset to 0 for proper alignment', () => {
            const childItem = createMockLink('child-1', 'Child Item');

            const { container } = render(
                <TreeItem
                    {...defaultProps}
                    item={childItem}
                    depth={1}
                />
            );

            const treeItem = container.querySelector('[role="treeitem"]') as HTMLElement;
            const highlightOffset = treeItem?.style.getPropertyValue('--child-highlight-offset');
            // Should be 0px to avoid adding extra margin on top of paddingLeft
            expect(highlightOffset).toBe('0px');
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

            const folderElement = screen.getByRole('treeitem', { name: /Empty Folder/i });
            fireEvent.click(folderElement);
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

            const folderElement = screen.getByRole('treeitem', { name: /Folder/i });
            fireEvent.click(folderElement);
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
