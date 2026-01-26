import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock the FaviconCache module
vi.mock('../../src/services/FaviconCache', () => ({
    extractDomain: vi.fn((url: string) => {
        if (!url) return '';
        try {
            let hostname = new URL(url).hostname;
            if (hostname.startsWith('www.')) {
                hostname = hostname.slice(4);
            }
            return hostname;
        } catch {
            return '';
        }
    }),
    getGoogleFaviconUrl: vi.fn((domain: string) =>
        `https://www.google.com/s2/favicons?domain_url=https://${domain}&sz=32`
    ),
}));

import { TreeItemIcon } from '../../src/components/TreeItemIcon';
import { SpaceItemType } from '../../src/types';

describe('TreeItemIcon', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('folder icons', () => {
        it('renders closed folder icon for folder type', () => {
            const { container } = render(
                <TreeItemIcon type={SpaceItemType.folder} />
            );
            // Should render Folder icon (not FolderOpen)
            expect(container.querySelector('svg')).toBeTruthy();
        });

        it('renders open folder icon when expanded', () => {
            const { container } = render(
                <TreeItemIcon type={SpaceItemType.folder} isExpanded={true} />
            );
            expect(container.querySelector('svg')).toBeTruthy();
        });

        it('uses accent color for open folder', () => {
            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.folder}
                    isExpanded={true}
                    accentColor="#FF0000"
                />
            );
            const svg = container.querySelector('svg');
            expect(svg).toBeTruthy();
        });
    });

    describe('link icons with favicon', () => {
        it('uses base64 favicon when stored favicon starts with data:', () => {
            const base64Favicon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl={base64Favicon}
                    itemUrl="https://example.com"
                />
            );

            const img = container.querySelector('img');
            expect(img).toBeTruthy();
            expect(img?.getAttribute('src')).toBe(base64Favicon);
        });

        it('uses Google favicon service when stored favicon is a URL (not base64)', () => {
            const directUrl = 'https://example.com/favicon.ico';

            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl={directUrl}
                    itemUrl="https://example.com/page"
                />
            );

            const img = container.querySelector('img');
            expect(img).toBeTruthy();
            // Should use Google favicon, not the direct URL
            expect(img?.getAttribute('src')).toBe(
                'https://www.google.com/s2/favicons?domain_url=https://example.com&sz=32'
            );
        });

        it('uses Google favicon service when no stored favicon', () => {
            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl={null}
                    itemUrl="https://github.com/user/repo"
                />
            );

            const img = container.querySelector('img');
            expect(img).toBeTruthy();
            expect(img?.getAttribute('src')).toBe(
                'https://www.google.com/s2/favicons?domain_url=https://github.com&sz=32'
            );
        });

        it('strips www. from domain for Google favicon URL', () => {
            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl={null}
                    itemUrl="https://www.myntra.com/products"
                />
            );

            const img = container.querySelector('img');
            expect(img).toBeTruthy();
            // Should strip www. prefix
            expect(img?.getAttribute('src')).toBe(
                'https://www.google.com/s2/favicons?domain_url=https://myntra.com&sz=32'
            );
        });

        it('preserves subdomains other than www', () => {
            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl={null}
                    itemUrl="https://mail.google.com/inbox"
                />
            );

            const img = container.querySelector('img');
            expect(img).toBeTruthy();
            // Should preserve mail. subdomain
            expect(img?.getAttribute('src')).toBe(
                'https://www.google.com/s2/favicons?domain_url=https://mail.google.com&sz=32'
            );
        });

        it('shows Link icon when no itemUrl provided', () => {
            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl={null}
                    itemUrl=""
                />
            );

            // Should show SVG Link icon, not img
            const img = container.querySelector('img');
            const svg = container.querySelector('svg');
            expect(img).toBeFalsy();
            expect(svg).toBeTruthy();
        });

        it('shows Link icon on image load error', () => {
            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl={null}
                    itemUrl="https://example.com"
                />
            );

            const img = container.querySelector('img');
            expect(img).toBeTruthy();

            // Simulate image load error
            fireEvent.error(img!);

            // Should now show SVG Link icon
            const svg = container.querySelector('svg');
            expect(svg).toBeTruthy();
            expect(container.querySelector('img')).toBeFalsy();
        });
    });

    describe('file icons', () => {
        it('renders file icon for file type', () => {
            const { container } = render(
                <TreeItemIcon type={SpaceItemType.file} />
            );
            expect(container.querySelector('svg')).toBeTruthy();
        });

        it('renders text file icon for .md extension', () => {
            const { container } = render(
                <TreeItemIcon type={SpaceItemType.file} extension=".md" />
            );
            expect(container.querySelector('svg')).toBeTruthy();
        });

        it('renders code file icon for .js extension', () => {
            const { container } = render(
                <TreeItemIcon type={SpaceItemType.file} extension=".js" />
            );
            expect(container.querySelector('svg')).toBeTruthy();
        });
    });

    describe('local folder icons', () => {
        it('renders local folder icon', () => {
            const { container } = render(
                <TreeItemIcon type={SpaceItemType.localFolder} />
            );
            expect(container.querySelector('svg')).toBeTruthy();
        });

        it('renders open local folder icon when expanded', () => {
            const { container } = render(
                <TreeItemIcon type={SpaceItemType.localFolder} isExpanded={true} />
            );
            expect(container.querySelector('svg')).toBeTruthy();
        });
    });
});

describe('Favicon Strategy Integration', () => {
    describe('base64 favicon priority', () => {
        it('base64 PNG favicon is used directly', () => {
            const base64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl={base64Png}
                    itemUrl="https://example.com"
                />
            );

            const img = container.querySelector('img');
            expect(img?.getAttribute('src')).toBe(base64Png);
        });

        it('base64 ICO favicon is used directly', () => {
            const base64Ico = 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAA==';

            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl={base64Ico}
                    itemUrl="https://example.com"
                />
            );

            const img = container.querySelector('img');
            expect(img?.getAttribute('src')).toBe(base64Ico);
        });

        it('base64 SVG favicon is used directly', () => {
            const base64Svg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';

            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl={base64Svg}
                    itemUrl="https://example.com"
                />
            );

            const img = container.querySelector('img');
            expect(img?.getAttribute('src')).toBe(base64Svg);
        });
    });

    describe('Google fallback for non-base64 URLs', () => {
        it('direct favicon.ico URL falls back to Google', () => {
            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl="https://mail.google.com/favicon.ico"
                    itemUrl="https://mail.google.com/inbox"
                />
            );

            const img = container.querySelector('img');
            expect(img?.getAttribute('src')).toContain('google.com/s2/favicons');
        });

        it('HTTPS favicon URL falls back to Google', () => {
            const { container } = render(
                <TreeItemIcon
                    type={SpaceItemType.link}
                    faviconUrl="https://github.githubassets.com/favicons/favicon.svg"
                    itemUrl="https://github.com"
                />
            );

            const img = container.querySelector('img');
            expect(img?.getAttribute('src')).toContain('google.com/s2/favicons');
        });
    });
});
