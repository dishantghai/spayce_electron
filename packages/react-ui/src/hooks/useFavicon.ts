import { useState, useEffect, useCallback } from 'react';
import {
    getCachedFavicon,
    setCachedFavicon,
    extractDomain,
    getGoogleFaviconUrl,
    getDuckDuckGoFaviconUrl,
} from '../services/FaviconCache';

export interface UseFaviconResult {
    faviconUrl: string | null;
    isLoading: boolean;
}

/**
 * Hook for lazy-loading favicons with caching
 * 
 * Always uses DuckDuckGo Favicon Service - most reliable for CORS.
 * Stored favicon URLs from websites are ignored (blocked by browser CORS).
 * 
 * Priority:
 * 1. Memory cache (instant)
 * 2. DuckDuckGo Favicon Service
 * 
 * TreeItemIcon handles fallback: DuckDuckGo -> Google -> Link icon
 * 
 * @param itemUrl - The URL of the link item
 * @param _storedFaviconUrl - Ignored (kept for API compatibility)
 * @param _onFaviconResolved - Ignored (kept for API compatibility)
 */
export function useFavicon(
    itemUrl: string,
    _storedFaviconUrl: string | null,
    _onFaviconResolved?: (url: string) => void
): UseFaviconResult {
    const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

        // 2. Use DuckDuckGo - most reliable for CORS
        const duckDuckGoUrl = getDuckDuckGoFaviconUrl(domain);
        setCachedFavicon(domain, duckDuckGoUrl);
        setFaviconUrl(duckDuckGoUrl);
        setIsLoading(false);
    }, [itemUrl]);

    return { faviconUrl, isLoading };
}
