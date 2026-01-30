/**
 * URL Normalization Utility
 *
 * Provides URL normalization for duplicate detection.
 *
 * @see Spec 018 - Browser Domain Layer
 */

/**
 * URL normalization for duplicate detection
 *
 * Normalization rules:
 * 1. Lowercase the entire URL
 * 2. Remove protocol (http://, https://)
 * 3. Remove www. prefix
 * 4. Remove trailing slash
 * 5. Remove fragment (#...)
 * 6. Trim whitespace
 *
 * @example
 * normalizeUrl('HTTPS://WWW.Example.COM/path/') => 'example.com/path'
 * normalizeUrl('http://example.com/page#section') => 'example.com/page'
 */
export function normalizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
        return '';
    }

    let normalized = url.toLowerCase().trim();

    // Return empty for whitespace-only input
    if (normalized.length === 0) {
        return '';
    }

    // Remove protocol
    normalized = normalized
        .replace(/^https?:\/\//, '')
        .replace(/^\/\//, '');

    // Remove www. prefix (only at the start)
    if (normalized.startsWith('www.')) {
        normalized = normalized.substring(4);
    }

    // Remove fragment (must be before trailing slash removal)
    const fragmentIndex = normalized.indexOf('#');
    if (fragmentIndex !== -1) {
        normalized = normalized.substring(0, fragmentIndex);
    }

    // Remove trailing slash
    if (normalized.endsWith('/')) {
        normalized = normalized.substring(0, normalized.length - 1);
    }

    return normalized;
}

/**
 * Compare two URLs for equality after normalization
 */
export function urlsMatch(url1: string, url2: string): boolean {
    return normalizeUrl(url1) === normalizeUrl(url2);
}

/**
 * Extract domain from URL
 * @returns Domain or null if URL is invalid
 */
export function extractDomain(url: string): string | null {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return null;
    }
}

/**
 * Check if URL is secure (https)
 */
export function isSecureUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}
