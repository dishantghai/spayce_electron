import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFavicon } from '../../src/hooks/useFavicon';
import { clearCache, setCachedFavicon, getCachedFavicon } from '../../src/services/FaviconCache';

describe('useFavicon', () => {
    beforeEach(() => {
        clearCache();
    });

    describe('cache behavior', () => {
        it('returns cached favicon immediately when available', () => {
            setCachedFavicon('google.com', 'https://cached-favicon.ico');

            const { result } = renderHook(() =>
                useFavicon('https://google.com/search', null)
            );

            expect(result.current.faviconUrl).toBe('https://cached-favicon.ico');
            expect(result.current.isLoading).toBe(false);
        });

        it('ignores stored favicon and uses DuckDuckGo (CORS safety)', () => {
            const storedFavicon = 'https://github.githubassets.com/favicons/favicon-dark.svg';

            const { result } = renderHook(() =>
                useFavicon('https://github.com/repo', storedFavicon)
            );

            // Always uses DuckDuckGo regardless of stored favicon
            expect(result.current.faviconUrl).toBe('https://icons.duckduckgo.com/ip3/github.com.ico');
            expect(result.current.isLoading).toBe(false);
        });

        it('uses DuckDuckGo favicon when no cache and no stored favicon', () => {
            const { result } = renderHook(() =>
                useFavicon('https://example.com/page', null)
            );

            expect(result.current.faviconUrl).toBe(
                'https://icons.duckduckgo.com/ip3/example.com.ico'
            );
            expect(result.current.isLoading).toBe(false);
        });

        it('caches the DuckDuckGo URL', () => {
            renderHook(() => useFavicon('https://newsite.com/path', null));

            expect(getCachedFavicon('newsite.com')).toBe(
                'https://icons.duckduckgo.com/ip3/newsite.com.ico'
            );
        });
    });

    describe('callback behavior', () => {
        it('callback parameter is ignored (simplified implementation)', () => {
            const onResolved = vi.fn();

            renderHook(() =>
                useFavicon('https://callback-test.com/page', null, onResolved)
            );

            // Callback is ignored in simplified implementation
            expect(onResolved).not.toHaveBeenCalled();
        });

        it('does not call onFaviconResolved when using cached favicon', () => {
            setCachedFavicon('cached-domain.com', 'https://cached.ico');
            const onResolved = vi.fn();

            renderHook(() =>
                useFavicon('https://cached-domain.com/page', null, onResolved)
            );

            expect(onResolved).not.toHaveBeenCalled();
        });

        it('callback is ignored (API compatibility only)', () => {
            const onResolved = vi.fn();

            renderHook(() =>
                useFavicon('https://example.com/page', null, onResolved)
            );

            // Callback is ignored in simplified implementation
            expect(onResolved).not.toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('handles invalid URL gracefully', () => {
            const { result } = renderHook(() =>
                useFavicon('not-a-valid-url', null)
            );

            expect(result.current.faviconUrl).toBeNull();
            expect(result.current.isLoading).toBe(false);
        });

        it('handles empty URL', () => {
            const { result } = renderHook(() =>
                useFavicon('', null)
            );

            expect(result.current.faviconUrl).toBeNull();
            expect(result.current.isLoading).toBe(false);
        });

        it('updates when itemUrl changes', async () => {
            const { result, rerender } = renderHook(
                ({ url, stored }) => useFavicon(url, stored),
                { initialProps: { url: 'https://first.com', stored: null } }
            );

            expect(result.current.faviconUrl).toBe(
                'https://icons.duckduckgo.com/ip3/first.com.ico'
            );

            rerender({ url: 'https://second.com', stored: null });

            await waitFor(() => {
                expect(result.current.faviconUrl).toBe(
                    'https://icons.duckduckgo.com/ip3/second.com.ico'
                );
            });
        });

        it('always uses DuckDuckGo regardless of stored favicon', () => {
            const storedFavicon = 'https://example.com/custom-favicon.png';
            const { result } = renderHook(() =>
                useFavicon('https://example.com', storedFavicon)
            );

            // Stored favicon is ignored - always use DuckDuckGo
            expect(result.current.faviconUrl).toBe('https://icons.duckduckgo.com/ip3/example.com.ico');
        });

        it('prefers cache over stored favicon', () => {
            setCachedFavicon('cache-wins.com', 'https://from-cache.ico');

            const { result } = renderHook(() =>
                useFavicon('https://cache-wins.com/page', 'https://from-db.ico')
            );

            expect(result.current.faviconUrl).toBe('https://from-cache.ico');
        });
    });
});
