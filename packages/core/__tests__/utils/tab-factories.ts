import { vi } from 'vitest';
import type { TabEntity, TabType } from '../../src/domain/entities/Tab';
import type { ITabsRepository } from '../../src/domain/repositories/ITabsRepository';
import type { IEventBus } from '../../src/domain/services/IEventBus';

/**
 * Factory for creating mock TabEntity objects
 * All required properties have defaults, override as needed
 */
export function createMockTabEntity(overrides: Partial<TabEntity> = {}): TabEntity {
    return {
        id: `tab-${Math.random().toString(36).substring(2, 11)}`,
        tabType: 'web' as TabType,
        url: 'https://example.com',
        title: 'Example Page',
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
        ...overrides,
    };
}

/**
 * Factory for creating mock ITabsRepository
 * All methods are vi.fn() mocks with sensible defaults
 */
export function createMockTabsRepository(): {
    [K in keyof ITabsRepository]: ReturnType<typeof vi.fn>;
} {
    return {
        // Query methods
        getAll: vi.fn().mockResolvedValue([]),
        getById: vi.fn().mockResolvedValue(null),
        getActive: vi.fn().mockResolvedValue(null),
        getBySpaceItemId: vi.fn().mockResolvedValue(null),
        getByUrl: vi.fn().mockResolvedValue(null),
        getBySpaceId: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        countByType: vi.fn().mockResolvedValue(0),

        // Command methods
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        setActive: vi.fn(),
        reorder: vi.fn(),
        deleteOldestInactive: vi.fn(),
        deleteBySpaceId: vi.fn(),
        updateTrackingByUrl: vi.fn(),
    };
}

/**
 * Factory for creating mock IEventBus
 */
export function createMockEventBus(): {
    [K in keyof IEventBus]: ReturnType<typeof vi.fn>;
} {
    return {
        publish: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        clear: vi.fn(),
    };
}

/**
 * Create a TabEntity with Space origin for testing tracking
 */
export function createMockTabWithOrigin(overrides: Partial<TabEntity> = {}): TabEntity {
    return createMockTabEntity({
        originSpaceId: 'space-123',
        originSpaceItemId: 'item-456',
        originUrl: 'https://example.com',
        isTracked: true,
        ...overrides,
    });
}

/**
 * Create an active tab for testing
 */
export function createMockActiveTab(overrides: Partial<TabEntity> = {}): TabEntity {
    return createMockTabEntity({
        isActive: true,
        lastAccessedAt: new Date(),
        ...overrides,
    });
}
