import { describe, it, expect, beforeEach } from 'vitest';

describe('BrowserErrors', () => {
    let BrowserError: any;
    let ViewNotFoundError: any;
    let InvalidURLError: any;
    let NavigationError: any;
    let ServiceNotInitializedError: any;

    beforeEach(async () => {
        const module = await import('../../src/main/services/errors/BrowserErrors');
        BrowserError = module.BrowserError;
        ViewNotFoundError = module.ViewNotFoundError;
        InvalidURLError = module.InvalidURLError;
        NavigationError = module.NavigationError;
        ServiceNotInitializedError = module.ServiceNotInitializedError;
    });

    describe('BrowserError', () => {
        it('should create error with message and code', () => {
            const error = new BrowserError('Test error', 'TEST_CODE');

            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_CODE');
            expect(error.name).toBe('BrowserError');
        });

        it('should create error with viewId', () => {
            const error = new BrowserError('Test error', 'TEST_CODE', 'view-123');

            expect(error.viewId).toBe('view-123');
        });

        it('should be instance of Error', () => {
            const error = new BrowserError('Test error', 'TEST_CODE');

            expect(error).toBeInstanceOf(Error);
        });
    });

    describe('ViewNotFoundError', () => {
        it('should create error with viewId', () => {
            const error = new ViewNotFoundError('view-123');

            expect(error.message).toContain('view-123');
            expect(error.code).toBe('VIEW_NOT_FOUND');
            expect(error.viewId).toBe('view-123');
            expect(error.name).toBe('ViewNotFoundError');
        });

        it('should be instance of BrowserError', () => {
            const error = new ViewNotFoundError('view-123');

            expect(error).toBeInstanceOf(BrowserError);
        });
    });

    describe('InvalidURLError', () => {
        it('should create error with URL', () => {
            const error = new InvalidURLError('javascript:alert(1)');

            expect(error.message).toContain('javascript:alert(1)');
            expect(error.code).toBe('INVALID_URL');
            expect(error.name).toBe('InvalidURLError');
        });

        it('should create error with URL and viewId', () => {
            const error = new InvalidURLError('invalid-url', 'view-123');

            expect(error.viewId).toBe('view-123');
        });

        it('should be instance of BrowserError', () => {
            const error = new InvalidURLError('bad-url');

            expect(error).toBeInstanceOf(BrowserError);
        });
    });

    describe('NavigationError', () => {
        it('should create error with message, viewId, and failedUrl', () => {
            const error = new NavigationError('Navigation failed', 'view-123', 'https://failed.com');

            expect(error.message).toBe('Navigation failed');
            expect(error.code).toBe('NAVIGATION_ERROR');
            expect(error.viewId).toBe('view-123');
            expect(error.failedUrl).toBe('https://failed.com');
            expect(error.name).toBe('NavigationError');
        });

        it('should be instance of BrowserError', () => {
            const error = new NavigationError('Failed', 'view-123', 'https://example.com');

            expect(error).toBeInstanceOf(BrowserError);
        });
    });

    describe('ServiceNotInitializedError', () => {
        it('should create error with default message', () => {
            const error = new ServiceNotInitializedError();

            expect(error.message).toContain('not initialized');
            expect(error.code).toBe('SERVICE_NOT_INITIALIZED');
            expect(error.name).toBe('ServiceNotInitializedError');
        });

        it('should not have viewId', () => {
            const error = new ServiceNotInitializedError();

            expect(error.viewId).toBeUndefined();
        });

        it('should be instance of BrowserError', () => {
            const error = new ServiceNotInitializedError();

            expect(error).toBeInstanceOf(BrowserError);
        });
    });
});
