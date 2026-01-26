import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FlashItem } from '../../../src/components/drag-drop/FlashItem';
import { useDragDropUiStore } from '../../../src/stores/dragDropUiStore';

// Create a mock store that supports both direct access and selector functions
const createMockStore = (state: any) => {
    return (selector?: (state: any) => any) => {
        if (selector) {
            return selector(state);
        }
        return state;
    };
};

vi.mock('../../../src/stores/dragDropUiStore', () => ({
    useDragDropUiStore: vi.fn(),
}));

const mockAccentColor = '#6D5AE6';

describe('Feature: Flash Animation on Drop - FlashItem Component', () => {
    let mockSetFlashItem: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockSetFlashItem = vi.fn();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    describe('AC1: Flash state management', () => {
        it('should apply flash class when flashItemId matches', () => {
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore({
                flashItemId: 'item-1',
                setFlashItem: mockSetFlashItem,
            }));

            render(
                <FlashItem itemId="item-1" accentColor={mockAccentColor}>
                    <div>Content</div>
                </FlashItem>
            );

            const flashItem = screen.getByTestId('flash-item');
            expect(flashItem.getAttribute('data-flashing')).toBe('true');
        });

        it('should not apply flash class when flashItemId does not match', () => {
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore({
                flashItemId: 'other-item',
                setFlashItem: mockSetFlashItem,
            }));

            render(
                <FlashItem itemId="item-1" accentColor={mockAccentColor}>
                    <div>Content</div>
                </FlashItem>
            );

            const flashItem = screen.getByTestId('flash-item');
            expect(flashItem.getAttribute('data-flashing')).toBe('false');
        });

        it('should not apply flash class when flashItemId is null', () => {
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore({
                flashItemId: null,
                setFlashItem: mockSetFlashItem,
            }));

            render(
                <FlashItem itemId="item-1" accentColor={mockAccentColor}>
                    <div>Content</div>
                </FlashItem>
            );

            const flashItem = screen.getByTestId('flash-item');
            expect(flashItem.getAttribute('data-flashing')).toBe('false');
        });
    });

    describe('AC2: Flash auto-clear after 700ms', () => {
        it('should auto-clear flash after 700ms', () => {
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore({
                flashItemId: 'item-1',
                setFlashItem: mockSetFlashItem,
            }));

            render(
                <FlashItem itemId="item-1" accentColor={mockAccentColor}>
                    <div>Content</div>
                </FlashItem>
            );

            expect(mockSetFlashItem).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(700);
            });

            expect(mockSetFlashItem).toHaveBeenCalledWith(null);
        });

        it('should not call setFlashItem when not flashing', () => {
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore({
                flashItemId: null,
                setFlashItem: mockSetFlashItem,
            }));

            render(
                <FlashItem itemId="item-1" accentColor={mockAccentColor}>
                    <div>Content</div>
                </FlashItem>
            );

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(mockSetFlashItem).not.toHaveBeenCalled();
        });
    });

    describe('AC3: Flash color derived from accent color', () => {
        it('should set flash color with 30% opacity when flashing', () => {
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore({
                flashItemId: 'item-1',
                setFlashItem: mockSetFlashItem,
            }));

            render(
                <FlashItem itemId="item-1" accentColor={mockAccentColor}>
                    <div>Content</div>
                </FlashItem>
            );

            const flashItem = screen.getByTestId('flash-item');
            const style = flashItem.getAttribute('style');
            // 4D is hex for ~30% opacity (77/255)
            expect(style).toContain('--flash-color: #6D5AE64D');
        });

        it('should not set flash color when not flashing', () => {
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore({
                flashItemId: null,
                setFlashItem: mockSetFlashItem,
            }));

            render(
                <FlashItem itemId="item-1" accentColor={mockAccentColor}>
                    <div>Content</div>
                </FlashItem>
            );

            const flashItem = screen.getByTestId('flash-item');
            const style = flashItem.getAttribute('style') ?? '';
            expect(style.includes('#6D5AE64D')).toBe(false);
        });
    });

    describe('AC4: Renders children correctly', () => {
        it('should render children content', () => {
            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore({
                flashItemId: null,
                setFlashItem: mockSetFlashItem,
            }));

            render(
                <FlashItem itemId="item-1" accentColor={mockAccentColor}>
                    <div data-testid="child-content">Child Content</div>
                </FlashItem>
            );

            expect(screen.getByTestId('child-content')).toBeTruthy();
            expect(screen.getByText('Child Content')).toBeTruthy();
        });
    });
});
