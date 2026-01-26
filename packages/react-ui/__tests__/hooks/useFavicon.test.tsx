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

        it('uses stored favicon from DB when no cache', () => {
            const storedFavicon = 'https://stored-in-db.ico';

            const { result } = renderHook(() =>
                useFavicon('https://github.com/repo', storedFavicon)
            );

            expect(result.current.faviconUrl).toBe(storedFavicon);
            expect(result.current.isLoading).toBe(false);
            // Should also cache it
            expect(getCachedFavicon('github.com')).toBe(storedFavicon);
        });

        it('falls back to Google favicon when no cache and no stored favicon', () => {
            const { result } = renderHook(() =>
                useFavicon('https://example.com/page', null)
            );

            expect(result.current.faviconUrl).toBe(
                'https://www.google.com/s2/favicons?domain=example.com&sz=32'
            );
            expect(result.current.isLoading).toBe(false);
        });

        it('caches the Google fallback URL', () => {
            renderHook(() => useFavicon('https://newsite.com/path', null));

            expect(getCachedFavicon('newsite.com')).toBe(
                'https://www.google.com/s2/favicons?domain=newsite.com&sz=32'
            );
        });
    });

    describe('callback behavior', () => {
        it('calls onFaviconResolved when favicon is resolved from fallback', () => {
            const onResolved = vi.fn();

            renderHook(() =>
                useFavicon('https://callback-test.com/page', null, onResolved)
            );

            expect(onResolved).toHaveBeenCalledWith(
                'https://www.google.com/s2/favicons?domain=callback-test.com&sz=32'
            );
        });

        it('does not call onFaviconResolved when using cached favicon', () => {
            setCachedFavicon('cached-domain.com', 'https://cached.ico');
            const onResolved = vi.fn();

            renderHook(() =>
                useFavicon('https://cached-domain.com/page', null, onResolved)
            );

            expect(onResolved).not.toHaveBeenCalled();
        });

        it('does not call onFaviconResolved when using stored favicon', () => {
            const onResolved = vi.fn();

            renderHook(() =>
                useFavicon('https://stored-domain.com/page', 'https://stored.ico', onResolved)
            );

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
                'https://www.google.com/s2/favicons?domain=first.com&sz=32'
            );

            rerender({ url: 'https://second.com', stored: null });

            await waitFor(() => {
                expect(result.current.faviconUrl).toBe(
                    'https://www.google.com/s2/favicons?domain=second.com&sz=32'
                );
            });
        });

        it('prefers stored favicon over Google fallback', () => {
            const { result } = renderHook(() =>
                useFavicon('https://prefer-stored.com', 'https://custom-stored.ico')
            );

            expect(result.current.faviconUrl).toBe('https://custom-stored.ico');
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
