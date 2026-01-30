import { describe, it, expect } from 'vitest';
import {
    TabType,
    TabEntity,
    CreateTabInput,
    UpdateTabInput,
    CREATE_TAB_DEFAULTS,
    hasOrigin,
    isTrackingOrigin,
} from '../../../src/domain/entities/Tab';

describe('Tab Domain Entities', () => {
    describe('TabType enum', () => {
        it('should have Web type with value "web"', () => {
            expect(TabType.Web).toBe('web');
        });

        it('should have Note type with value "note"', () => {
            expect(TabType.Note).toBe('note');
        });

        it('should have LocalFile type with value "localFile"', () => {
            expect(TabType.LocalFile).toBe('localFile');
        });

        it('should have exactly 3 types', () => {
            const values = Object.values(TabType);
            expect(values).toHaveLength(3);
        });
    });

    describe('TabEntity interface', () => {
        it('should have all required identity properties', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Example',
                faviconUrl: null,
                originSpaceId: null,
                originSpaceItemId: null,
                isTracked: false,
                originUrl: null,
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(tab.id).toBe('tab-1');
            expect(tab.tabType).toBe(TabType.Web);
        });

        it('should have content properties', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com/page',
                title: 'Page Title',
                faviconUrl: 'https://example.com/favicon.ico',
                originSpaceId: null,
                originSpaceItemId: null,
                isTracked: false,
                originUrl: null,
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(tab.url).toBe('https://example.com/page');
            expect(tab.title).toBe('Page Title');
            expect(tab.faviconUrl).toBe('https://example.com/favicon.ico');
        });

        it('should have origin tracking properties', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Example',
                faviconUrl: null,
                originSpaceId: 'space-123',
                originSpaceItemId: 'item-456',
                isTracked: true,
                originUrl: 'https://example.com',
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(tab.originSpaceId).toBe('space-123');
            expect(tab.originSpaceItemId).toBe('item-456');
            expect(tab.isTracked).toBe(true);
            expect(tab.originUrl).toBe('https://example.com');
        });

        it('should have state properties', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Example',
                faviconUrl: null,
                originSpaceId: null,
                originSpaceItemId: null,
                isTracked: false,
                originUrl: null,
                isActive: true,
                isLoading: true,
                loadingProgress: 0.5,
                canGoBack: true,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(tab.isActive).toBe(true);
            expect(tab.isLoading).toBe(true);
            expect(tab.loadingProgress).toBe(0.5);
            expect(tab.canGoBack).toBe(true);
            expect(tab.canGoForward).toBe(false);
        });

        it('should have security properties', () => {
            const secureTab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://secure.example.com',
                title: 'Secure Page',
                faviconUrl: null,
                originSpaceId: null,
                originSpaceItemId: null,
                isTracked: false,
                originUrl: null,
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(secureTab.isSecure).toBe(true);
        });

        it('should have error properties', () => {
            const errorTab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Error Page',
                faviconUrl: null,
                originSpaceId: null,
                originSpaceItemId: null,
                isTracked: false,
                originUrl: null,
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: false,
                errorCode: 404,
                errorDescription: 'Page not found',
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(errorTab.errorCode).toBe(404);
            expect(errorTab.errorDescription).toBe('Page not found');
        });

        it('should use Date type for date fields (not strings)', () => {
            const now = new Date();
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Example',
                faviconUrl: null,
                originSpaceId: null,
                originSpaceItemId: null,
                isTracked: false,
                originUrl: null,
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: now,
                updatedAt: now,
                lastAccessedAt: now,
            };

            expect(tab.createdAt).toBeInstanceOf(Date);
            expect(tab.updatedAt).toBeInstanceOf(Date);
            expect(tab.lastAccessedAt).toBeInstanceOf(Date);
        });

        it('should allow null for lastAccessedAt', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Example',
                faviconUrl: null,
                originSpaceId: null,
                originSpaceItemId: null,
                isTracked: false,
                originUrl: null,
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(tab.lastAccessedAt).toBeNull();
        });
    });

    describe('CREATE_TAB_DEFAULTS', () => {
        it('should have default URL', () => {
            expect(CREATE_TAB_DEFAULTS.url).toBe('https://www.google.com');
        });

        it('should have default title', () => {
            expect(CREATE_TAB_DEFAULTS.title).toBe('New Tab');
        });

        it('should have default tabType as Web', () => {
            expect(CREATE_TAB_DEFAULTS.tabType).toBe(TabType.Web);
        });

        it('should have null origin fields by default', () => {
            expect(CREATE_TAB_DEFAULTS.originSpaceId).toBeNull();
            expect(CREATE_TAB_DEFAULTS.originSpaceItemId).toBeNull();
            expect(CREATE_TAB_DEFAULTS.faviconUrl).toBeNull();
        });

        it('should activate by default', () => {
            expect(CREATE_TAB_DEFAULTS.activate).toBe(true);
        });
    });

    describe('CreateTabInput DTO', () => {
        it('should allow optional URL', () => {
            const input: CreateTabInput = {};
            expect(input.url).toBeUndefined();
        });

        it('should allow custom URL', () => {
            const input: CreateTabInput = {
                url: 'https://custom.example.com',
            };
            expect(input.url).toBe('https://custom.example.com');
        });

        it('should allow origin tracking fields', () => {
            const input: CreateTabInput = {
                originSpaceId: 'space-123',
                originSpaceItemId: 'item-456',
            };
            expect(input.originSpaceId).toBe('space-123');
            expect(input.originSpaceItemId).toBe('item-456');
        });

        it('should allow activate flag', () => {
            const inputActive: CreateTabInput = { activate: true };
            const inputInactive: CreateTabInput = { activate: false };

            expect(inputActive.activate).toBe(true);
            expect(inputInactive.activate).toBe(false);
        });
    });

    describe('UpdateTabInput DTO', () => {
        it('should require id field', () => {
            const input: UpdateTabInput = {
                id: 'tab-123',
            };
            expect(input.id).toBe('tab-123');
        });

        it('should allow partial updates', () => {
            const input: UpdateTabInput = {
                id: 'tab-123',
                title: 'New Title',
            };
            expect(input.title).toBe('New Title');
            expect(input.url).toBeUndefined();
        });

        it('should allow state updates', () => {
            const input: UpdateTabInput = {
                id: 'tab-123',
                isLoading: true,
                loadingProgress: 0.75,
                canGoBack: true,
                canGoForward: false,
            };

            expect(input.isLoading).toBe(true);
            expect(input.loadingProgress).toBe(0.75);
            expect(input.canGoBack).toBe(true);
            expect(input.canGoForward).toBe(false);
        });

        it('should allow position updates', () => {
            const input: UpdateTabInput = {
                id: 'tab-123',
                position: 5,
            };
            expect(input.position).toBe(5);
        });
    });

    describe('hasOrigin helper function', () => {
        it('should return true when both origin fields are set', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Example',
                faviconUrl: null,
                originSpaceId: 'space-123',
                originSpaceItemId: 'item-456',
                isTracked: false,
                originUrl: null,
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(hasOrigin(tab)).toBe(true);
        });

        it('should return false when originSpaceId is null', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Example',
                faviconUrl: null,
                originSpaceId: null,
                originSpaceItemId: 'item-456',
                isTracked: false,
                originUrl: null,
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(hasOrigin(tab)).toBe(false);
        });

        it('should return false when originSpaceItemId is null', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Example',
                faviconUrl: null,
                originSpaceId: 'space-123',
                originSpaceItemId: null,
                isTracked: false,
                originUrl: null,
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(hasOrigin(tab)).toBe(false);
        });

        it('should return false when both origin fields are null', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Example',
                faviconUrl: null,
                originSpaceId: null,
                originSpaceItemId: null,
                isTracked: false,
                originUrl: null,
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(hasOrigin(tab)).toBe(false);
        });
    });

    describe('isTrackingOrigin helper function', () => {
        it('should return true when has origin and is tracked', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Example',
                faviconUrl: null,
                originSpaceId: 'space-123',
                originSpaceItemId: 'item-456',
                isTracked: true,
                originUrl: 'https://example.com',
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(isTrackingOrigin(tab)).toBe(true);
        });

        it('should return false when has origin but not tracked', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://different.com',
                title: 'Different Page',
                faviconUrl: null,
                originSpaceId: 'space-123',
                originSpaceItemId: 'item-456',
                isTracked: false,
                originUrl: 'https://example.com',
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(isTrackingOrigin(tab)).toBe(false);
        });

        it('should return false when no origin', () => {
            const tab: TabEntity = {
                id: 'tab-1',
                tabType: TabType.Web,
                url: 'https://example.com',
                title: 'Example',
                faviconUrl: null,
                originSpaceId: null,
                originSpaceItemId: null,
                isTracked: true, // Even if tracked is true, no origin means not tracking
                originUrl: null,
                isActive: false,
                isLoading: false,
                loadingProgress: 0,
                canGoBack: false,
                canGoForward: false,
                isSecure: true,
                errorCode: null,
                errorDescription: null,
                position: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: null,
            };

            expect(isTrackingOrigin(tab)).toBe(false);
        });
    });
});
