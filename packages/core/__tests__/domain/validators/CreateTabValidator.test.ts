import { describe, it, expect } from 'vitest';
import { CreateTabValidator } from '../../../src/domain/validators/CreateTabValidator';
import { TabType, CREATE_TAB_DEFAULTS } from '../../../src/domain/entities/Tab';
import { ValidationError } from '../../../src/domain/errors';

describe('CreateTabValidator', () => {
    const validator = new CreateTabValidator();

    describe('empty input handling', () => {
        it('should return defaults for null input', () => {
            const result = validator.validate(null);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(CREATE_TAB_DEFAULTS);
        });

        it('should return defaults for undefined input', () => {
            const result = validator.validate(undefined);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(CREATE_TAB_DEFAULTS);
        });

        it('should return defaults for empty object', () => {
            const result = validator.validate({});
            expect(result.success).toBe(true);
            expect(result.data?.url).toBe(CREATE_TAB_DEFAULTS.url);
            expect(result.data?.title).toBe(CREATE_TAB_DEFAULTS.title);
            expect(result.data?.tabType).toBe(CREATE_TAB_DEFAULTS.tabType);
        });
    });

    describe('url validation', () => {
        it('should accept valid https URL', () => {
            const result = validator.validate({ url: 'https://example.com' });
            expect(result.success).toBe(true);
            expect(result.data?.url).toBe('https://example.com');
        });

        it('should accept valid http URL', () => {
            const result = validator.validate({ url: 'http://example.com' });
            expect(result.success).toBe(true);
        });

        it('should accept URL with path and query', () => {
            const result = validator.validate({ url: 'https://example.com/path?q=search' });
            expect(result.success).toBe(true);
        });

        it('should reject non-string URL', () => {
            const result = validator.validate({ url: 123 });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('url');
        });

        it('should reject URL exceeding max length (2048)', () => {
            const longUrl = 'https://example.com/' + 'a'.repeat(2050);
            const result = validator.validate({ url: longUrl });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('url');
        });

        it('should accept URL at max length', () => {
            const maxUrl = 'https://example.com/' + 'a'.repeat(2020); // Under 2048
            const result = validator.validate({ url: maxUrl });
            expect(result.success).toBe(true);
        });

        it('should reject invalid URL format (no protocol)', () => {
            const result = validator.validate({ url: 'not-a-valid-url' });
            expect(result.success).toBe(false);
        });

        it('should allow empty URL (uses default)', () => {
            const result = validator.validate({ url: '' });
            expect(result.success).toBe(true);
        });

        it('should accept file:// URLs as invalid HTTP/HTTPS', () => {
            const result = validator.validate({ url: 'file:///path/to/file' });
            expect(result.success).toBe(false);
        });
    });

    describe('title validation', () => {
        it('should accept valid title', () => {
            const result = validator.validate({ title: 'My Tab Title' });
            expect(result.success).toBe(true);
            expect(result.data?.title).toBe('My Tab Title');
        });

        it('should accept empty title (uses default)', () => {
            const result = validator.validate({ title: '' });
            expect(result.success).toBe(true);
        });

        it('should reject non-string title', () => {
            const result = validator.validate({ title: 123 });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('title');
        });

        it('should reject title exceeding max length (500)', () => {
            const longTitle = 'a'.repeat(501);
            const result = validator.validate({ title: longTitle });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('title');
        });

        it('should accept title at max length', () => {
            const maxTitle = 'a'.repeat(500);
            const result = validator.validate({ title: maxTitle });
            expect(result.success).toBe(true);
        });

        it('should accept title with special characters', () => {
            const result = validator.validate({ title: 'Tab - Test (123) <script>' });
            expect(result.success).toBe(true);
        });
    });

    describe('tabType validation', () => {
        it('should accept TabType.Web', () => {
            const result = validator.validate({ tabType: TabType.Web });
            expect(result.success).toBe(true);
            expect(result.data?.tabType).toBe(TabType.Web);
        });

        it('should accept TabType.Note', () => {
            const result = validator.validate({ tabType: TabType.Note });
            expect(result.success).toBe(true);
            expect(result.data?.tabType).toBe(TabType.Note);
        });

        it('should accept TabType.LocalFile', () => {
            const result = validator.validate({ tabType: TabType.LocalFile });
            expect(result.success).toBe(true);
            expect(result.data?.tabType).toBe(TabType.LocalFile);
        });

        it('should reject invalid tab type', () => {
            const result = validator.validate({ tabType: 'invalid' });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('tabType');
        });

        it('should default to Web when not specified', () => {
            const result = validator.validate({});
            expect(result.success).toBe(true);
            expect(result.data?.tabType).toBe(TabType.Web);
        });
    });

    describe('origin validation (both or neither)', () => {
        it('should accept both origin fields together', () => {
            const result = validator.validate({
                originSpaceId: 'space-123',
                originSpaceItemId: 'item-456',
            });
            expect(result.success).toBe(true);
            expect(result.data?.originSpaceId).toBe('space-123');
            expect(result.data?.originSpaceItemId).toBe('item-456');
        });

        it('should accept neither origin field', () => {
            const result = validator.validate({});
            expect(result.success).toBe(true);
            expect(result.data?.originSpaceId).toBeNull();
            expect(result.data?.originSpaceItemId).toBeNull();
        });

        it('should reject only originSpaceId without originSpaceItemId', () => {
            const result = validator.validate({ originSpaceId: 'space-123' });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('originSpaceId');
        });

        it('should reject only originSpaceItemId without originSpaceId', () => {
            const result = validator.validate({ originSpaceItemId: 'item-456' });
            expect(result.success).toBe(false);
        });

        it('should accept explicit null for both origin fields', () => {
            const result = validator.validate({
                originSpaceId: null,
                originSpaceItemId: null,
            });
            expect(result.success).toBe(true);
        });
    });

    describe('faviconUrl validation', () => {
        it('should accept valid favicon URL', () => {
            const result = validator.validate({ faviconUrl: 'https://example.com/favicon.ico' });
            expect(result.success).toBe(true);
            expect(result.data?.faviconUrl).toBe('https://example.com/favicon.ico');
        });

        it('should accept null faviconUrl', () => {
            const result = validator.validate({ faviconUrl: null });
            expect(result.success).toBe(true);
            expect(result.data?.faviconUrl).toBeNull();
        });

        it('should default faviconUrl to null', () => {
            const result = validator.validate({});
            expect(result.success).toBe(true);
            expect(result.data?.faviconUrl).toBeNull();
        });
    });

    describe('activate validation', () => {
        it('should accept activate: true', () => {
            const result = validator.validate({ activate: true });
            expect(result.success).toBe(true);
            expect(result.data?.activate).toBe(true);
        });

        it('should accept activate: false', () => {
            const result = validator.validate({ activate: false });
            expect(result.success).toBe(true);
            expect(result.data?.activate).toBe(false);
        });

        it('should default activate to true', () => {
            const result = validator.validate({});
            expect(result.success).toBe(true);
            expect(result.data?.activate).toBe(true);
        });
    });

    describe('complete valid input', () => {
        it('should validate complete input with all fields', () => {
            const input = {
                url: 'https://example.com/page',
                title: 'Example Page',
                tabType: TabType.Web,
                faviconUrl: 'https://example.com/favicon.ico',
                originSpaceId: 'space-123',
                originSpaceItemId: 'item-456',
                activate: true,
            };

            const result = validator.validate(input);

            expect(result.success).toBe(true);
            expect(result.data?.url).toBe('https://example.com/page');
            expect(result.data?.title).toBe('Example Page');
            expect(result.data?.tabType).toBe(TabType.Web);
            expect(result.data?.faviconUrl).toBe('https://example.com/favicon.ico');
            expect(result.data?.originSpaceId).toBe('space-123');
            expect(result.data?.originSpaceItemId).toBe('item-456');
            expect(result.data?.activate).toBe(true);
        });
    });

    describe('multiple validation errors', () => {
        it('should collect multiple errors', () => {
            const result = validator.validate({
                url: 123,
                title: 456,
                tabType: 'invalid',
            });

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });

    describe('non-object input', () => {
        it('should return defaults for string input', () => {
            const result = validator.validate('string' as unknown);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(CREATE_TAB_DEFAULTS);
        });

        it('should return defaults for number input', () => {
            const result = validator.validate(123 as unknown);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(CREATE_TAB_DEFAULTS);
        });

        it('should return defaults for array input', () => {
            const result = validator.validate([1, 2, 3] as unknown);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(CREATE_TAB_DEFAULTS);
        });
    });
});
