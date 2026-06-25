# Testing Strategy: Spec 018 - Browser Domain Layer

## Overview

Comprehensive testing strategy for the Tab domain layer ensuring correctness, robustness, and maintainability.

---

## Test Coverage Requirements

| Component | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| TabEntity helpers | 100% | 100% |
| URL Normalizer | 100% | 100% |
| CreateTabValidator | 95% | 100% |
| UpdateTabValidator | 95% | 100% |
| TabsFacade | 90% | 95% |
| Tab Events | 90% | 95% |

---

## Unit Tests

### URL Normalizer Tests

```typescript
// packages/core/__tests__/domain/validators/UrlNormalizer.test.ts

import { normalizeUrl, urlsMatch, extractDomain, isSecureUrl } from '../../../src/domain/validators/UrlNormalizer';

describe('UrlNormalizer', () => {
  describe('normalizeUrl', () => {
    it('should return empty string for null/undefined', () => {
      expect(normalizeUrl(null as any)).toBe('');
      expect(normalizeUrl(undefined as any)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(normalizeUrl('')).toBe('');
      expect(normalizeUrl('   ')).toBe('');
    });

    it('should lowercase entire URL', () => {
      expect(normalizeUrl('HTTPS://EXAMPLE.COM/PATH')).toBe('example.com/path');
    });

    it('should remove http:// protocol', () => {
      expect(normalizeUrl('http://example.com')).toBe('example.com');
    });

    it('should remove https:// protocol', () => {
      expect(normalizeUrl('https://example.com')).toBe('example.com');
    });

    it('should remove www. prefix', () => {
      expect(normalizeUrl('https://www.example.com')).toBe('example.com');
    });

    it('should remove trailing slash', () => {
      expect(normalizeUrl('https://example.com/')).toBe('example.com');
      expect(normalizeUrl('https://example.com/path/')).toBe('example.com/path');
    });

    it('should remove fragment', () => {
      expect(normalizeUrl('https://example.com/page#section')).toBe('example.com/page');
      expect(normalizeUrl('https://example.com#top')).toBe('example.com');
    });

    it('should handle complex URLs', () => {
      expect(normalizeUrl('HTTPS://WWW.Example.COM/Path/To/Page/?query=1#section'))
        .toBe('example.com/path/to/page/?query=1');
    });

    it('should preserve query parameters', () => {
      expect(normalizeUrl('https://example.com/search?q=test&page=1'))
        .toBe('example.com/search?q=test&page=1');
    });

    it('should handle protocol-relative URLs', () => {
      expect(normalizeUrl('//example.com/path')).toBe('example.com/path');
    });
  });

  describe('urlsMatch', () => {
    it('should match identical URLs', () => {
      expect(urlsMatch('https://example.com', 'https://example.com')).toBe(true);
    });

    it('should match URLs with different protocols', () => {
      expect(urlsMatch('http://example.com', 'https://example.com')).toBe(true);
    });

    it('should match URLs with/without www', () => {
      expect(urlsMatch('https://www.example.com', 'https://example.com')).toBe(true);
    });

    it('should match URLs with/without trailing slash', () => {
      expect(urlsMatch('https://example.com/', 'https://example.com')).toBe(true);
    });

    it('should match URLs with different cases', () => {
      expect(urlsMatch('https://EXAMPLE.COM', 'https://example.com')).toBe(true);
    });

    it('should not match different paths', () => {
      expect(urlsMatch('https://example.com/a', 'https://example.com/b')).toBe(false);
    });

    it('should not match different domains', () => {
      expect(urlsMatch('https://example.com', 'https://other.com')).toBe(false);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from valid URL', () => {
      expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
    });

    it('should return null for invalid URL', () => {
      expect(extractDomain('not a url')).toBeNull();
    });

    it('should handle subdomains', () => {
      expect(extractDomain('https://sub.example.com')).toBe('sub.example.com');
    });
  });

  describe('isSecureUrl', () => {
    it('should return true for https URLs', () => {
      expect(isSecureUrl('https://example.com')).toBe(true);
    });

    it('should return false for http URLs', () => {
      expect(isSecureUrl('http://example.com')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isSecureUrl('not a url')).toBe(false);
    });
  });
});
```

### CreateTabValidator Tests

```typescript
// packages/core/__tests__/domain/validators/CreateTabValidator.test.ts

import { CreateTabValidator } from '../../../src/domain/validators/CreateTabValidator';
import { TabType, CREATE_TAB_DEFAULTS } from '../../../src/domain/entities/Tab';

describe('CreateTabValidator', () => {
  const validator = new CreateTabValidator();

  describe('empty input', () => {
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

    it('should reject non-string URL', () => {
      const result = validator.validate({ url: 123 });
      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe('url');
    });

    it('should reject URL exceeding max length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2050);
      const result = validator.validate({ url: longUrl });
      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe('url');
    });

    it('should reject invalid URL format', () => {
      const result = validator.validate({ url: 'not-a-valid-url' });
      expect(result.success).toBe(false);
    });

    it('should allow empty URL (uses default)', () => {
      const result = validator.validate({ url: '' });
      expect(result.success).toBe(true);
    });
  });

  describe('title validation', () => {
    it('should accept valid title', () => {
      const result = validator.validate({ title: 'My Tab' });
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('My Tab');
    });

    it('should reject non-string title', () => {
      const result = validator.validate({ title: 123 });
      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe('title');
    });

    it('should reject title exceeding max length', () => {
      const longTitle = 'a'.repeat(501);
      const result = validator.validate({ title: longTitle });
      expect(result.success).toBe(false);
    });
  });

  describe('tabType validation', () => {
    it('should accept valid tab types', () => {
      expect(validator.validate({ tabType: TabType.Web }).success).toBe(true);
      expect(validator.validate({ tabType: TabType.Note }).success).toBe(true);
      expect(validator.validate({ tabType: TabType.LocalFile }).success).toBe(true);
    });

    it('should reject invalid tab type', () => {
      const result = validator.validate({ tabType: 'invalid' });
      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe('tabType');
    });
  });

  describe('origin validation', () => {
    it('should accept both origin fields together', () => {
      const result = validator.validate({
        originSpaceId: 'space-123',
        originSpaceItemId: 'item-456',
      });
      expect(result.success).toBe(true);
    });

    it('should accept neither origin field', () => {
      const result = validator.validate({});
      expect(result.success).toBe(true);
      expect(result.data?.originSpaceId).toBeNull();
      expect(result.data?.originSpaceItemId).toBeNull();
    });

    it('should reject only originSpaceId', () => {
      const result = validator.validate({ originSpaceId: 'space-123' });
      expect(result.success).toBe(false);
    });

    it('should reject only originSpaceItemId', () => {
      const result = validator.validate({ originSpaceItemId: 'item-456' });
      expect(result.success).toBe(false);
    });
  });
});
```

### TabsFacade Tests

```typescript
// packages/core/__tests__/application/facades/TabsFacade.test.ts

import { TabsFacade } from '../../../src/application/facades/TabsFacade';
import { ITabsRepository } from '../../../src/domain/repositories/ITabsRepository';
import { TabEntity, TabType } from '../../../src/domain/entities/Tab';

describe('TabsFacade', () => {
  let facade: TabsFacade;
  let mockRepository: jest.Mocked<ITabsRepository>;
  let mockEventBus: { publish: jest.Mock };

  const createMockTab = (overrides: Partial<TabEntity> = {}): TabEntity => ({
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
    ...overrides,
  });

  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getActive: jest.fn(),
      getBySpaceItemId: jest.fn(),
      getByUrl: jest.fn(),
      getBySpaceId: jest.fn(),
      count: jest.fn(),
      countByType: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setActive: jest.fn(),
      reorder: jest.fn(),
      deleteOldestInactive: jest.fn(),
      deleteBySpaceId: jest.fn(),
      updateTrackingByUrl: jest.fn(),
    };

    mockEventBus = { publish: jest.fn() };
    facade = new TabsFacade(mockRepository, mockEventBus as any);
  });

  describe('createTab', () => {
    it('should create new tab when no duplicates exist', async () => {
      mockRepository.count.mockResolvedValue(5);
      mockRepository.getBySpaceItemId.mockResolvedValue(null);
      mockRepository.getByUrl.mockResolvedValue(null);
      
      const newTab = createMockTab({ id: 'new-tab' });
      mockRepository.create.mockResolvedValue(newTab);

      const result = await facade.createTab({ url: 'https://new.com' });

      expect(result.ok).toBe(true);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should activate existing tab when duplicate by SpaceItemId', async () => {
      mockRepository.count.mockResolvedValue(5);
      
      const existingTab = createMockTab({ id: 'existing' });
      mockRepository.getBySpaceItemId.mockResolvedValue(existingTab);

      const result = await facade.createTab({
        url: 'https://example.com',
        originSpaceItemId: 'item-123',
        originSpaceId: 'space-123',
      });

      expect(result.ok).toBe(true);
      expect(result.value).toBe(existingTab);
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.setActive).toHaveBeenCalledWith('existing');
    });

    it('should activate existing tab when duplicate by URL', async () => {
      mockRepository.count.mockResolvedValue(5);
      mockRepository.getBySpaceItemId.mockResolvedValue(null);
      
      const existingTab = createMockTab({ id: 'existing' });
      mockRepository.getByUrl.mockResolvedValue(existingTab);

      const result = await facade.createTab({ url: 'https://example.com' });

      expect(result.ok).toBe(true);
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.setActive).toHaveBeenCalledWith('existing');
    });

    it('should delete oldest inactive when at tab limit', async () => {
      mockRepository.count.mockResolvedValue(20); // At limit
      mockRepository.getBySpaceItemId.mockResolvedValue(null);
      mockRepository.getByUrl.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createMockTab());

      await facade.createTab({ url: 'https://new.com' });

      expect(mockRepository.deleteOldestInactive).toHaveBeenCalled();
    });

    it('should return error for invalid input', async () => {
      const result = await facade.createTab({ url: 123 as any });

      expect(result.ok).toBe(false);
    });
  });

  describe('updateTabUrl', () => {
    it('should update tracking status when navigating away', async () => {
      const tab = createMockTab({
        id: 'tab-1',
        url: 'https://original.com',
        originUrl: 'https://original.com',
        originSpaceItemId: 'item-123',
        isTracked: true,
      });
      mockRepository.getById.mockResolvedValue(tab);
      mockRepository.update.mockResolvedValue({ ...tab, url: 'https://different.com', isTracked: false });

      const result = await facade.updateTabUrl('tab-1', 'https://different.com');

      expect(result.ok).toBe(true);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(2); // TrackingChanged + Navigated
    });

    it('should maintain tracking when URL matches origin', async () => {
      const tab = createMockTab({
        id: 'tab-1',
        url: 'https://example.com',
        originUrl: 'https://example.com',
        isTracked: true,
      });
      mockRepository.getById.mockResolvedValue(tab);
      mockRepository.update.mockResolvedValue({ ...tab, url: 'https://example.com/' });

      const result = await facade.updateTabUrl('tab-1', 'https://example.com/');

      expect(result.ok).toBe(true);
      // Tracking should remain true (normalized URLs match)
    });
  });

  describe('shouldHighlightSpaceItem', () => {
    it('should return true when active tab tracks the item', async () => {
      const activeTab = createMockTab({
        originSpaceItemId: 'item-123',
        isTracked: true,
        isActive: true,
      });
      mockRepository.getActive.mockResolvedValue(activeTab);

      const result = await facade.shouldHighlightSpaceItem('item-123');

      expect(result.ok).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should return false when active tab is not tracking', async () => {
      const activeTab = createMockTab({
        originSpaceItemId: 'item-123',
        isTracked: false,
        isActive: true,
      });
      mockRepository.getActive.mockResolvedValue(activeTab);

      const result = await facade.shouldHighlightSpaceItem('item-123');

      expect(result.ok).toBe(true);
      expect(result.value).toBe(false);
    });

    it('should return false when no active tab', async () => {
      mockRepository.getActive.mockResolvedValue(null);

      const result = await facade.shouldHighlightSpaceItem('item-123');

      expect(result.ok).toBe(true);
      expect(result.value).toBe(false);
    });
  });
});
```

---

## Integration Tests

### Repository Integration (Mock SQLite)

```typescript
// packages/core/__tests__/integration/tabs-repository.integration.test.ts

describe('Tabs Repository Integration', () => {
  // These tests would use a mock or in-memory SQLite
  // to test the full flow from facade to repository
  
  it('should persist and retrieve tabs');
  it('should handle concurrent tab creation');
  it('should maintain position ordering');
  it('should cascade delete tabs when Space is deleted');
});
```

---

## Edge Case Tests

### Boundary Conditions

```typescript
describe('Edge Cases', () => {
  describe('URL edge cases', () => {
    it('should handle very long URLs (up to 2048 chars)');
    it('should handle URLs with unicode characters');
    it('should handle URLs with special characters');
    it('should handle IDN domains');
  });

  describe('Tab limit edge cases', () => {
    it('should handle exactly MAX_TABS tabs');
    it('should handle all tabs being active');
    it('should handle rapid tab creation');
  });

  describe('Tracking edge cases', () => {
    it('should handle URL redirects');
    it('should handle URL with added query params');
    it('should handle URL case changes');
  });
});
```

---

## Test Utilities

### Test Factories

```typescript
// packages/core/__tests__/utils/factories.ts

export function createMockTabEntity(overrides: Partial<TabEntity> = {}): TabEntity {
  return {
    id: `tab-${Math.random().toString(36).substr(2, 9)}`,
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
    ...overrides,
  };
}

export function createMockTabsRepository(): jest.Mocked<ITabsRepository> {
  return {
    getAll: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue(null),
    getActive: jest.fn().mockResolvedValue(null),
    getBySpaceItemId: jest.fn().mockResolvedValue(null),
    getByUrl: jest.fn().mockResolvedValue(null),
    getBySpaceId: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    countByType: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    setActive: jest.fn(),
    reorder: jest.fn(),
    deleteOldestInactive: jest.fn(),
    deleteBySpaceId: jest.fn(),
    updateTrackingByUrl: jest.fn(),
  };
}
```

---

## Coverage Report Template

```
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
domain/entities/   |         |          |         |         |
  Tab.ts           |   100   |   100    |   100   |   100   |
domain/validators/ |         |          |         |         |
  UrlNormalizer.ts |   100   |   100    |   100   |   100   |
  CreateTabVal...  |    98   |    95    |   100   |    98   |
  UpdateTabVal...  |    98   |    95    |   100   |    98   |
domain/events/     |         |          |         |         |
  TabEvents.ts     |   100   |   100    |   100   |   100   |
application/       |         |          |         |         |
  TabsFacade.ts    |    95   |    90    |    95   |    95   |
-------------------|---------|----------|---------|---------|
```
