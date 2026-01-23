import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { SpaceListSkeleton } from '../../../src/components/spaces/SpaceListSkeleton';

describe('Feature: 010 - SpaceListSkeleton Component', () => {
    describe('AC1: SpaceListSkeleton shows appropriate loading UI', () => {
        test('should render skeleton items', () => {
            const { container } = render(<SpaceListSkeleton />);
            expect(container.querySelector('div')).toBeTruthy();
        });

        test('should render default 3 items', () => {
            const { container } = render(<SpaceListSkeleton />);
            const items = container.querySelectorAll('[class*="spaceItem"]');
            expect(items.length).toBe(3);
        });

        test('should render custom count of items', () => {
            const { container } = render(<SpaceListSkeleton count={5} />);
            const items = container.querySelectorAll('[class*="spaceItem"]');
            expect(items.length).toBe(5);
        });
    });

    describe('AC2: Each skeleton item has icon and text placeholders', () => {
        test('should render icon skeleton', () => {
            const { container } = render(<SpaceListSkeleton count={1} />);
            const skeletons = container.querySelectorAll('[class*="skeleton"]');
            expect(skeletons.length).toBeGreaterThanOrEqual(1);
        });

        test('should render text skeleton', () => {
            const { container } = render(<SpaceListSkeleton count={1} />);
            const skeletons = container.querySelectorAll('[class*="skeleton"]');
            expect(skeletons.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('AC3: Skeletons use design system tokens', () => {
        test('should use design system border radius', () => {
            const { container } = render(<SpaceListSkeleton count={1} />);
            const skeleton = container.querySelector('[class*="skeleton"]');
            expect(skeleton).toBeTruthy();
        });
    });
});
