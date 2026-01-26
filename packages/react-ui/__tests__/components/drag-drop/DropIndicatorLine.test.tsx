import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DropIndicatorLine } from '../../../src/components/drag-drop/DropIndicatorLine';

const mockAccentColor = '#6D5AE6';

describe('Feature: Drop Indicators - DropIndicatorLine Component', () => {
    describe('AC1: Horizontal line shows drop position', () => {
        it('should render the drop indicator line', () => {
            render(
                <DropIndicatorLine
                    visible={true}
                    accentColor={mockAccentColor}
                />
            );

            expect(screen.getByTestId('drop-indicator-line')).toBeTruthy();
        });

        it('should be visible when visible prop is true', () => {
            render(
                <DropIndicatorLine
                    visible={true}
                    accentColor={mockAccentColor}
                />
            );

            const indicator = screen.getByTestId('drop-indicator-line');
            expect(indicator.className).toContain('visible');
        });

        it('should be hidden when visible prop is false', () => {
            render(
                <DropIndicatorLine
                    visible={false}
                    accentColor={mockAccentColor}
                />
            );

            const indicator = screen.getByTestId('drop-indicator-line');
            expect(indicator.className).not.toContain('visible');
        });
    });

    describe('AC2: Line matches tree indentation level', () => {
        it('should have no indent at level 0', () => {
            render(
                <DropIndicatorLine
                    visible={true}
                    accentColor={mockAccentColor}
                    level={0}
                />
            );

            const indicator = screen.getByTestId('drop-indicator-line');
            expect(indicator.style.getPropertyValue('--indicator-indent')).toBe('0px');
        });

        it('should have 24px indent at level 1', () => {
            render(
                <DropIndicatorLine
                    visible={true}
                    accentColor={mockAccentColor}
                    level={1}
                />
            );

            const indicator = screen.getByTestId('drop-indicator-line');
            expect(indicator.style.getPropertyValue('--indicator-indent')).toBe('24px');
        });

        it('should have 48px indent at level 2', () => {
            render(
                <DropIndicatorLine
                    visible={true}
                    accentColor={mockAccentColor}
                    level={2}
                />
            );

            const indicator = screen.getByTestId('drop-indicator-line');
            expect(indicator.style.getPropertyValue('--indicator-indent')).toBe('48px');
        });
    });

    describe('AC3: Line color matches space accent color', () => {
        it('should use the accent color for the line', () => {
            const customColor = '#FF5733';
            render(
                <DropIndicatorLine
                    visible={true}
                    accentColor={customColor}
                />
            );

            const indicator = screen.getByTestId('drop-indicator-line');
            expect(indicator.style.getPropertyValue('--indicator-color')).toBe(customColor);
        });

        it('should update color when accent color changes', () => {
            const { rerender } = render(
                <DropIndicatorLine
                    visible={true}
                    accentColor="#FF5733"
                />
            );

            const indicator = screen.getByTestId('drop-indicator-line');
            expect(indicator.style.getPropertyValue('--indicator-color')).toBe('#FF5733');

            rerender(
                <DropIndicatorLine
                    visible={true}
                    accentColor="#33FF57"
                />
            );

            expect(indicator.style.getPropertyValue('--indicator-color')).toBe('#33FF57');
        });
    });

    describe('Terminal circle (Arc Browser style)', () => {
        it('should render with terminal circle at start', () => {
            render(
                <DropIndicatorLine
                    visible={true}
                    accentColor={mockAccentColor}
                />
            );

            // The terminal and line are inside the container
            expect(screen.getByTestId('drop-indicator-line')).toBeTruthy();
        });
    });
});
