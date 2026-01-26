/**
 * FaviconCache - In-memory cache for favicon URLs by domain
 * 
 * Implements LRU eviction when cache reaches capacity.
 */

interface CacheEntry {
    url: string;
    timestamp: number;
}

const MAX_CACHE_SIZE = 500;
const cache = new Map<string, CacheEntry>();

/**
 * Get cached favicon URL for a domain
 */
export function getCachedFavicon(domain: string): string | null {
    const entry = cache.get(domain);
    if (entry) {
        // Update timestamp on access (LRU)
        entry.timestamp = Date.now();
        return entry.url;
    }
    return null;
}

/**
 * Store favicon URL for a domain
 */
export function setCachedFavicon(domain: string, url: string): void {
    // LRU eviction if at capacity
    if (cache.size >= MAX_CACHE_SIZE && !cache.has(domain)) {
        const oldest = [...cache.entries()]
            .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        if (oldest) {
            cache.delete(oldest[0]);
        }
    }
    cache.set(domain, { url, timestamp: Date.now() });
}

/**
 * Clear all cached entries
 */
export function clearCache(): void {
    cache.clear();
}

/**
 * Get current cache size
 */
export function getCacheSize(): number {
    return cache.size;
}

/**
 * Extract domain from a URL, stripping www. prefix for better favicon matching
 */
export function extractDomain(url: string): string {
    if (!url) return '';
    try {
        let hostname = new URL(url).hostname;
        // Strip www. prefix for better favicon service matching
        if (hostname.startsWith('www.')) {
            hostname = hostname.slice(4);
        }
        return hostname;
    } catch {
        return '';
    }
}

/**
 * Get Google Favicon Service URL for a domain
 * Using the s2.googleusercontent.com endpoint which is more reliable
 */
export function getGoogleFaviconUrl(domain: string): string {
    return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=32`;
}

/**
 * Get DuckDuckGo Favicon Service URL for a domain
 */
export function getDuckDuckGoFaviconUrl(domain: string): string {
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}
