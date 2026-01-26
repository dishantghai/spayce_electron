import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableTreeItem } from '../../../src/components/drag-drop/DraggableTreeItem';
import { useDragDropUiStore } from '../../../src/stores/dragDropUiStore';
import type { SpaceItem } from '../../../src/types';
import { SpaceItemType } from '../../../src/types';

// Create a mock store that supports both direct access and selector functions
const createMockStore = (state: any) => {
    return (selector?: (state: any) => any) => {
        if (selector) {
            return selector(state);
        }
        return state;
    };
};

// Mock the drag-drop store
vi.mock('../../../src/stores/dragDropUiStore', () => ({
    useDragDropUiStore: vi.fn(),
}));

// Mock SpaceItem for testing (matching actual SpaceItem interface)
const mockFolderItem: SpaceItem = {
    id: 'folder-1',
    name: 'Test Folder',
    type: SpaceItemType.folder,
    path: '',
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
};

const mockLinkItem: SpaceItem = {
    id: 'link-1',
    name: 'Test Link',
    type: SpaceItemType.link,
    path: 'https://example.com',
    isExpanded: false,
    children: [],
    faviconUrl: 'https://example.com/favicon.ico',
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
};

const mockAccentColor = '#6D5AE6';

describe('Feature: Drag Tree Items - DraggableTreeItem Component', () => {
    let mockStartDrag: ReturnType<typeof vi.fn>;
    let mockEndDrag: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockStartDrag = vi.fn();
        mockEndDrag = vi.fn();

        (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore({
            isDragging: false,
            dragData: null,
            startDrag: mockStartDrag,
            endDrag: mockEndDrag,
        }));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('AC1: Items are draggable (both folders and links)', () => {
        it('should render children correctly', () => {
            render(
                <DraggableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div data-testid="child-content">Child Content</div>
                </DraggableTreeItem>
            );

            expect(screen.getByTestId('child-content')).toBeTruthy();
        });

        it('should have draggable attribute set to true', () => {
            render(
                <DraggableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Content</div>
                </DraggableTreeItem>
            );

            const draggableElement = screen.getByTestId('draggable-tree-item');
            expect(draggableElement.getAttribute('draggable')).toBe('true');
        });

        it('should make folder items draggable', () => {
            render(
                <DraggableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Folder Content</div>
                </DraggableTreeItem>
            );

            const draggableElement = screen.getByTestId('draggable-tree-item');
            expect(draggableElement.getAttribute('draggable')).toBe('true');
        });

        it('should make link items draggable', () => {
            render(
                <DraggableTreeItem
                    item={mockLinkItem}
                    spaceId="space-1"
                    parentId={null}
                    index={1}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Link Content</div>
                </DraggableTreeItem>
            );

            const draggableElement = screen.getByTestId('draggable-tree-item');
            expect(draggableElement.getAttribute('draggable')).toBe('true');
        });
    });

    describe('AC3: Ghost opacity on dragged item (0.4)', () => {
        it('should apply ghost opacity when dragging', () => {
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore({
                isDragging: true,
                dragData: { item: mockFolderItem },
                startDrag: mockStartDrag,
                endDrag: mockEndDrag,
            }));

            render(
                <DraggableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Content</div>
                </DraggableTreeItem>
            );

            const draggableElement = screen.getByTestId('draggable-tree-item');
            expect(draggableElement.style.opacity).toBe('0.4');
        });

        it('should have full opacity when not dragging', () => {
            render(
                <DraggableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Content</div>
                </DraggableTreeItem>
            );

            const draggableElement = screen.getByTestId('draggable-tree-item');
            expect(draggableElement.style.opacity).toBe('1');
        });
    });

    describe('AC6: Drag starts immediately on desktop (no long-press delay)', () => {
        it('should call startDrag on dragStart event', () => {
            render(
                <DraggableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Content</div>
                </DraggableTreeItem>
            );

            const draggableElement = screen.getByTestId('draggable-tree-item');

            // Create a mock dataTransfer object
            const dataTransfer = {
                setData: vi.fn(),
                setDragImage: vi.fn(),
                effectAllowed: '',
            };

            fireEvent.dragStart(draggableElement, { dataTransfer });

            expect(mockStartDrag).toHaveBeenCalledWith(expect.objectContaining({
                item: mockFolderItem,
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar',
            }));
        });

        it('should call endDrag on dragEnd event', () => {
            render(
                <DraggableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Content</div>
                </DraggableTreeItem>
            );

            const draggableElement = screen.getByTestId('draggable-tree-item');

            fireEvent.dragEnd(draggableElement);

            expect(mockEndDrag).toHaveBeenCalled();
        });
    });

    describe('AC5: Can drag multiple selected items', () => {
        it('should include selectedItems in drag data when provided', () => {
            const selectedItems = [mockFolderItem, mockLinkItem];

            render(
                <DraggableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                    selectedItems={selectedItems}
                >
                    <div>Content</div>
                </DraggableTreeItem>
            );

            const draggableElement = screen.getByTestId('draggable-tree-item');

            const dataTransfer = {
                setData: vi.fn(),
                setDragImage: vi.fn(),
                effectAllowed: '',
            };

            fireEvent.dragStart(draggableElement, { dataTransfer });

            expect(mockStartDrag).toHaveBeenCalledWith(expect.objectContaining({
                items: selectedItems,
            }));
        });

        it('should use single item when no selectedItems provided', () => {
            render(
                <DraggableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Content</div>
                </DraggableTreeItem>
            );

            const draggableElement = screen.getByTestId('draggable-tree-item');

            const dataTransfer = {
                setData: vi.fn(),
                setDragImage: vi.fn(),
                effectAllowed: '',
            };

            fireEvent.dragStart(draggableElement, { dataTransfer });

            expect(mockStartDrag).toHaveBeenCalledWith(expect.objectContaining({
                items: [mockFolderItem],
            }));
        });
    });

    describe('Drag data transfer', () => {
        it('should set drag data as JSON in dataTransfer', () => {
            render(
                <DraggableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={['ancestor-1']}
                >
                    <div>Content</div>
                </DraggableTreeItem>
            );

            const draggableElement = screen.getByTestId('draggable-tree-item');

            const dataTransfer = {
                setData: vi.fn(),
                setDragImage: vi.fn(),
                effectAllowed: '',
            };

            fireEvent.dragStart(draggableElement, { dataTransfer });

            expect(dataTransfer.setData).toHaveBeenCalledWith(
                'application/json',
                expect.any(String)
            );
        });

        it('should set effectAllowed to move', () => {
            render(
                <DraggableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Content</div>
                </DraggableTreeItem>
            );

            const draggableElement = screen.getByTestId('draggable-tree-item');

            const dataTransfer = {
                setData: vi.fn(),
                setDragImage: vi.fn(),
                effectAllowed: '',
            };

            fireEvent.dragStart(draggableElement, { dataTransfer });

            expect(dataTransfer.effectAllowed).toBe('move');
        });
    });
});
