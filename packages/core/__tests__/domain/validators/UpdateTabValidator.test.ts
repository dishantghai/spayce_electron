import { describe, it, expect } from 'vitest';
import { UpdateTabValidator } from '../../../src/domain/validators/UpdateTabValidator';
import { ValidationError } from '../../../src/domain/errors';

describe('UpdateTabValidator', () => {
    const validator = new UpdateTabValidator();

    describe('input type validation', () => {
        it('should reject null input', () => {
            const result = validator.validate(null);
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('input');
        });

        it('should reject undefined input', () => {
            const result = validator.validate(undefined);
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('input');
        });

        it('should reject string input', () => {
            const result = validator.validate('string' as unknown);
            expect(result.success).toBe(false);
        });

        it('should reject number input', () => {
            const result = validator.validate(123 as unknown);
            expect(result.success).toBe(false);
        });

        it('should accept object input', () => {
            const result = validator.validate({ id: 'tab-123' });
            expect(result.success).toBe(true);
        });
    });

    describe('id validation (required)', () => {
        it('should require id field', () => {
            const result = validator.validate({});
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('id');
        });

        it('should reject null id', () => {
            const result = validator.validate({ id: null });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('id');
        });

        it('should reject empty string id', () => {
            const result = validator.validate({ id: '' });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('id');
        });

        it('should reject non-string id', () => {
            const result = validator.validate({ id: 123 });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('id');
        });

        it('should accept valid string id', () => {
            const result = validator.validate({ id: 'tab-123' });
            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('tab-123');
        });
    });

    describe('url validation', () => {
        it('should accept valid URL', () => {
            const result = validator.validate({ id: 'tab-1', url: 'https://example.com' });
            expect(result.success).toBe(true);
            expect(result.data?.url).toBe('https://example.com');
        });

        it('should reject non-string URL', () => {
            const result = validator.validate({ id: 'tab-1', url: 123 });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('url');
        });

        it('should reject URL exceeding max length (2048)', () => {
            const longUrl = 'https://example.com/' + 'a'.repeat(2050);
            const result = validator.validate({ id: 'tab-1', url: longUrl });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('url');
        });

        it('should allow null URL', () => {
            const result = validator.validate({ id: 'tab-1', url: null });
            expect(result.success).toBe(true);
        });

        it('should allow undefined URL (no update)', () => {
            const result = validator.validate({ id: 'tab-1' });
            expect(result.success).toBe(true);
            expect(result.data?.url).toBeUndefined();
        });
    });

    describe('title validation', () => {
        it('should accept valid title', () => {
            const result = validator.validate({ id: 'tab-1', title: 'New Title' });
            expect(result.success).toBe(true);
            expect(result.data?.title).toBe('New Title');
        });

        it('should reject non-string title', () => {
            const result = validator.validate({ id: 'tab-1', title: 123 });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('title');
        });

        it('should reject title exceeding max length (500)', () => {
            const longTitle = 'a'.repeat(501);
            const result = validator.validate({ id: 'tab-1', title: longTitle });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('title');
        });

        it('should allow null title', () => {
            const result = validator.validate({ id: 'tab-1', title: null });
            expect(result.success).toBe(true);
        });

        it('should allow empty title', () => {
            const result = validator.validate({ id: 'tab-1', title: '' });
            expect(result.success).toBe(true);
        });
    });

    describe('loadingProgress validation', () => {
        it('should accept loadingProgress of 0', () => {
            const result = validator.validate({ id: 'tab-1', loadingProgress: 0 });
            expect(result.success).toBe(true);
            expect(result.data?.loadingProgress).toBe(0);
        });

        it('should accept loadingProgress of 1', () => {
            const result = validator.validate({ id: 'tab-1', loadingProgress: 1 });
            expect(result.success).toBe(true);
            expect(result.data?.loadingProgress).toBe(1);
        });

        it('should accept loadingProgress between 0 and 1', () => {
            const result = validator.validate({ id: 'tab-1', loadingProgress: 0.5 });
            expect(result.success).toBe(true);
            expect(result.data?.loadingProgress).toBe(0.5);
        });

        it('should reject loadingProgress less than 0', () => {
            const result = validator.validate({ id: 'tab-1', loadingProgress: -0.1 });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('loadingProgress');
        });

        it('should reject loadingProgress greater than 1', () => {
            const result = validator.validate({ id: 'tab-1', loadingProgress: 1.1 });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('loadingProgress');
        });

        it('should reject non-number loadingProgress', () => {
            const result = validator.validate({ id: 'tab-1', loadingProgress: 'half' });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('loadingProgress');
        });
    });

    describe('position validation', () => {
        it('should accept position of 0', () => {
            const result = validator.validate({ id: 'tab-1', position: 0 });
            expect(result.success).toBe(true);
            expect(result.data?.position).toBe(0);
        });

        it('should accept positive position', () => {
            const result = validator.validate({ id: 'tab-1', position: 5 });
            expect(result.success).toBe(true);
            expect(result.data?.position).toBe(5);
        });

        it('should reject negative position', () => {
            const result = validator.validate({ id: 'tab-1', position: -1 });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('position');
        });

        it('should reject non-integer position', () => {
            const result = validator.validate({ id: 'tab-1', position: 1.5 });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('position');
        });

        it('should reject non-number position', () => {
            const result = validator.validate({ id: 'tab-1', position: 'first' });
            expect(result.success).toBe(false);
            expect(result.errors[0].field).toBe('position');
        });
    });

    describe('boolean fields', () => {
        it('should accept isActive as boolean', () => {
            const result = validator.validate({ id: 'tab-1', isActive: true });
            expect(result.success).toBe(true);
            expect(result.data?.isActive).toBe(true);
        });

        it('should accept isLoading as boolean', () => {
            const result = validator.validate({ id: 'tab-1', isLoading: false });
            expect(result.success).toBe(true);
            expect(result.data?.isLoading).toBe(false);
        });

        it('should accept isTracked as boolean', () => {
            const result = validator.validate({ id: 'tab-1', isTracked: true });
            expect(result.success).toBe(true);
            expect(result.data?.isTracked).toBe(true);
        });

        it('should accept canGoBack as boolean', () => {
            const result = validator.validate({ id: 'tab-1', canGoBack: true });
            expect(result.success).toBe(true);
            expect(result.data?.canGoBack).toBe(true);
        });

        it('should accept canGoForward as boolean', () => {
            const result = validator.validate({ id: 'tab-1', canGoForward: false });
            expect(result.success).toBe(true);
            expect(result.data?.canGoForward).toBe(false);
        });

        it('should accept isSecure as boolean', () => {
            const result = validator.validate({ id: 'tab-1', isSecure: true });
            expect(result.success).toBe(true);
            expect(result.data?.isSecure).toBe(true);
        });
    });

    describe('error fields', () => {
        it('should accept errorCode as number', () => {
            const result = validator.validate({ id: 'tab-1', errorCode: 404 });
            expect(result.success).toBe(true);
            expect(result.data?.errorCode).toBe(404);
        });

        it('should accept errorCode as null', () => {
            const result = validator.validate({ id: 'tab-1', errorCode: null });
            expect(result.success).toBe(true);
            expect(result.data?.errorCode).toBeNull();
        });

        it('should accept errorDescription as string', () => {
            const result = validator.validate({ id: 'tab-1', errorDescription: 'Not Found' });
            expect(result.success).toBe(true);
            expect(result.data?.errorDescription).toBe('Not Found');
        });

        it('should accept errorDescription as null', () => {
            const result = validator.validate({ id: 'tab-1', errorDescription: null });
            expect(result.success).toBe(true);
            expect(result.data?.errorDescription).toBeNull();
        });
    });

    describe('faviconUrl validation', () => {
        it('should accept faviconUrl as string', () => {
            const result = validator.validate({ id: 'tab-1', faviconUrl: 'https://example.com/favicon.ico' });
            expect(result.success).toBe(true);
            expect(result.data?.faviconUrl).toBe('https://example.com/favicon.ico');
        });

        it('should accept faviconUrl as null', () => {
            const result = validator.validate({ id: 'tab-1', faviconUrl: null });
            expect(result.success).toBe(true);
            expect(result.data?.faviconUrl).toBeNull();
        });
    });

    describe('lastAccessedAt validation', () => {
        it('should accept lastAccessedAt as Date', () => {
            const date = new Date();
            const result = validator.validate({ id: 'tab-1', lastAccessedAt: date });
            expect(result.success).toBe(true);
            expect(result.data?.lastAccessedAt).toBe(date);
        });

        it('should accept lastAccessedAt as null', () => {
            const result = validator.validate({ id: 'tab-1', lastAccessedAt: null });
            expect(result.success).toBe(true);
            expect(result.data?.lastAccessedAt).toBeNull();
        });
    });

    describe('complete valid input', () => {
        it('should validate complete update with all fields', () => {
            const input = {
                id: 'tab-123',
                url: 'https://updated.example.com',
                title: 'Updated Title',
                faviconUrl: 'https://updated.example.com/favicon.ico',
                isTracked: false,
                isActive: true,
                isLoading: false,
                loadingProgress: 1,
                canGoBack: true,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 3,
                lastAccessedAt: new Date(),
            };

            const result = validator.validate(input);

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('tab-123');
            expect(result.data?.url).toBe('https://updated.example.com');
            expect(result.data?.title).toBe('Updated Title');
            expect(result.data?.position).toBe(3);
        });
    });

    describe('multiple validation errors', () => {
        it('should collect multiple errors', () => {
            const result = validator.validate({
                id: '',
                url: 123,
                title: 456,
                loadingProgress: -1,
                position: -5,
            });

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });
});
