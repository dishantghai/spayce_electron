export interface PageMetadata {
    title: string | null;
    description: string | null;
    faviconUrl: string | null;
    /** Base64 encoded favicon data (data:image/...) for direct use in renderer */
    faviconData: string | null;
}

export class MetadataExtractionService {
    private readonly timeout: number = 10000; // 10 seconds

    async extractMetadata(url: string): Promise<PageMetadata> {
        try {
            const html = await this.fetchPage(url);
            const metadata = this.parseMetaTags(html);
            const faviconUrl = await this.extractFavicon(url, html);
            const faviconData = faviconUrl ? await this.fetchFaviconAsBase64(faviconUrl) : null;

            return {
                title: metadata.title || this.extractTitle(html) || null,
                description: metadata.description || metadata['og:description'] || null,
                faviconUrl,
                faviconData,
            };
        } catch (error) {
            const faviconUrl = await this.getDefaultFavicon(url);
            const faviconData = faviconUrl ? await this.fetchFaviconAsBase64(faviconUrl) : null;
            return {
                title: null,
                description: null,
                faviconUrl,
                faviconData,
            };
        }
    }

    async extractFavicon(url: string, html?: string): Promise<string | null> {
        try {
            if (html) {
                const faviconFromHtml = this.extractFaviconFromHtml(html, url);
                if (faviconFromHtml) {
                    return faviconFromHtml;
                }
            }

            return await this.getDefaultFavicon(url);
        } catch (error) {
            console.error(`Failed to extract favicon for ${url}:`, error);
            return null;
        }
    }

    private async fetchPage(url: string): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Spayce/1.0)',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.text();
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private parseMetaTags(html: string): Record<string, string> {
        const metadata: Record<string, string> = {};

        // Extract <title>
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            metadata.title = this.decodeHtmlEntities(titleMatch[1].trim());
        }

        // Extract meta tags
        const metaRegex = /<meta\s+([^>]*?)>/gi;
        let match;

        while ((match = metaRegex.exec(html)) !== null) {
            const attrs = match[1];
            const nameMatch = attrs.match(/(?:name|property)=["']([^"']+)["']/i);
            const contentMatch = attrs.match(/content=["']([^"']+)["']/i);

            if (nameMatch && contentMatch) {
                const name = nameMatch[1].toLowerCase();
                const content = this.decodeHtmlEntities(contentMatch[1]);
                metadata[name] = content;
            }
        }

        return metadata;
    }

    private extractTitle(html: string): string | null {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return titleMatch ? this.decodeHtmlEntities(titleMatch[1].trim()) : null;
    }

    private extractFaviconFromHtml(html: string, baseUrl: string): string | null {
        // Priority order for favicon extraction (highest quality first)
        const iconPatterns = [
            // 1. Apple touch icon (highest quality, usually 180x180)
            /<link\s+[^>]*rel=["']apple-touch-icon[^"']*["'][^>]*>/gi,
            // 2. Large icons (32x32 or larger)
            /<link\s+[^>]*rel=["']icon["'][^>]*sizes=["'](?:32x32|48x48|64x64|96x96|128x128|192x192|256x256)[^"']*["'][^>]*>/gi,
            // 3. Standard icon
            /<link\s+[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*>/gi,
            // 4. Any link with favicon in href
            /<link\s+[^>]*href=["']([^"']*favicon[^"']*)["'][^>]*>/gi,
        ];

        for (const pattern of iconPatterns) {
            const matches = html.matchAll(pattern);
            for (const match of matches) {
                const linkTag = match[0];
                const hrefMatch = linkTag.match(/href=["']([^"']+)["']/i);
                if (hrefMatch) {
                    return this.resolveUrl(hrefMatch[1], baseUrl);
                }
            }
        }

        return null;
    }

    private async getDefaultFavicon(url: string): Promise<string | null> {
        try {
            const urlObj = new URL(url);
            const faviconUrl = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;

            // Test if favicon exists
            const response = await fetch(faviconUrl, { method: 'HEAD' });
            if (response.ok) {
                return faviconUrl;
            }
        } catch (error) {
            // Ignore errors
        }

        return null;
    }

    /**
     * Fetch favicon and convert to base64 data URL
     * This bypasses CORS since it runs in Node.js (main process)
     */
    private async fetchFaviconAsBase64(faviconUrl: string): Promise<string | null> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(faviconUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Spayce/1.0)',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                return null;
            }

            const contentType = response.headers.get('content-type') || 'image/x-icon';
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');

            return `data:${contentType};base64,${base64}`;
        } catch {
            return null;
        }
    }

    private resolveUrl(href: string, baseUrl: string): string {
        try {
            // If href is already absolute, return it
            if (href.startsWith('http://') || href.startsWith('https://')) {
                return href;
            }

            // If href starts with //, add protocol
            if (href.startsWith('//')) {
                const protocol = new URL(baseUrl).protocol;
                return `${protocol}${href}`;
            }

            // Otherwise, resolve relative to base URL
            const base = new URL(baseUrl);
            if (href.startsWith('/')) {
                return `${base.protocol}//${base.host}${href}`;
            } else {
                const path = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
                return `${base.protocol}//${base.host}${path}${href}`;
            }
        } catch (error) {
            return href;
        }
    }

    private decodeHtmlEntities(text: string): string {
        return text
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
            .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    }
}
