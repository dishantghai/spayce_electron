import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFavicon } from '../../src/hooks/useFavicon';

describe('useFavicon Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic functionality', () => {
        it('should return null faviconUrl for empty URL', () => {
            const { result } = renderHook(() => useFavicon('', null));

            expect(result.current.faviconUrl).toBeNull();
            expect(result.current.isLoading).toBe(false);
        });

        it('should return DuckDuckGo favicon URL for valid URL', () => {
            const { result } = renderHook(() => useFavicon('https://example.com', null));

            expect(result.current.faviconUrl).toContain('icons.duckduckgo.com');
            expect(result.current.faviconUrl).toContain('example.com');
            expect(result.current.isLoading).toBe(false);
        });

        it('should handle URLs with paths', () => {
            const { result } = renderHook(() => useFavicon('https://example.com/path/to/page', null));

            expect(result.current.faviconUrl).toContain('example.com');
        });

        it('should handle URLs with query params', () => {
            const { result } = renderHook(() => useFavicon('https://example.com?query=value', null));

            expect(result.current.faviconUrl).toContain('example.com');
        });
    });

    describe('Edge cases', () => {
        it('should handle localhost URLs', () => {
            const { result } = renderHook(() => useFavicon('http://localhost:3000', null));

            expect(result.current).toBeDefined();
        });

        it('should handle IP addresses', () => {
            const { result } = renderHook(() => useFavicon('http://192.168.1.1', null));

            expect(result.current).toBeDefined();
        });

        it('should handle URLs without protocol', () => {
            const { result } = renderHook(() => useFavicon('example.com', null));

            expect(result.current).toBeDefined();
        });

        it('should handle invalid URLs gracefully', () => {
            const { result } = renderHook(() => useFavicon('not-a-valid-url', null));

            expect(result.current).toBeDefined();
            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('URL changes', () => {
        it('should update favicon when URL changes', () => {
            const { result, rerender } = renderHook(
                ({ url }) => useFavicon(url, null),
                { initialProps: { url: 'https://example.com' } }
            );

            const firstFavicon = result.current.faviconUrl;

            rerender({ url: 'https://different.com' });

            expect(result.current.faviconUrl).not.toBe(firstFavicon);
            expect(result.current.faviconUrl).toContain('different.com');
        });

        it('should handle URL changing to empty string', () => {
            const { result, rerender } = renderHook(
                ({ url }) => useFavicon(url, null),
                { initialProps: { url: 'https://example.com' } }
            );

            rerender({ url: '' });

            expect(result.current.faviconUrl).toBeNull();
        });
    });

    describe('Performance', () => {
        it('should not cause excessive re-renders', () => {
            let renderCount = 0;

            const { rerender } = renderHook(
                ({ url }) => {
                    renderCount++;
                    return useFavicon(url, null);
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
