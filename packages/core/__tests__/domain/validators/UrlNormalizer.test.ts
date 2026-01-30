import { describe, it, expect } from 'vitest';
import {
    normalizeUrl,
    urlsMatch,
    extractDomain,
    isSecureUrl,
} from '../../../src/domain/validators/UrlNormalizer';

describe('UrlNormalizer', () => {
    describe('normalizeUrl', () => {
        describe('empty and invalid input', () => {
            it('should return empty string for null', () => {
                expect(normalizeUrl(null as unknown as string)).toBe('');
            });

            it('should return empty string for undefined', () => {
                expect(normalizeUrl(undefined as unknown as string)).toBe('');
            });

            it('should return empty string for empty string', () => {
                expect(normalizeUrl('')).toBe('');
            });

            it('should return empty string for whitespace only', () => {
                expect(normalizeUrl('   ')).toBe('');
            });

            it('should return empty string for non-string input', () => {
                expect(normalizeUrl(123 as unknown as string)).toBe('');
            });
        });

        describe('case normalization', () => {
            it('should lowercase entire URL', () => {
                expect(normalizeUrl('HTTPS://EXAMPLE.COM/PATH')).toBe('example.com/path');
            });

            it('should lowercase mixed case URL', () => {
                expect(normalizeUrl('https://Example.COM/Path/To/Page')).toBe('example.com/path/to/page');
            });
        });

        describe('protocol removal', () => {
            it('should remove http:// protocol', () => {
                expect(normalizeUrl('http://example.com')).toBe('example.com');
            });

            it('should remove https:// protocol', () => {
                expect(normalizeUrl('https://example.com')).toBe('example.com');
            });

            it('should remove // protocol-relative prefix', () => {
                expect(normalizeUrl('//example.com/path')).toBe('example.com/path');
            });

            it('should handle URL without protocol', () => {
                expect(normalizeUrl('example.com')).toBe('example.com');
            });
        });

        describe('www prefix removal', () => {
            it('should remove www. prefix', () => {
                expect(normalizeUrl('https://www.example.com')).toBe('example.com');
            });

            it('should not remove www from subdomain', () => {
                // www2.example.com should not have www removed
                expect(normalizeUrl('https://www2.example.com')).toBe('www2.example.com');
            });

            it('should handle www without protocol', () => {
                expect(normalizeUrl('www.example.com')).toBe('example.com');
            });
        });

        describe('trailing slash removal', () => {
            it('should remove trailing slash from root', () => {
                expect(normalizeUrl('https://example.com/')).toBe('example.com');
            });

            it('should remove trailing slash from path', () => {
                expect(normalizeUrl('https://example.com/path/')).toBe('example.com/path');
            });

            it('should not affect paths without trailing slash', () => {
                expect(normalizeUrl('https://example.com/path')).toBe('example.com/path');
            });
        });

        describe('fragment removal', () => {
            it('should remove fragment from URL', () => {
                expect(normalizeUrl('https://example.com/page#section')).toBe('example.com/page');
            });

            it('should remove fragment with complex hash', () => {
                expect(normalizeUrl('https://example.com/page#section-1/subsection')).toBe('example.com/page');
            });

            it('should remove fragment from root URL', () => {
                expect(normalizeUrl('https://example.com#top')).toBe('example.com');
            });
        });

        describe('query parameter preservation', () => {
            it('should preserve query parameters', () => {
                expect(normalizeUrl('https://example.com/search?q=test')).toBe('example.com/search?q=test');
            });

            it('should preserve multiple query parameters', () => {
                expect(normalizeUrl('https://example.com/search?q=test&page=1')).toBe('example.com/search?q=test&page=1');
            });

            it('should remove fragment but keep query params', () => {
                expect(normalizeUrl('https://example.com/page?id=1#section')).toBe('example.com/page?id=1');
            });
        });

        describe('whitespace handling', () => {
            it('should trim leading whitespace', () => {
                expect(normalizeUrl('  https://example.com')).toBe('example.com');
            });

            it('should trim trailing whitespace', () => {
                expect(normalizeUrl('https://example.com  ')).toBe('example.com');
            });

            it('should trim both leading and trailing whitespace', () => {
                expect(normalizeUrl('  https://example.com  ')).toBe('example.com');
            });
        });

        describe('complex URLs', () => {
            it('should handle complex URL with all transformations', () => {
                expect(normalizeUrl('HTTPS://WWW.Example.COM/Path/To/Page/?query=1#section'))
                    .toBe('example.com/path/to/page/?query=1');
            });

            it('should handle URL with port number', () => {
                expect(normalizeUrl('https://example.com:8080/path')).toBe('example.com:8080/path');
            });

            it('should handle URL with authentication', () => {
                expect(normalizeUrl('https://user:pass@example.com/path')).toBe('user:pass@example.com/path');
            });

            it('should handle unicode characters', () => {
                expect(normalizeUrl('https://example.com/path/日本語')).toBe('example.com/path/日本語');
            });
        });
    });

    describe('urlsMatch', () => {
        describe('identical URLs', () => {
            it('should match identical URLs', () => {
                expect(urlsMatch('https://example.com', 'https://example.com')).toBe(true);
            });

            it('should match identical URLs with paths', () => {
                expect(urlsMatch('https://example.com/path', 'https://example.com/path')).toBe(true);
            });
        });

        describe('protocol differences', () => {
            it('should match URLs with different protocols', () => {
                expect(urlsMatch('http://example.com', 'https://example.com')).toBe(true);
            });

            it('should match protocol-relative with explicit protocol', () => {
                expect(urlsMatch('//example.com', 'https://example.com')).toBe(true);
            });
        });

        describe('www differences', () => {
            it('should match URLs with/without www', () => {
                expect(urlsMatch('https://www.example.com', 'https://example.com')).toBe(true);
            });

            it('should match www with path', () => {
                expect(urlsMatch('https://www.example.com/path', 'https://example.com/path')).toBe(true);
            });
        });

        describe('trailing slash differences', () => {
            it('should match URLs with/without trailing slash', () => {
                expect(urlsMatch('https://example.com/', 'https://example.com')).toBe(true);
            });

            it('should match paths with/without trailing slash', () => {
                expect(urlsMatch('https://example.com/path/', 'https://example.com/path')).toBe(true);
            });
        });

        describe('case differences', () => {
            it('should match URLs with different cases', () => {
                expect(urlsMatch('https://EXAMPLE.COM', 'https://example.com')).toBe(true);
            });

            it('should match mixed case paths', () => {
                expect(urlsMatch('https://example.com/PATH', 'https://example.com/path')).toBe(true);
            });
        });

        describe('fragment differences', () => {
            it('should match URLs with different fragments', () => {
                expect(urlsMatch('https://example.com#top', 'https://example.com#bottom')).toBe(true);
            });

            it('should match URL with fragment vs without', () => {
                expect(urlsMatch('https://example.com/page#section', 'https://example.com/page')).toBe(true);
            });
        });

        describe('non-matching URLs', () => {
            it('should not match different paths', () => {
                expect(urlsMatch('https://example.com/a', 'https://example.com/b')).toBe(false);
            });

            it('should not match different domains', () => {
                expect(urlsMatch('https://example.com', 'https://other.com')).toBe(false);
            });

            it('should not match different subdomains', () => {
                expect(urlsMatch('https://api.example.com', 'https://www.example.com')).toBe(false);
            });

            it('should not match different query params', () => {
                expect(urlsMatch('https://example.com?a=1', 'https://example.com?b=2')).toBe(false);
            });
        });
    });

    describe('extractDomain', () => {
        describe('valid URLs', () => {
            it('should extract domain from valid URL', () => {
                expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
            });

            it('should extract domain with subdomain', () => {
                expect(extractDomain('https://api.example.com')).toBe('api.example.com');
            });

            it('should extract domain without subdomain', () => {
                expect(extractDomain('https://example.com')).toBe('example.com');
            });

            it('should extract domain with port number', () => {
                expect(extractDomain('https://example.com:8080/path')).toBe('example.com');
            });

            it('should handle http protocol', () => {
                expect(extractDomain('http://example.com')).toBe('example.com');
            });
        });

        describe('invalid URLs', () => {
            it('should return null for invalid URL', () => {
                expect(extractDomain('not a url')).toBeNull();
            });

            it('should return null for empty string', () => {
                expect(extractDomain('')).toBeNull();
            });

            it('should return null for URL without protocol', () => {
                // URL constructor requires protocol
                expect(extractDomain('example.com')).toBeNull();
            });
        });
    });

    describe('isSecureUrl', () => {
        describe('secure URLs', () => {
            it('should return true for https URLs', () => {
                expect(isSecureUrl('https://example.com')).toBe(true);
            });

            it('should return true for https URL with path', () => {
                expect(isSecureUrl('https://example.com/path')).toBe(true);
            });

            it('should return true for https URL with port', () => {
                expect(isSecureUrl('https://example.com:443')).toBe(true);
            });
        });

        describe('insecure URLs', () => {
            it('should return false for http URLs', () => {
                expect(isSecureUrl('http://example.com')).toBe(false);
            });

            it('should return false for http URL with path', () => {
                expect(isSecureUrl('http://example.com/path')).toBe(false);
            });
        });

        describe('invalid URLs', () => {
            it('should return false for invalid URLs', () => {
                expect(isSecureUrl('not a url')).toBe(false);
            });

            it('should return false for empty string', () => {
                expect(isSecureUrl('')).toBe(false);
            });

            it('should return false for URL without protocol', () => {
                expect(isSecureUrl('example.com')).toBe(false);
            });
        });

        describe('other protocols', () => {
            it('should return false for file protocol', () => {
                expect(isSecureUrl('file:///path/to/file')).toBe(false);
            });

            it('should return false for ftp protocol', () => {
                expect(isSecureUrl('ftp://example.com')).toBe(false);
            });
        });
    });
});
