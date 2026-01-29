import { describe, it, expect } from 'vitest';
import { DataSanitizer } from '../../../src/domain/validators/DataSanitizer';

describe('DataSanitizer', () => {
    describe('sanitizeString()', () => {
        it('should trim whitespace', () => {
            expect(DataSanitizer.sanitizeString('  test  ')).toBe('test');
            expect(DataSanitizer.sanitizeString('\t\ntest\n\t')).toBe('test');
        });

        it('should remove HTML tags', () => {
            expect(DataSanitizer.sanitizeString('hello<script>alert(1)</script>world')).toBe('helloalert(1)/scriptworld');
            expect(DataSanitizer.sanitizeString('test<>test')).toBe('testtest');
        });

        it('should remove javascript: protocol', () => {
            expect(DataSanitizer.sanitizeString('javascript:alert(1)')).toBe('alert(1)');
            expect(DataSanitizer.sanitizeString('JAVASCRIPT:alert(1)')).toBe('alert(1)');
        });

        it('should remove data: protocol', () => {
            expect(DataSanitizer.sanitizeString('data:text/html,<script>alert(1)</script>')).toBe('text/html,scriptalert(1)/script');
            expect(DataSanitizer.sanitizeString('DATA:image/png')).toBe('image/png');
        });

        it('should truncate to max length (default 1000)', () => {
            const longString = 'a'.repeat(2000);
            const result = DataSanitizer.sanitizeString(longString);
            expect(result.length).toBe(1000);
        });

        it('should respect custom max length', () => {
            const longString = 'a'.repeat(200);
            const result = DataSanitizer.sanitizeString(longString, 100);
            expect(result.length).toBe(100);
        });

        it('should return empty string for null/undefined', () => {
            expect(DataSanitizer.sanitizeString(null as any)).toBe('');
            expect(DataSanitizer.sanitizeString(undefined as any)).toBe('');
        });

        it('should return empty string for non-string input', () => {
            expect(DataSanitizer.sanitizeString(123 as any)).toBe('');
            expect(DataSanitizer.sanitizeString({} as any)).toBe('');
        });

        it('should return empty string for empty string', () => {
            expect(DataSanitizer.sanitizeString('')).toBe('');
        });

        it('should handle combination of unsafe content', () => {
            const input = '  <script>javascript:alert(1)</script>  ';
            const result = DataSanitizer.sanitizeString(input);
            expect(result).not.toContain('<');
            expect(result).not.toContain('>');
            expect(result).not.toContain('javascript:');
        });
    });

    describe('sanitizeUrl()', () => {
        it('should preserve https URLs', () => {
            expect(DataSanitizer.sanitizeUrl('https://example.com')).toBe('https://example.com');
        });

        it('should preserve http URLs', () => {
            expect(DataSanitizer.sanitizeUrl('http://example.com')).toBe('http://example.com');
        });

        it('should add https:// to URLs without protocol', () => {
            expect(DataSanitizer.sanitizeUrl('example.com')).toBe('https://example.com');
            expect(DataSanitizer.sanitizeUrl('www.example.com')).toBe('https://www.example.com');
        });

        it('should trim whitespace', () => {
            expect(DataSanitizer.sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
            expect(DataSanitizer.sanitizeUrl('  example.com  ')).toBe('https://example.com');
        });

        it('should truncate to 2048 characters', () => {
            const longUrl = 'https://' + 'a'.repeat(3000) + '.com';
            const result = DataSanitizer.sanitizeUrl(longUrl);
            expect(result.length).toBe(2048);
        });

        it('should truncate URLs without protocol to 2048 characters', () => {
            const longDomain = 'a'.repeat(3000) + '.com';
            const result = DataSanitizer.sanitizeUrl(longDomain);
            expect(result.length).toBe(2048);
            expect(result.startsWith('https://')).toBe(true);
        });

        it('should return empty string for null/undefined', () => {
            expect(DataSanitizer.sanitizeUrl(null as any)).toBe('');
            expect(DataSanitizer.sanitizeUrl(undefined as any)).toBe('');
        });

        it('should return empty string for non-string input', () => {
            expect(DataSanitizer.sanitizeUrl(123 as any)).toBe('');
            expect(DataSanitizer.sanitizeUrl({} as any)).toBe('');
        });

        it('should return empty string for empty string', () => {
            expect(DataSanitizer.sanitizeUrl('')).toBe('');
        });

        it('should handle URLs with paths and query params', () => {
            expect(DataSanitizer.sanitizeUrl('https://example.com/path?query=value')).toBe('https://example.com/path?query=value');
            expect(DataSanitizer.sanitizeUrl('example.com/path?query=value')).toBe('https://example.com/path?query=value');
        });
    });

    describe('sanitizeFileName()', () => {
        it('should preserve valid filenames', () => {
            expect(DataSanitizer.sanitizeFileName('document.txt')).toBe('document.txt');
            expect(DataSanitizer.sanitizeFileName('my-file_2024.pdf')).toBe('my-file_2024.pdf');
        });

        it('should trim whitespace', () => {
            expect(DataSanitizer.sanitizeFileName('  file.txt  ')).toBe('file.txt');
        });

        it('should remove invalid characters', () => {
            expect(DataSanitizer.sanitizeFileName('file<name>.txt')).toBe('filename.txt');
            expect(DataSanitizer.sanitizeFileName('file:name.txt')).toBe('filename.txt');
            expect(DataSanitizer.sanitizeFileName('file"name.txt')).toBe('filename.txt');
            expect(DataSanitizer.sanitizeFileName('file|name.txt')).toBe('filename.txt');
            expect(DataSanitizer.sanitizeFileName('file?name.txt')).toBe('filename.txt');
            expect(DataSanitizer.sanitizeFileName('file*name.txt')).toBe('filename.txt');
        });

        it('should remove path traversal sequences', () => {
            expect(DataSanitizer.sanitizeFileName('../../../etc/passwd')).toBe('/etc/passwd');
            expect(DataSanitizer.sanitizeFileName('..\\..\\windows\\system32')).toBe('\\windows\\system32');
        });

        it('should truncate to 255 characters', () => {
            const longName = 'a'.repeat(300) + '.txt';
            const result = DataSanitizer.sanitizeFileName(longName);
            expect(result.length).toBe(255);
        });

        it('should return empty string for null/undefined', () => {
            expect(DataSanitizer.sanitizeFileName(null as any)).toBe('');
            expect(DataSanitizer.sanitizeFileName(undefined as any)).toBe('');
        });

        it('should return empty string for non-string input', () => {
            expect(DataSanitizer.sanitizeFileName(123 as any)).toBe('');
            expect(DataSanitizer.sanitizeFileName({} as any)).toBe('');
        });

        it('should return empty string for empty string', () => {
            expect(DataSanitizer.sanitizeFileName('')).toBe('');
        });

        it('should handle filenames with multiple invalid characters', () => {
            const unsafe = 'my<file>:name"|with?bad*chars..txt';
            const result = DataSanitizer.sanitizeFileName(unsafe);
            expect(result).not.toContain('<');
            expect(result).not.toContain('>');
            expect(result).not.toContain(':');
            expect(result).not.toContain('"');
            expect(result).not.toContain('|');
            expect(result).not.toContain('?');
            expect(result).not.toContain('*');
            expect(result).not.toContain('..');
        });

        it('should preserve dots in extensions', () => {
            const result = DataSanitizer.sanitizeFileName('file.tar.gz');
            expect(result).toBe('file.tar.gz');
        });
    });
});
