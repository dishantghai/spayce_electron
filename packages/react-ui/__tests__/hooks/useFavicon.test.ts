import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFavicon } from '../../src/hooks/useFavicon';

describe('useFavicon Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic functionality', () => {
        it('should return default favicon for null URL', () => {
            const { result } = renderHook(() => useFavicon(null));

            expect(result.current).toBe('/default-favicon.svg');
        });

        it('should return default favicon for empty URL', () => {
            const { result } = renderHook(() => useFavicon(''));

            expect(result.current).toBe('/default-favicon.svg');
        });

        it('should generate Google favicon URL for valid URL', () => {
            const { result } = renderHook(() => useFavicon('https://example.com'));

            expect(result.current).toContain('google.com/s2/favicons');
            expect(result.current).toContain('domain=example.com');
        });

        it('should handle URLs with paths', () => {
            const { result } = renderHook(() => useFavicon('https://example.com/path/to/page'));

            expect(result.current).toContain('domain=example.com');
        });

        it('should handle URLs with query params', () => {
            const { result } = renderHook(() => useFavicon('https://example.com?query=value'));

            expect(result.current).toContain('domain=example.com');
        });
    });

    describe('Edge cases', () => {
        it('should handle localhost URLs', () => {
            const { result } = renderHook(() => useFavicon('http://localhost:3000'));

            expect(result.current).toBeDefined();
        });

        it('should handle IP addresses', () => {
            const { result } = renderHook(() => useFavicon('http://192.168.1.1'));

            expect(result.current).toBeDefined();
        });

        it('should handle URLs without protocol', () => {
            const { result } = renderHook(() => useFavicon('example.com'));

            // Should still work or fall back gracefully
            expect(result.current).toBeDefined();
        });

        it('should handle invalid URLs gracefully', () => {
            const { result } = renderHook(() => useFavicon('not-a-valid-url'));

            expect(result.current).toBeDefined();
        });
    });

    describe('URL changes', () => {
        it('should update favicon when URL changes', () => {
            const { result, rerender } = renderHook(
                ({ url }) => useFavicon(url),
                { initialProps: { url: 'https://example.com' } }
            );

            const firstFavicon = result.current;

            rerender({ url: 'https://different.com' });

            expect(result.current).not.toBe(firstFavicon);
            expect(result.current).toContain('domain=different.com');
        });

        it('should handle URL changing to null', () => {
            const { result, rerender } = renderHook(
                ({ url }) => useFavicon(url),
                { initialProps: { url: 'https://example.com' } }
            );

            rerender({ url: null });

            expect(result.current).toBe('/default-favicon.svg');
        });
    });

    describe('Performance', () => {
        it('should not cause excessive re-renders', () => {
            let renderCount = 0;

            const { rerender } = renderHook(
                ({ url }) => {
                    renderCount++;
                    return useFavicon(url);
                },
                { initialProps: { url: 'https://example.com' } }
            );

            const initialRenderCount = renderCount;

            // Rerender with same URL
            rerender({ url: 'https://example.com' });

            // Should not cause additional renders beyond normal React behavior
            expect(renderCount).toBeLessThanOrEqual(initialRenderCount + 2);
        });
    });
});
