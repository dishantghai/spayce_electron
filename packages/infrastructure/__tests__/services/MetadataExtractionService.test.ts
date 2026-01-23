import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetadataExtractionService } from '../../src/services/MetadataExtractionService';

global.fetch = vi.fn();

describe('MetadataExtractionService', () => {
    let service: MetadataExtractionService;

    beforeEach(() => {
        service = new MetadataExtractionService();
        vi.clearAllMocks();
    });

    describe('extractMetadata', () => {
        it('should extract title, description, and favicon from HTML', async () => {
            const mockHtml = `
                <html>
                    <head>
                        <title>Test Page</title>
                        <meta name="description" content="Test description">
                        <link rel="icon" href="/favicon.ico">
                    </head>
                </html>
            `;

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            } as Response);

            const result = await service.extractMetadata('https://example.com');

            expect(result.title).toBe('Test Page');
            expect(result.description).toBe('Test description');
            expect(result.faviconUrl).toBe('https://example.com/favicon.ico');
        });

        it('should extract Open Graph description when meta description is missing', async () => {
            const mockHtml = `
                <html>
                    <head>
                        <title>Test Page</title>
                        <meta property="og:description" content="OG description">
                    </head>
                </html>
            `;

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            } as Response);

            const result = await service.extractMetadata('https://example.com');

            expect(result.description).toBe('OG description');
        });

        it('should prefer meta description over Open Graph description', async () => {
            const mockHtml = `
                <html>
                    <head>
                        <meta name="description" content="Meta description">
                        <meta property="og:description" content="OG description">
                    </head>
                </html>
            `;

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            } as Response);

            const result = await service.extractMetadata('https://example.com');

            expect(result.description).toBe('Meta description');
        });

        it('should extract title from <title> tag', async () => {
            const mockHtml = `
                <html>
                    <head>
                        <title>Page Title</title>
                    </head>
                </html>
            `;

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            } as Response);

            const result = await service.extractMetadata('https://example.com');

            expect(result.title).toBe('Page Title');
        });

        it('should handle missing metadata gracefully', async () => {
            vi.mocked(global.fetch)
                .mockResolvedValueOnce({
                    ok: true,
                    text: async () => '<html><head></head><body></body></html>',
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                } as Response);

            const result = await service.extractMetadata('https://example.com');

            expect(result.title).toBeNull();
            expect(result.description).toBeNull();
            expect(result.faviconUrl).toBe('https://example.com/favicon.ico');
        });

        it('should handle fetch errors gracefully', async () => {
            vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

            const result = await service.extractMetadata('https://example.com');

            expect(result.title).toBeNull();
            expect(result.description).toBeNull();
            expect(result.faviconUrl).toBeNull();
        });

        it('should handle timeout gracefully', async () => {
            vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Timeout'));

            const result = await service.extractMetadata('https://example.com');

            expect(result.title).toBeNull();
            expect(result.description).toBeNull();
            expect(result.faviconUrl).toBeNull();
        });

        it('should decode HTML entities in title and description', async () => {
            const mockHtml = `
                <html>
                    <head>
                        <title>Test &amp; Title &lt;escaped&gt;</title>
                        <meta name="description" content="Description &quot;with quotes&quot;">
                    </head>
                </html>
            `;

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            } as Response);

            const result = await service.extractMetadata('https://example.com');

            expect(result.title).toBe('Test & Title <escaped>');
            expect(result.description).toBe('Description "with quotes"');
        });

        it('should extract favicon from multiple link tags', async () => {
            const mockHtml = `
                <html>
                    <head>
                        <link rel="shortcut icon" href="/icon.png">
                        <link rel="icon" href="/favicon.ico">
                    </head>
                </html>
            `;

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            } as Response);

            const result = await service.extractMetadata('https://example.com');

            expect(result.faviconUrl).toMatch(/https:\/\/example\.com\/(icon\.png|favicon\.ico)/);
        });

        it('should resolve relative favicon URLs', async () => {
            const mockHtml = `
                <html>
                    <head>
                        <link rel="icon" href="/assets/favicon.ico">
                    </head>
                </html>
            `;

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            } as Response);

            const result = await service.extractMetadata('https://example.com');

            expect(result.faviconUrl).toBe('https://example.com/assets/favicon.ico');
        });

        it('should handle absolute favicon URLs', async () => {
            const mockHtml = `
                <html>
                    <head>
                        <link rel="icon" href="https://cdn.example.com/favicon.ico">
                    </head>
                </html>
            `;

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            } as Response);

            const result = await service.extractMetadata('https://example.com');

            expect(result.faviconUrl).toBe('https://cdn.example.com/favicon.ico');
        });
    });

    describe('extractFavicon', () => {
        it('should extract favicon from HTML', async () => {
            const mockHtml = '<link rel="icon" href="/favicon.ico">';

            const result = await service.extractFavicon('https://example.com', mockHtml);

            expect(result).toBe('https://example.com/favicon.ico');
        });

        it('should fetch HTML if not provided', async () => {
            const mockHtml = '<link rel="icon" href="/favicon.ico">';

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            } as Response);

            const result = await service.extractFavicon('https://example.com');

            expect(result).toBe('https://example.com/favicon.ico');
        });

        it('should return default favicon if extraction fails', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
            } as Response);

            const result = await service.extractFavicon('https://example.com', '<html></html>');

            expect(result).toBe('https://example.com/favicon.ico');
        });

        it('should handle errors gracefully', async () => {
            vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

            const result = await service.extractFavicon('https://example.com');

            expect(result).toBeNull();
        });

        it('should extract apple-touch-icon', async () => {
            const mockHtml = '<link rel="apple-touch-icon" href="/apple-icon.png">';

            const result = await service.extractFavicon('https://example.com', mockHtml);

            expect(result).toBe('https://example.com/apple-icon.png');
        });

        it('should extract icon with sizes attribute', async () => {
            const mockHtml = '<link rel="icon" sizes="32x32" href="/icon-32.png">';

            const result = await service.extractFavicon('https://example.com', mockHtml);

            expect(result).toBe('https://example.com/icon-32.png');
        });
    });

    describe('URL handling', () => {
        it('should handle URLs with paths', async () => {
            const mockHtml = '<title>Test</title><link rel="icon" href="/favicon.ico">';

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            } as Response);

            const result = await service.extractMetadata('https://example.com/some/path');

            expect(result.faviconUrl).toBe('https://example.com/favicon.ico');
        });

        it('should handle URLs with query parameters', async () => {
            vi.mocked(global.fetch)
                .mockResolvedValueOnce({
                    ok: true,
                    text: async () => '<html><head><title>Test</title></head></html>',
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                } as Response);

            const result = await service.extractMetadata('https://example.com?foo=bar');

            expect(result.faviconUrl).toBe('https://example.com/favicon.ico');
        });

        it('should handle URLs with hash fragments', async () => {
            vi.mocked(global.fetch)
                .mockResolvedValueOnce({
                    ok: true,
                    text: async () => '<html><head><title>Test</title></head></html>',
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                } as Response);

            const result = await service.extractMetadata('https://example.com#section');

            expect(result.faviconUrl).toBe('https://example.com/favicon.ico');
        });

        it('should handle http URLs', async () => {
            vi.mocked(global.fetch)
                .mockResolvedValueOnce({
                    ok: true,
                    text: async () => '<html><head><title>Test</title></head></html>',
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                } as Response);

            const result = await service.extractMetadata('http://example.com');

            expect(result.faviconUrl).toBe('http://example.com/favicon.ico');
        });
    });
});
