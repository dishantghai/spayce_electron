/**
 * URL utility functions for link handling
 */

/**
 * Normalizes a URL by adding https:// if no protocol is present
 */
export function normalizeUrl(input: string): string {
    const trimmed = input.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    return `https://${trimmed}`;
}

/**
 * Extracts the hostname from a URL
 */
export function extractDomain(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

/**
 * Checks if a string looks like a URL
 */
export function isLikelyUrl(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();

    // Check for explicit protocol
    if (/^https?:\/\//i.test(trimmed)) {
        return true;
    }

    // Check for domain-like pattern (contains dot, no spaces)
    if (/\.[a-z]{2,}/i.test(trimmed) && !/\s/.test(trimmed)) {
        return true;
    }

    return false;
}

/**
 * Generates a favicon URL for a given URL
 * Uses the origin + /favicon.ico pattern
 */
export function getFaviconUrl(url: string): string {
    try {
        const parsedUrl = new URL(url);
        return `${parsedUrl.origin}/favicon.ico`;
    } catch {
        return '';
    }
}

/**
 * Gets a Google favicon service URL as fallback
 */
export function getGoogleFaviconUrl(url: string): string {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
        return '';
    }
}
