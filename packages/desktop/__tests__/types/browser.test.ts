import { describe, it, expect, beforeEach } from 'vitest';

describe('Browser Types', () => {
    let types: any;

    beforeEach(async () => {
        types = await import('../../src/types/browser');
    });

    describe('ViewBounds', () => {
        it('should have x, y, width, height properties', () => {
            const bounds: typeof types.ViewBounds = {
                x: 100,
                y: 50,
                width: 800,
                height: 600,
            };

            expect(bounds.x).toBe(100);
            expect(bounds.y).toBe(50);
            expect(bounds.width).toBe(800);
            expect(bounds.height).toBe(600);
        });
    });

    describe('BrowserViewState', () => {
        it('should have all required properties', () => {
            const state: typeof types.BrowserViewState = {
                id: 'view-123',
                url: 'https://example.com',
                title: 'Example',
                isLoading: false,
                loadingProgress: 1,
                canGoBack: true,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
            };

            expect(state.id).toBe('view-123');
            expect(state.url).toBe('https://example.com');
            expect(state.title).toBe('Example');
            expect(state.isLoading).toBe(false);
            expect(state.loadingProgress).toBe(1);
            expect(state.canGoBack).toBe(true);
            expect(state.canGoForward).toBe(false);
            expect(state.isSecure).toBe(true);
            expect(state.errorCode).toBeNull();
            expect(state.errorDescription).toBeNull();
        });

        it('should support error state', () => {
            const state: typeof types.BrowserViewState = {
                id: 'view-123',
                url: 'https://failed.com',
                title: 'Error',
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: false,
                errorCode: -6,
                errorDescription: 'ERR_CONNECTION_REFUSED',
            };

            expect(state.errorCode).toBe(-6);
            expect(state.errorDescription).toBe('ERR_CONNECTION_REFUSED');
        });
    });

    describe('CreateViewOptions', () => {
        it('should support optional url', () => {
            const options: typeof types.CreateViewOptions = {
                url: 'https://example.com',
            };

            expect(options.url).toBe('https://example.com');
        });

        it('should support optional userAgent', () => {
            const options: typeof types.CreateViewOptions = {
                userAgent: 'Custom UA',
            };

            expect(options.userAgent).toBe('Custom UA');
        });

        it('should support optional partition', () => {
            const options: typeof types.CreateViewOptions = {
                partition: 'persist:custom',
            };

            expect(options.partition).toBe('persist:custom');
        });

        it('should support all options together', () => {
            const options: typeof types.CreateViewOptions = {
                url: 'https://example.com',
                userAgent: 'Custom UA',
                partition: 'persist:custom',
            };

            expect(options.url).toBe('https://example.com');
            expect(options.userAgent).toBe('Custom UA');
            expect(options.partition).toBe('persist:custom');
        });

        it('should support empty options', () => {
            const options: typeof types.CreateViewOptions = {};

            expect(options.url).toBeUndefined();
            expect(options.userAgent).toBeUndefined();
            expect(options.partition).toBeUndefined();
        });
    });

    describe('BrowserIPCResponse', () => {
        it('should have success property', () => {
            const response: typeof types.BrowserIPCResponse = {
                success: true,
            };

            expect(response.success).toBe(true);
        });

        it('should support error property', () => {
            const response: typeof types.BrowserIPCResponse = {
                success: false,
                error: 'Something went wrong',
            };

            expect(response.success).toBe(false);
            expect(response.error).toBe('Something went wrong');
        });

        it('should support data property', () => {
            const response: typeof types.BrowserIPCResponse = {
                success: true,
                data: { viewId: 'view-123' },
            };

            expect(response.success).toBe(true);
            expect(response.data).toEqual({ viewId: 'view-123' });
        });
    });

    describe('BrowserLoadingEvent', () => {
        it('should have viewId and isLoading', () => {
            const event: typeof types.BrowserLoadingEvent = {
                viewId: 'view-123',
                isLoading: true,
            };

            expect(event.viewId).toBe('view-123');
            expect(event.isLoading).toBe(true);
        });
    });

    describe('BrowserNavigatedEvent', () => {
        it('should have all navigation properties', () => {
            const event: typeof types.BrowserNavigatedEvent = {
                viewId: 'view-123',
                url: 'https://example.com',
                canGoBack: true,
                canGoForward: false,
                isSecure: true,
            };

            expect(event.viewId).toBe('view-123');
            expect(event.url).toBe('https://example.com');
            expect(event.canGoBack).toBe(true);
            expect(event.canGoForward).toBe(false);
            expect(event.isSecure).toBe(true);
        });
    });

    describe('BrowserTitleEvent', () => {
        it('should have viewId and title', () => {
            const event: typeof types.BrowserTitleEvent = {
                viewId: 'view-123',
                title: 'Page Title',
            };

            expect(event.viewId).toBe('view-123');
            expect(event.title).toBe('Page Title');
        });
    });

    describe('BrowserFaviconEvent', () => {
        it('should have viewId and faviconUrl', () => {
            const event: typeof types.BrowserFaviconEvent = {
                viewId: 'view-123',
                faviconUrl: 'https://example.com/favicon.ico',
            };

            expect(event.viewId).toBe('view-123');
            expect(event.faviconUrl).toBe('https://example.com/favicon.ico');
        });

        it('should support null faviconUrl', () => {
            const event: typeof types.BrowserFaviconEvent = {
                viewId: 'view-123',
                faviconUrl: null,
            };

            expect(event.faviconUrl).toBeNull();
        });
    });

    describe('BrowserProgressEvent', () => {
        it('should have viewId and progress', () => {
            const event: typeof types.BrowserProgressEvent = {
                viewId: 'view-123',
                progress: 0.75,
            };

            expect(event.viewId).toBe('view-123');
            expect(event.progress).toBe(0.75);
        });
    });

    describe('BrowserErrorEvent', () => {
        it('should have all error properties', () => {
            const event: typeof types.BrowserErrorEvent = {
                viewId: 'view-123',
                errorCode: -6,
                errorDescription: 'ERR_CONNECTION_REFUSED',
                failedUrl: 'https://failed.com',
            };

            expect(event.viewId).toBe('view-123');
            expect(event.errorCode).toBe(-6);
            expect(event.errorDescription).toBe('ERR_CONNECTION_REFUSED');
            expect(event.failedUrl).toBe('https://failed.com');
        });
    });
});
