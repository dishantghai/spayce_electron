import { describe, it, expect, beforeEach } from 'vitest';
import {
    getCachedFavicon,
    setCachedFavicon,
    clearCache,
    extractDomain,
    getGoogleFaviconUrl,
    getDuckDuckGoFaviconUrl,
    getCacheSize,
} from '../../src/services/FaviconCache';

describe('FaviconCache', () => {
    beforeEach(() => {
        clearCache();
    });

    describe('getCachedFavicon', () => {
        it('returns null for unknown domain', () => {
            expect(getCachedFavicon('unknown.com')).toBeNull();
        });

        it('returns cached favicon for known domain', () => {
            setCachedFavicon('google.com', 'https://google.com/favicon.ico');
            expect(getCachedFavicon('google.com')).toBe('https://google.com/favicon.ico');
        });
    });

    describe('setCachedFavicon', () => {
        it('stores and retrieves favicon', () => {
            setCachedFavicon('github.com', 'https://github.com/favicon.ico');
            expect(getCachedFavicon('github.com')).toBe('https://github.com/favicon.ico');
        });

        it('overwrites existing favicon for same domain', () => {
            setCachedFavicon('example.com', 'https://old.ico');
            setCachedFavicon('example.com', 'https://new.ico');
            expect(getCachedFavicon('example.com')).toBe('https://new.ico');
        });

        it('evicts oldest entry when at capacity', () => {
            // Fill cache to capacity (MAX_CACHE_SIZE = 500)
            for (let i = 0; i < 500; i++) {
                setCachedFavicon(`domain${i}.com`, `https://domain${i}.com/favicon.ico`);
            }
            expect(getCacheSize()).toBe(500);

            // Add one more - should evict oldest (domain0.com)
            setCachedFavicon('newdomain.com', 'https://newdomain.com/favicon.ico');
            expect(getCacheSize()).toBe(500);
            expect(getCachedFavicon('domain0.com')).toBeNull();
            expect(getCachedFavicon('newdomain.com')).toBe('https://newdomain.com/favicon.ico');
        });
    });

    describe('extractDomain', () => {
        it('extracts domain from full URL', () => {
            expect(extractDomain('https://google.com/search?q=test')).toBe('google.com');
        });

        it('extracts domain from URL with www prefix (strips www.)', () => {
            expect(extractDomain('https://www.github.com/user/repo')).toBe('github.com');
        });

        it('preserves non-www subdomains', () => {
            expect(extractDomain('https://mail.google.com/inbox')).toBe('mail.google.com');
        });

        it('extracts domain from URL with port', () => {
            expect(extractDomain('http://localhost:3000/path')).toBe('localhost');
        });

        it('returns empty string for invalid URL', () => {
            expect(extractDomain('not a url')).toBe('');
        });

        it('returns empty string for empty input', () => {
            expect(extractDomain('')).toBe('');
        });
    });

    describe('getGoogleFaviconUrl', () => {
        it('returns correct Google favicon URL format', () => {
            expect(getGoogleFaviconUrl('google.com')).toBe(
                'https://www.google.com/s2/favicons?domain_url=https://google.com&sz=32'
            );
        });

        it('handles domain with subdomain', () => {
            expect(getGoogleFaviconUrl('mail.google.com')).toBe(
                'https://www.google.com/s2/favicons?domain_url=https://mail.google.com&sz=32'
            );
        });
    });

    describe('getDuckDuckGoFaviconUrl', () => {
        it('returns correct DuckDuckGo favicon URL format', () => {
            expect(getDuckDuckGoFaviconUrl('google.com')).toBe(
                'https://icons.duckduckgo.com/ip3/google.com.ico'
            );
        });

        it('handles domain with subdomain', () => {
            expect(getDuckDuckGoFaviconUrl('www.github.com')).toBe(
                'https://icons.duckduckgo.com/ip3/www.github.com.ico'
            );
        });
    });

    describe('clearCache', () => {
        it('removes all cached entries', () => {
            setCachedFavicon('a.com', 'https://a.com/favicon.ico');
            setCachedFavicon('b.com', 'https://b.com/favicon.ico');
            expect(getCacheSize()).toBe(2);

            clearCache();
            expect(getCacheSize()).toBe(0);
            expect(getCachedFavicon('a.com')).toBeNull();
        });
    });
});
