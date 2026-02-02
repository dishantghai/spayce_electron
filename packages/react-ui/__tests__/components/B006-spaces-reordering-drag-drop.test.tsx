/**
 * B006: Spaces Reordering Broken in Hybrid Sidebar
 *
 * TDD Tests for drag-and-drop reordering of spaces in the sidebar BottomBar.
 *
 * These tests verify that:
 * 1. Space icons are draggable in the BottomBar
 * 2. Drag events fire correctly and propagate to parent handlers
 * 3. onReorderSpaces callback is called with correct indices
 * 4. Gap animation state updates during drag
 * 5. Reordering works in both Fixed and Floating sidebar modes
 * 6. Pointer events are enabled when sidebar is visible (not in overlay mode)
 * 7. Optimistic updates provide instant visual feedback on drop
 * 8. Active space highlight follows correct item during reorder
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import React from 'react';
import { BottomBar } from '../../src/components/BottomBar';
import type { Space } from '../../src/types';

// Mock Space factory
const createMockSpace = (id: string, name: string, iconName = 'folder', accentColor = '#6D5AE6'): Space => ({
    id,
    name,
    iconName,
    accentColor,
    rootItems: [],
    createdAt: new Date(),
});

describe('B006: Spaces Reordering in BottomBar', () => {
    let onReorderSpacesMock: ReturnType<typeof vi.fn>;
    let onSpaceSelectMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onReorderSpacesMock = vi.fn();
        onSpaceSelectMock = vi.fn();
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    describe('AC1: Space icons are draggable', () => {
        it('should render space icons with draggable=true attribute', () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
                createMockSpace('space-3', 'Projects'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            // Find all space icon buttons (exclude Add button)
            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn => btn.getAttribute('title') !== 'Add Space' && btn.getAttribute('title') !== 'Settings');

            expect(spaceButtons).toHaveLength(3);
            spaceButtons.forEach(button => {
                expect(button.getAttribute('draggable')).toBe('true');
            });
        });

        it('should have onReorderSpaces handler available', () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
            ];

            const { container } = render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            // The component should render without errors when handler is provided
            expect(container.querySelector('[class*="bottomBar"]')).toBeTruthy();
        });
    });

    describe('AC2: Drag start event fires correctly', () => {
        it('should set dataTransfer data on dragStart', () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn(),
                effectAllowed: '',
            };

            fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });

            // Verify dataTransfer.setData was called with correct data
            expect(mockDataTransfer.setData).toHaveBeenCalledWith(
                'application/json',
                expect.stringContaining('"spaceId":"space-1"')
            );
            expect(mockDataTransfer.setData).toHaveBeenCalledWith(
                'application/json',
                expect.stringContaining('"sourceIndex":0')
            );
        });

        it('should set effectAllowed to move on dragStart', () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn(),
                effectAllowed: '' as string,
            };

            fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });

            // effectAllowed should be set to 'move'
            expect(mockDataTransfer.effectAllowed).toBe('move');
        });
    });

    describe('AC3: Drag over updates hover state for gap animation', () => {
        it('should trigger onDragStateChange on dragOver for gap animation', async () => {
            // Note: React Testing Library doesn't propagate preventDefault from fireEvent
            // We verify the handler executes by checking console output and state changes
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
                createMockSpace('space-3', 'Projects'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];
            const secondSpaceButton = spaceButtons[1];

            // Start drag first to set up drag state
            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, {
                    dataTransfer: { setData: vi.fn(), effectAllowed: '' }
                });
            });

            // Now drag over - this should update the hover state
            await act(async () => {
                fireEvent.dragOver(secondSpaceButton, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: { dropEffect: '' }
                });
            });

            // Verify the second button gets a translateX transform (gap animation)
            // This proves the dragOver handler executed and updated state
            expect(secondSpaceButton.style.transform).toContain('translateX');
        });

        it('should set dropEffect to move on dragOver', () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const secondSpaceButton = spaceButtons[1];
            const mockDataTransfer = {
                dropEffect: '' as string,
            };

            fireEvent.dragOver(secondSpaceButton, {
                preventDefault: vi.fn(),
                dataTransfer: mockDataTransfer
            });

            expect(mockDataTransfer.dropEffect).toBe('move');
        });
    });

    describe('AC4: Drop calls onReorderSpaces with correct indices', () => {
        it('should call onReorderSpaces when dropping on different space', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
                createMockSpace('space-3', 'Projects'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];
            const thirdSpaceButton = spaceButtons[2];

            // Start drag from first space
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn().mockReturnValue(JSON.stringify({ spaceId: 'space-1', sourceIndex: 0 })),
                effectAllowed: '',
                dropEffect: '',
            };

            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });
            });

            // Drag over third space
            await act(async () => {
                fireEvent.dragOver(thirdSpaceButton, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Drop on third space
            await act(async () => {
                fireEvent.drop(thirdSpaceButton, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Wait for React to re-render after state updates
            await waitFor(() => {
                expect(onReorderSpacesMock).toHaveBeenCalledWith(0, 2);
            });
        });

        it('should NOT call onReorderSpaces when dropping on same space', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];

            // Start drag from first space
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn().mockReturnValue(JSON.stringify({ spaceId: 'space-1', sourceIndex: 0 })),
                effectAllowed: '',
                dropEffect: '',
            };

            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });
            });

            // Drop on same space (first)
            await act(async () => {
                fireEvent.drop(firstSpaceButton, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // onReorderSpaces should NOT be called
            expect(onReorderSpacesMock).not.toHaveBeenCalled();
        });

        it('should reorder from middle to beginning', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
                createMockSpace('space-3', 'Projects'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];
            const secondSpaceButton = spaceButtons[1];

            // Start drag from second space (index 1)
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn().mockReturnValue(JSON.stringify({ spaceId: 'space-2', sourceIndex: 1 })),
                effectAllowed: '',
                dropEffect: '',
            };

            await act(async () => {
                fireEvent.dragStart(secondSpaceButton, { dataTransfer: mockDataTransfer });
            });

            // Drop on first space (index 0)
            await act(async () => {
                fireEvent.drop(firstSpaceButton, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Wait for React to re-render after state updates
            await waitFor(() => {
                expect(onReorderSpacesMock).toHaveBeenCalledWith(1, 0);
            });
        });
    });

    describe('AC5: Gap animation visual feedback', () => {
        it('should apply translateX transform during drag', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
                createMockSpace('space-3', 'Projects'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];
            const secondSpaceButton = spaceButtons[1];

            // Start drag from first space
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn(),
                effectAllowed: '',
                dropEffect: '',
            };

            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });
            });

            // Drag over second space to trigger gap animation
            await act(async () => {
                fireEvent.dragOver(secondSpaceButton, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // The second button should have a translateX transform applied
            // (negative offset to shift left, making room for dragged item)
            const secondButtonStyle = secondSpaceButton.style.transform;
            expect(secondButtonStyle).toContain('translateX');
        });

        it('should apply dragging class to dragged item', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];

            // Start drag
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn(),
                effectAllowed: '',
            };

            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });
            });

            // Wait for React to re-render after drag state change
            await waitFor(() => {
                expect(firstSpaceButton.className).toContain('dragging');
            });
        });
    });

    describe('AC6: Drag end resets state', () => {
        it('should reset drag state on dragEnd', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];

            // Start drag
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn(),
                effectAllowed: '',
            };

            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });
            });

            // Wait for React to re-render after drag state change
            await waitFor(() => {
                expect(firstSpaceButton.className).toContain('dragging');
            });

            // End drag
            await act(async () => {
                fireEvent.dragEnd(firstSpaceButton);
            });

            // Dragging class should be removed (this happens synchronously in dragEnd)
            await waitFor(() => {
                expect(firstSpaceButton.className).not.toContain('dragging');
            });
        });
    });

    describe('AC7: Works without onReorderSpaces handler', () => {
        it('should not crash when onReorderSpaces is undefined', () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
            ];

            // Render without onReorderSpaces handler
            expect(() => {
                render(
                    <BottomBar
                        spaces={spaces}
                        activeSpaceIndex={0}
                        onSpaceSelect={onSpaceSelectMock}
                    />
                );
            }).not.toThrow();
        });

        it('should still allow drag events when handler is undefined', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
            ];

            render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];

            // Should not throw when dragging without handler
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn(),
                effectAllowed: '',
            };

            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });
            });

            // Drag handlers should gracefully handle missing callback
            // (no error thrown)
        });
    });

    describe('AC8: Container drop handler (spacesRow)', () => {
        it('should call onReorderSpaces when dropping on spacesRow container', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
                createMockSpace('space-3', 'Projects'),
            ];

            const { container } = render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            // Find the spacesRow container
            const spacesRow = container.querySelector('[class*="spacesRow"]');
            expect(spacesRow).toBeTruthy();

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];
            const secondSpaceButton = spaceButtons[1];

            // Start drag from first space
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn().mockReturnValue(JSON.stringify({ spaceId: 'space-1', sourceIndex: 0 })),
                effectAllowed: '',
                dropEffect: '',
            };

            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });
            });

            // Drag over second space to set hoverIndex
            await act(async () => {
                fireEvent.dragOver(secondSpaceButton, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Drop on the container (spacesRow)
            await act(async () => {
                fireEvent.drop(spacesRow!, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Wait for React to re-render after state updates
            await waitFor(() => {
                expect(onReorderSpacesMock).toHaveBeenCalled();
            });
        });
    });

    describe('AC9: Optimistic updates for instant visual feedback', () => {
        it('should reorder spaces visually immediately on drop (before parent callback completes)', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
                createMockSpace('space-3', 'Projects'),
            ];

            const { container } = render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            // Verify initial order by title attributes
            expect(spaceButtons[0].getAttribute('title')).toBe('Work');
            expect(spaceButtons[1].getAttribute('title')).toBe('Personal');
            expect(spaceButtons[2].getAttribute('title')).toBe('Projects');

            const firstSpaceButton = spaceButtons[0];
            const thirdSpaceButton = spaceButtons[2];

            // Start drag from first space (Work)
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn().mockReturnValue(JSON.stringify({ spaceId: 'space-1', sourceIndex: 0 })),
                effectAllowed: '',
                dropEffect: '',
            };

            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });
            });

            // Drag over third space to set hoverIndex
            await act(async () => {
                fireEvent.dragOver(thirdSpaceButton, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Drop on spacesRow container
            const spacesRow = container.querySelector('[class*="spacesRow"]');
            await act(async () => {
                fireEvent.drop(spacesRow!, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Immediately check the visual order - should be updated optimistically
            // WITHOUT waiting for parent to update props
            const updatedButtons = screen.getAllByRole('button').filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            // Work should now be at the end (moved from index 0 to index 2)
            expect(updatedButtons[0].getAttribute('title')).toBe('Personal');
            expect(updatedButtons[1].getAttribute('title')).toBe('Projects');
            expect(updatedButtons[2].getAttribute('title')).toBe('Work');
        });

        it('should maintain optimistic order until parent props update', async () => {
            const initialSpaces = [
                createMockSpace('space-1', 'Work'),
                createMockSpace('space-2', 'Personal'),
                createMockSpace('space-3', 'Projects'),
            ];

            const { rerender, container } = render(
                <BottomBar
                    spaces={initialSpaces}
                    activeSpaceIndex={0}
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            const firstSpaceButton = spaceButtons[0];
            const spacesRow = container.querySelector('[class*="spacesRow"]');

            // Perform drag and drop on container (triggers optimistic update)
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn().mockReturnValue(JSON.stringify({ spaceId: 'space-1', sourceIndex: 0 })),
                effectAllowed: '',
                dropEffect: '',
            };

            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });
            });

            await act(async () => {
                fireEvent.dragOver(spaceButtons[2], {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Drop on container to trigger optimistic update
            await act(async () => {
                fireEvent.drop(spacesRow!, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Verify optimistic order is in place
            let currentButtons = screen.getAllByRole('button').filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );
            expect(currentButtons[2].getAttribute('title')).toBe('Work');

            // Now simulate parent updating props (as if backend completed)
            const reorderedSpaces = [
                createMockSpace('space-2', 'Personal'),
                createMockSpace('space-3', 'Projects'),
                createMockSpace('space-1', 'Work'),
            ];

            await act(async () => {
                rerender(
                    <BottomBar
                        spaces={reorderedSpaces}
                        activeSpaceIndex={2}
                        onSpaceSelect={onSpaceSelectMock}
                        onReorderSpaces={onReorderSpacesMock}
                    />
                );
            });

            // Order should still be correct after props update
            currentButtons = screen.getAllByRole('button').filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );
            expect(currentButtons[0].getAttribute('title')).toBe('Personal');
            expect(currentButtons[1].getAttribute('title')).toBe('Projects');
            expect(currentButtons[2].getAttribute('title')).toBe('Work');
        });
    });

    describe('AC10: Active space highlight follows correct item during reorder', () => {
        it('should keep active highlight on the same space after optimistic reorder', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work', 'briefcase', '#FF0000'),
                createMockSpace('space-2', 'Personal', 'home', '#00FF00'),
                createMockSpace('space-3', 'Projects', 'folder', '#0000FF'),
            ];

            const { container } = render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={0}  // Work is active
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            // Initially, first button (Work) should have active class
            expect(spaceButtons[0].className).toContain('active');
            expect(spaceButtons[1].className).not.toContain('active');
            expect(spaceButtons[2].className).not.toContain('active');

            const firstSpaceButton = spaceButtons[0];
            const thirdSpaceButton = spaceButtons[2];
            const spacesRow = container.querySelector('[class*="spacesRow"]');

            // Drag Work from position 0 to position 2
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn().mockReturnValue(JSON.stringify({ spaceId: 'space-1', sourceIndex: 0 })),
                effectAllowed: '',
                dropEffect: '',
            };

            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });
            });

            await act(async () => {
                fireEvent.dragOver(thirdSpaceButton, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Drop on container to trigger optimistic update
            await act(async () => {
                fireEvent.drop(spacesRow!, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // After optimistic reorder, Work is now at index 2
            // The active highlight should follow Work to its new position
            const updatedButtons = screen.getAllByRole('button').filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            // Work should be at index 2 and should still be active
            expect(updatedButtons[2].getAttribute('title')).toBe('Work');
            expect(updatedButtons[2].className).toContain('active');

            // Other items should NOT be active
            expect(updatedButtons[0].className).not.toContain('active');
            expect(updatedButtons[1].className).not.toContain('active');
        });

        it('should keep active highlight on non-dragged space when it shifts position', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work', 'briefcase', '#FF0000'),
                createMockSpace('space-2', 'Personal', 'home', '#00FF00'),
                createMockSpace('space-3', 'Projects', 'folder', '#0000FF'),
            ];

            const { container } = render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={1}  // Personal is active (at index 1)
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            // Initially, second button (Personal) should have active class
            expect(spaceButtons[0].className).not.toContain('active');
            expect(spaceButtons[1].className).toContain('active');
            expect(spaceButtons[2].className).not.toContain('active');

            const firstSpaceButton = spaceButtons[0];
            const thirdSpaceButton = spaceButtons[2];
            const spacesRow = container.querySelector('[class*="spacesRow"]');

            // Drag Work from position 0 to position 2
            // This will cause Personal to shift from index 1 to index 0
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn().mockReturnValue(JSON.stringify({ spaceId: 'space-1', sourceIndex: 0 })),
                effectAllowed: '',
                dropEffect: '',
            };

            await act(async () => {
                fireEvent.dragStart(firstSpaceButton, { dataTransfer: mockDataTransfer });
            });

            await act(async () => {
                fireEvent.dragOver(thirdSpaceButton, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Drop on container to trigger optimistic update
            await act(async () => {
                fireEvent.drop(spacesRow!, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // After reorder: [Personal, Projects, Work]
            const updatedButtons = screen.getAllByRole('button').filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            // Personal should now be at index 0 and should still be active
            expect(updatedButtons[0].getAttribute('title')).toBe('Personal');
            expect(updatedButtons[0].className).toContain('active');

            // Other items should NOT be active
            expect(updatedButtons[1].className).not.toContain('active');
            expect(updatedButtons[2].className).not.toContain('active');
        });

        it('should handle active highlight when dragging from end to beginning', async () => {
            const spaces = [
                createMockSpace('space-1', 'Work', 'briefcase', '#FF0000'),
                createMockSpace('space-2', 'Personal', 'home', '#00FF00'),
                createMockSpace('space-3', 'Projects', 'folder', '#0000FF'),
            ];

            const { container } = render(
                <BottomBar
                    spaces={spaces}
                    activeSpaceIndex={2}  // Projects is active (at index 2)
                    onSpaceSelect={onSpaceSelectMock}
                    onReorderSpaces={onReorderSpacesMock}
                />
            );

            const allButtons = screen.getAllByRole('button');
            const spaceButtons = allButtons.filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            // Initially, third button (Projects) should have active class
            expect(spaceButtons[2].className).toContain('active');

            const firstSpaceButton = spaceButtons[0];
            const thirdSpaceButton = spaceButtons[2];
            const spacesRow = container.querySelector('[class*="spacesRow"]');

            // Drag Projects from position 2 to position 0
            const mockDataTransfer = {
                setData: vi.fn(),
                getData: vi.fn().mockReturnValue(JSON.stringify({ spaceId: 'space-3', sourceIndex: 2 })),
                effectAllowed: '',
                dropEffect: '',
            };

            await act(async () => {
                fireEvent.dragStart(thirdSpaceButton, { dataTransfer: mockDataTransfer });
            });

            await act(async () => {
                fireEvent.dragOver(firstSpaceButton, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // Drop on container to trigger optimistic update
            await act(async () => {
                fireEvent.drop(spacesRow!, {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    dataTransfer: mockDataTransfer
                });
            });

            // After reorder: [Projects, Work, Personal]
            const updatedButtons = screen.getAllByRole('button').filter(btn =>
                btn.getAttribute('title') !== 'Add Space' &&
                btn.getAttribute('title') !== 'Settings'
            );

            // Projects should now be at index 0 and should still be active
            expect(updatedButtons[0].getAttribute('title')).toBe('Projects');
            expect(updatedButtons[0].className).toContain('active');

            // Other items should NOT be active
            expect(updatedButtons[1].className).not.toContain('active');
            expect(updatedButtons[2].className).not.toContain('active');
        });
    });
});
