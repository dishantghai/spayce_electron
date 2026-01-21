import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Skeleton } from '../../../src/components/common/Skeleton';

describe('Feature: 010 - Skeleton Component', () => {
    describe('AC1: Skeleton component renders animated placeholder', () => {
        test('should render a div element', () => {
            const { container } = render(<Skeleton />);
            expect(container.querySelector('div')).toBeTruthy();
        });

        test('should apply skeleton CSS class', () => {
            const { container } = render(<Skeleton />);
            const div = container.querySelector('div');
            expect(div?.className).toContain('skeleton');
        });
    });

    describe('AC2: Skeleton accepts width, height, borderRadius props', () => {
        test('should apply width style', () => {
            const { container } = render(<Skeleton width="200px" />);
            const div = container.querySelector('div');
            expect(div?.style.width).toBe('200px');
        });

        test('should apply height style', () => {
            const { container } = render(<Skeleton height="50px" />);
            const div = container.querySelector('div');
            expect(div?.style.height).toBe('50px');
        });

        test('should apply borderRadius style', () => {
            const { container } = render(<Skeleton borderRadius="10px" />);
            const div = container.querySelector('div');
            expect(div?.style.borderRadius).toBe('10px');
        });

        test('should handle number values for dimensions', () => {
            const { container } = render(<Skeleton width={100} height={50} />);
            const div = container.querySelector('div');
            expect(div?.style.width).toBe('100px');
            expect(div?.style.height).toBe('50px');
        });

        test('should handle string values for dimensions', () => {
            const { container } = render(<Skeleton width="50%" height="2rem" />);
            const div = container.querySelector('div');
            expect(div?.style.width).toBe('50%');
            expect(div?.style.height).toBe('2rem');
        });
    });

    describe('AC3: Skeleton accepts className prop', () => {
        test('should apply additional className', () => {
            const { container } = render(<Skeleton className="custom-class" />);
            const div = container.querySelector('div');
            expect(div?.className).toContain('custom-class');
        });
    });

    describe('AC4: Default values', () => {
        test('should have default width of 100%', () => {
            const { container } = render(<Skeleton />);
            const div = container.querySelector('div');
            expect(div?.style.width).toBe('100%');
        });

        test('should have default height of 1rem', () => {
            const { container } = render(<Skeleton />);
            const div = container.querySelector('div');
            expect(div?.style.height).toBe('1rem');
        });
    });
});
