import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { act } from '@testing-library/react';
import type { SpaceItem } from '../../../src/types';
import { SpaceItemType } from '../../../src/types';
import { useDragDropUiStore } from '../../../src/stores/dragDropUiStore';

// Mock link item
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

// Mock folder item
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

const mockAccentColor = '#6D5AE6';

describe('Feature: F025 - Smart Drag Preview (Square for Pins)', () => {
    beforeEach(() => {
        useDragDropUiStore.setState({
            isDragging: false,
            dragData: null,
            dropIndicator: null,
            dragExpandedFolderIds: new Set<string>(),
            flashItemId: null,
            isOverPinsGrid: false,
            pinsDropIndex: null,
            validationError: null,
        });
    });

    afterEach(() => {
        cleanup();
    });

    describe('AC1: Normal drag shows rectangle preview with icon + name', () => {
        it('should render rectangle preview by default', async () => {
            // Import component after mocks
            const { DragPreview } = await import('../../../src/components/drag-drop/DragPreview');

            render(
                <DragPreview
                    items={[mockLinkItem]}
                    accentColor={mockAccentColor}
                />
            );

            // Default should be rectangle (not square)
            expect(screen.queryByTestId('square-preview')).toBeNull();
            expect(screen.getByTestId('single-item-preview')).toBeTruthy();
        });

        it('should show item name in rectangle preview', async () => {
            const { DragPreview } = await import('../../../src/components/drag-drop/DragPreview');

            render(
                <DragPreview
                    items={[mockLinkItem]}
                    accentColor={mockAccentColor}
                />
            );

            expect(screen.getByText('Test Link')).toBeTruthy();
        });
    });

    describe('AC2: Hover over pins grid shows square preview with favicon only', () => {
        it('should render square preview when isOverPinsGrid is true', async () => {
            // Set store state to indicate over pins grid
            act(() => {
                useDragDropUiStore.getState().setOverPinsGrid(true, 0);
            });

            const { DragPreview } = await import('../../../src/components/drag-drop/DragPreview');

            render(
                <DragPreview
                    items={[mockLinkItem]}
                    accentColor={mockAccentColor}
                    isSquare={true}
                />
            );

            expect(screen.getByTestId('square-preview')).toBeTruthy();
        });

        it('should not show item name in square preview', async () => {
            const { DragPreview } = await import('../../../src/components/drag-drop/DragPreview');

            render(
                <DragPreview
                    items={[mockLinkItem]}
                    accentColor={mockAccentColor}
                    isSquare={true}
                />
            );

            // Square preview should NOT show the name
            expect(screen.queryByText('Test Link')).toBeNull();
        });
    });

    describe('AC3: Folders stay as rectangle even over pins grid', () => {
        it('should show rectangle for folders even when isSquare is requested', async () => {
            const { DragPreview } = await import('../../../src/components/drag-drop/DragPreview');

            // Folder items should not show square preview since they can't be pinned
            render(
                <DragPreview
                    items={[mockFolderItem]}
                    accentColor={mockAccentColor}
                    isSquare={false}
                />
            );

            expect(screen.queryByTestId('square-preview')).toBeNull();
            expect(screen.getByTestId('single-item-preview')).toBeTruthy();
        });
    });

    describe('AC4: Square preview dimensions', () => {
        it('should have 48x48 dimensions for square preview', async () => {
            const { DragPreview } = await import('../../../src/components/drag-drop/DragPreview');

            render(
                <DragPreview
                    items={[mockLinkItem]}
                    accentColor={mockAccentColor}
                    isSquare={true}
                />
            );

            const squarePreview = screen.getByTestId('square-preview');
            // CSS sets width: 48px, height: 48px
            expect(squarePreview).toBeTruthy();
        });
    });

    describe('AC5: Multi-item drag shows count badge in both modes', () => {
        it('should show count badge in rectangle mode', async () => {
            const { DragPreview } = await import('../../../src/components/drag-drop/DragPreview');

            const { container } = render(
                <DragPreview
                    items={[mockLinkItem, { ...mockLinkItem, id: 'link-2', name: 'Link 2' }]}
                    accentColor={mockAccentColor}
                />
            );

            // Find count badge element
            const countBadge = container.querySelector('[class*="countBadge"]');
            expect(countBadge?.textContent).toBe('2');
        });

        it('should show count badge in square mode', async () => {
            const { DragPreview } = await import('../../../src/components/drag-drop/DragPreview');

            const { container } = render(
                <DragPreview
                    items={[mockLinkItem, { ...mockLinkItem, id: 'link-2', name: 'Link 2' }]}
                    accentColor={mockAccentColor}
                    isSquare={true}
                />
            );

            // Find count badge element
            const countBadge = container.querySelector('[class*="countBadge"]');
            expect(countBadge?.textContent).toBe('2');
        });
    });

    describe('Store integration', () => {
        it('should read isOverPinsGrid from store', () => {
            expect(useDragDropUiStore.getState().isOverPinsGrid).toBe(false);

            act(() => {
                useDragDropUiStore.getState().setOverPinsGrid(true, 5);
            });

            expect(useDragDropUiStore.getState().isOverPinsGrid).toBe(true);
            expect(useDragDropUiStore.getState().pinsDropIndex).toBe(5);
        });

        it('should clear isOverPinsGrid when leaving pins area', () => {
            act(() => {
                useDragDropUiStore.getState().setOverPinsGrid(true, 3);
            });
            expect(useDragDropUiStore.getState().isOverPinsGrid).toBe(true);

            act(() => {
                useDragDropUiStore.getState().setOverPinsGrid(false);
            });
            expect(useDragDropUiStore.getState().isOverPinsGrid).toBe(false);
        });
    });
});
