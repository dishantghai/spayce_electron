import { useState, useEffect, useCallback } from 'react';
import {
    getCachedFavicon,
    setCachedFavicon,
    extractDomain,
    getGoogleFaviconUrl,
} from '../services/FaviconCache';

export interface UseFaviconResult {
    faviconUrl: string | null;
    isLoading: boolean;
}

/**
 * Hook for lazy-loading favicons with caching
 * 
 * Priority:
 * 1. Memory cache (instant)
 * 2. Stored favicon from DB (storedFaviconUrl)
 * 3. Google Favicon Service fallback
 * 
 * @param itemUrl - The URL of the link item
 * @param storedFaviconUrl - Favicon URL stored in database (if any)
 * @param onFaviconResolved - Callback when favicon is resolved from fallback (for async DB update)
 */
export function useFavicon(
    itemUrl: string,
    storedFaviconUrl: string | null,
    onFaviconResolved?: (url: string) => void
): UseFaviconResult {
    const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Memoize callback to avoid unnecessary effect triggers
    const stableCallback = useCallback(
        (url: string) => onFaviconResolved?.(url),
        [onFaviconResolved]
    );

    useEffect(() => {
        const domain = extractDomain(itemUrl);

        // Invalid URL - no favicon
        if (!domain) {
            setFaviconUrl(null);
            setIsLoading(false);
            return;
        }

        // 1. Check memory cache first (instant)
        const cached = getCachedFavicon(domain);
        if (cached) {
            setFaviconUrl(cached);
            setIsLoading(false);
            return;
        }

        // 2. Use stored favicon from DB
        if (storedFaviconUrl) {
            setCachedFavicon(domain, storedFaviconUrl);
            setFaviconUrl(storedFaviconUrl);
            setIsLoading(false);
            return;
        }

        // 3. Fall back to Google favicon service
        const googleUrl = getGoogleFaviconUrl(domain);
        setCachedFavicon(domain, googleUrl);
        setFaviconUrl(googleUrl);
        setIsLoading(false);

        // Notify parent to update DB async
        stableCallback(googleUrl);
    }, [itemUrl, storedFaviconUrl, stableCallback]);

    return { faviconUrl, isLoading };
}
