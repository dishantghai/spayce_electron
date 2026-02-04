import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * B014: Sidebar Font Style Inconsistency Across Contexts
 *
 * ROOT CAUSE: The main app (index.html) and sidebar overlay (sidebar.html) have
 * different font-family fallback stacks and font-smoothing settings, causing
 * visually different text rendering for the same tree items.
 *
 * EVIDENCE:
 * - sidebar.html: font-family includes 'Segoe UI', Roboto; has antialiased smoothing
 * - index.html: font-family missing 'Segoe UI', Roboto; no font-smoothing
 *
 * FIX: Apply sidebar.html's font-family and font-smoothing to index.html so both
 * rendering contexts produce identical text.
 */

// Helper to read HTML file content
function readHtmlFile(filename: string): string {
    const filePath = path.resolve(__dirname, '../src/renderer', filename);
    return fs.readFileSync(filePath, 'utf-8');
}

// Helper to extract body CSS from HTML <style> block
function extractBodyStyles(html: string): string {
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (!styleMatch) return '';
    const styleContent = styleMatch[1];

    // Extract body { ... } block
    const bodyMatch = styleContent.match(/body\s*\{([^}]*)\}/);
    return bodyMatch ? bodyMatch[1] : '';
}

describe('B014: Sidebar Font Style Consistency', () => {
    let indexHtml: string;
    let sidebarHtml: string;
    let indexBodyStyles: string;
    let sidebarBodyStyles: string;

    beforeAll(() => {
        indexHtml = readHtmlFile('index.html');
        sidebarHtml = readHtmlFile('sidebar.html');
        indexBodyStyles = extractBodyStyles(indexHtml);
        sidebarBodyStyles = extractBodyStyles(sidebarHtml);
    });

    describe('Font-Family Consistency', () => {
        it('index.html body should include Segoe UI in font-family fallback', () => {
            expect(indexBodyStyles).toMatch(/['"]Segoe UI['"]/);
        });

        it('index.html body should include Roboto in font-family fallback', () => {
            expect(indexBodyStyles).toMatch(/Roboto/);
        });

        it('both HTML files should have identical font-family values', () => {
            // Extract font-family from both
            const extractFontFamily = (styles: string) => {
                const match = styles.match(/font-family:\s*([^;]+);/);
                return match ? match[1].trim() : '';
            };

            const indexFontFamily = extractFontFamily(indexBodyStyles);
            const sidebarFontFamily = extractFontFamily(sidebarBodyStyles);

            expect(indexFontFamily).toBe(sidebarFontFamily);
        });
    });

    describe('Font Smoothing Consistency', () => {
        it('index.html body should have -webkit-font-smoothing: antialiased', () => {
            expect(indexBodyStyles).toMatch(/-webkit-font-smoothing:\s*antialiased/);
        });

        it('index.html body should have -moz-osx-font-smoothing: grayscale', () => {
            expect(indexBodyStyles).toMatch(/-moz-osx-font-smoothing:\s*grayscale/);
        });

        it('sidebar.html should also have font-smoothing (existing behavior)', () => {
            expect(sidebarBodyStyles).toMatch(/-webkit-font-smoothing:\s*antialiased/);
            expect(sidebarBodyStyles).toMatch(/-moz-osx-font-smoothing:\s*grayscale/);
        });
    });

    describe('Unchanged Properties', () => {
        it('index.html should still have Inter as primary font', () => {
            expect(indexBodyStyles).toMatch(/font-family:\s*Inter/);
        });

        it('index.html should still have overflow: hidden', () => {
            expect(indexBodyStyles).toMatch(/overflow:\s*hidden/);
        });

        it('index.html should still have background-color', () => {
            expect(indexBodyStyles).toMatch(/background-color:\s*#0F0B1A/);
        });
    });
});
