# Spec 018: Browser Domain Layer - Tab Entities

## Overview

Implement the domain layer for browser tabs following Clean Architecture principles established in Specs 007-009. This layer contains immutable tab entities, repository interfaces, use cases, and the TabsFacade for orchestrating tab operations. The domain layer has **ZERO external dependencies** and integrates with the existing Spaces system for origin tracking.

> **CRITICAL**: This spec follows the same architectural patterns as Specs 007-009. All entities are immutable (readonly), all operations are async, and the facade provides the clean API for UI consumption.

## Dependencies & Scope Coordination

**Dependencies:**
- **Spec 007**: Core domain layer (entity patterns, error patterns, validators)
- **Spec 008**: Infrastructure layer (repository implementation patterns)
- **Spec 009**: Application layer (use case patterns, facade patterns)
- **Spec 017**: BrowserService (conceptual alignment for state)

**Integration Points:**
- TabEntity references SpaceEntity via originSpaceId
- TabEntity references SpaceItemEntity via originSpaceItemId
- Repository implementation will use same SQLite patterns as SpacesRepository
- Uses same Result<T, Error> pattern as existing facades

**This Spec Covers:**
- TabEntity interface with all properties (readonly, immutable)
- TabType enum (web, note, localFile)
- ITabsRepository interface (async operations)
- Tab use cases (Create, Get, Update, Delete, Reorder)
- TabsFacade for application layer API
- Tab validators (URL, input validation)
- Tab-related domain events
- URL normalization for duplicate detection

**Out of Scope:**
- SQLite repository implementation (infrastructure spec)
- React hooks and UI components (Spec 019)
- WebContentsView management (Spec 017)
- Tab bar UI (Spec 020)

### Related Documents

| Document | Purpose |
|----------|---------|
| [plan.md](./plan.md) | Implementation phases and timeline |
| [status.json](./status.json) | Metadata, dependencies, and tracking |
| [testing-strategy.md](./testing-strategy.md) | Test patterns, coverage requirements, examples |
| [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) | Step-by-step implementation instructions |

> **For Implementation**: Start with [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) which directs you to the relevant sections of each document.

## User Stories

### US-018-001: Tab Entity Definition
- **As a developer**, I want a strongly-typed TabEntity interface so that tab data is consistently structured across the application
- **Acceptance Criteria:**
  - Given I import TabEntity from @spayce/core
  - Then I have access to all tab properties with correct TypeScript types
  - And all properties are readonly (immutable)
  - And date fields use Date type, not strings
  - And origin tracking fields link to Spaces

### US-018-002: Tab Repository Contract
- **As a developer**, I want a repository interface that defines all tab operations so that infrastructure implementations are interchangeable
- **Acceptance Criteria:**
  - Given I need to implement tab persistence
  - When I implement ITabsRepository interface
  - Then the implementation is compatible with all consuming code
  - And TypeScript enforces all required method signatures

### US-018-003: Tab Duplicate Detection
- **As a developer**, I want to detect duplicate tabs so that users don't open the same page multiple times
- **Acceptance Criteria:**
  - Given a tab is being created from a Space item
  - When I check for existing tabs
  - Then I can find duplicates by originSpaceItemId (primary)
  - And I can find duplicates by normalized URL (secondary)
  - And URL normalization handles trailing slashes, fragments, www prefix

### US-018-004: Tab Limit Management
- **As a developer**, I want to enforce a maximum tab limit so that the application remains performant
- **Acceptance Criteria:**
  - Given MAX_TABS is 20
  - When a new tab is created and limit is reached
  - Then the oldest inactive tab is automatically closed
  - And active tabs are never auto-closed

### US-018-005: Origin Tracking
- **As a developer**, I want tabs to track their Space origin so that the sidebar can highlight active items
- **Acceptance Criteria:**
  - Given a tab is opened from a Space item
  - When the user navigates to a different URL
  - Then isTracked becomes false
  - And the original Space item is no longer highlighted

## MVP Scope

### Included:
- TabEntity interface with 20+ properties
- TabType enum (web, note, localFile)
- CreateTabInput and UpdateTabInput DTOs
- ITabsRepository with 12 methods
- TabsFacade with Result<T> returns
- CreateTabUseCase with duplicate detection
- URL normalization utility
- Tab validators
- Domain events (TabCreated, TabClosed, TabActivated)

### Excluded:
- Repository implementation (infrastructure layer)
- Persistence (SQLite tables)
- UI hooks and components
- WebContentsView binding

## Requirements

### R1: Domain Entities

#### 1.1 TabType Enum

```typescript
// packages/core/src/domain/entities/Tab.ts

/**
 * Tab content types - extensible for future content formats
 * Matches Flutter TabType enum
 */
export enum TabType {
  /** WebView-based browser tab */
  Web = 'web',
  /** Rich text/Markdown note (future) */
  Note = 'note',
  /** Local file viewer (future) */
  LocalFile = 'localFile',
}
```

#### 1.2 TabEntity Interface

```typescript
// packages/core/src/domain/entities/Tab.ts

/**
 * Browser tab entity - immutable
 * 
 * Design Decisions:
 * - All properties readonly for immutability
 * - Date fields use Date type (not strings)
 * - Origin tracking for Spaces integration
 * - Position for tab ordering
 * 
 * @see Flutter: frontend/lib/features/browser/domain/tab_model.dart
 */
export interface TabEntity {
  // Identity
  readonly id: string;
  readonly tabType: TabType;
  
  // Content
  readonly url: string;
  readonly title: string;
  readonly faviconUrl: string | null;
  
  // Origin tracking for Spaces integration
  /** The Space this tab was opened from (if any) */
  readonly originSpaceId: string | null;
  /** The Space item this tab was opened from (if any) */
  readonly originSpaceItemId: string | null;
  /** 
   * False if navigated away from origin URL.
   * Used for sidebar highlighting - only tracked tabs highlight their origin.
   */
  readonly isTracked: boolean;
  /** The original URL when opened from Space (for tracking comparison) */
  readonly originUrl: string | null;
  
  // State
  readonly isActive: boolean;
  readonly isLoading: boolean;
  readonly loadingProgress: number;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  
  // Security
  readonly isSecure: boolean;
  
  // Error state
  readonly errorCode: number | null;
  readonly errorDescription: string | null;
  
  // Position
  readonly position: number;
  
  // Timestamps
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastAccessedAt: Date | null;
}

/**
 * Check if a tab has a Space origin
 */
export function hasOrigin(tab: TabEntity): boolean {
  return tab.originSpaceId !== null && tab.originSpaceItemId !== null;
}

/**
 * Check if a tab is currently tracking its origin
 */
export function isTrackingOrigin(tab: TabEntity): boolean {
  return hasOrigin(tab) && tab.isTracked;
}
```

#### 1.3 CreateTabInput DTO

```typescript
// packages/core/src/domain/entities/Tab.ts

/**
 * Input for creating a new tab
 * 
 * Most fields are optional with sensible defaults:
 * - url defaults to google.com
 * - title defaults to "New Tab"
 * - tabType defaults to Web
 */
export interface CreateTabInput {
  /** URL to load (default: https://www.google.com) */
  readonly url?: string;
  /** Tab title (default: "New Tab") */
  readonly title?: string;
  /** Tab type (default: Web) */
  readonly tabType?: TabType;
  /** Favicon URL if known */
  readonly faviconUrl?: string | null;
  /** Space ID if opened from a Space */
  readonly originSpaceId?: string | null;
  /** Space item ID if opened from a Space item */
  readonly originSpaceItemId?: string | null;
  /** Whether to make this the active tab (default: true) */
  readonly activate?: boolean;
}

/**
 * Default values for tab creation
 */
export const CREATE_TAB_DEFAULTS: Required<Omit<CreateTabInput, 'originSpaceId' | 'originSpaceItemId' | 'faviconUrl'>> & {
  originSpaceId: null;
  originSpaceItemId: null;
  faviconUrl: null;
} = {
  url: 'https://www.google.com',
  title: 'New Tab',
  tabType: TabType.Web,
  faviconUrl: null,
  originSpaceId: null,
  originSpaceItemId: null,
  activate: true,
};
```

#### 1.4 UpdateTabInput DTO

```typescript
// packages/core/src/domain/entities/Tab.ts

/**
 * Input for updating a tab
 * 
 * Only specified fields are updated.
 * The id field is required to identify the tab.
 */
export interface UpdateTabInput {
  /** Tab ID (required) */
  readonly id: string;
  /** New URL */
  readonly url?: string;
  /** New title */
  readonly title?: string;
  /** New favicon URL */
  readonly faviconUrl?: string | null;
  /** Update tracking status */
  readonly isTracked?: boolean;
  /** Update active status */
  readonly isActive?: boolean;
  /** Update loading status */
  readonly isLoading?: boolean;
  /** Update loading progress (0-1) */
  readonly loadingProgress?: number;
  /** Update back navigation capability */
  readonly canGoBack?: boolean;
  /** Update forward navigation capability */
  readonly canGoForward?: boolean;
  /** Update security status */
  readonly isSecure?: boolean;
  /** Update error code */
  readonly errorCode?: number | null;
  /** Update error description */
  readonly errorDescription?: string | null;
  /** Update position */
  readonly position?: number;
  /** Update last accessed time */
  readonly lastAccessedAt?: Date | null;
}
```

---

### R2: Repository Interface

#### 2.1 ITabsRepository

```typescript
// packages/core/src/domain/repositories/ITabsRepository.ts

import type { TabEntity, CreateTabInput, UpdateTabInput } from '../entities/Tab';

/**
 * Tab repository interface
 * 
 * Design Decisions:
 * - All methods async (Promise-based)
 * - Query methods return null for not found (not throw)
 * - Command methods throw on failure
 * - Matches patterns from ISpacesRepository (Spec 007)
 */
export interface ITabsRepository {
  // ============ Query Operations ============
  
  /**
   * Get all tabs ordered by position
   */
  getAll(): Promise<TabEntity[]>;

  /**
   * Get a tab by ID
   * @returns Tab or null if not found
   */
  getById(id: string): Promise<TabEntity | null>;

  /**
   * Get the currently active tab
   * @returns Active tab or null if none
   */
  getActive(): Promise<TabEntity | null>;

  /**
   * Get tab by Space item ID (primary duplicate detection)
   * @returns Tab or null if not found
   */
  getBySpaceItemId(spaceItemId: string): Promise<TabEntity | null>;

  /**
   * Get tab by normalized URL (secondary duplicate detection)
   * @param url - URL to search (will be normalized)
   * @returns Tab or null if not found
   */
  getByUrl(url: string): Promise<TabEntity | null>;

  /**
   * Get tabs by Space ID (all tabs from a Space)
   * @returns Array of tabs, may be empty
   */
  getBySpaceId(spaceId: string): Promise<TabEntity[]>;

  /**
   * Get current tab count
   */
  count(): Promise<number>;

  /**
   * Get count of tabs by type
   */
  countByType(tabType: string): Promise<number>;

  // ============ Command Operations ============

  /**
   * Create a new tab
   * @returns The created tab with generated ID and timestamps
   */
  create(input: CreateTabInput): Promise<TabEntity>;

  /**
   * Update an existing tab
   * @returns The updated tab
   * @throws EntityNotFoundError if tab doesn't exist
   */
  update(input: UpdateTabInput): Promise<TabEntity>;

  /**
   * Delete a tab by ID
   * @throws EntityNotFoundError if tab doesn't exist
   */
  delete(id: string): Promise<void>;

  /**
   * Set a tab as active (deactivates all others)
   * @throws EntityNotFoundError if tab doesn't exist
   */
  setActive(id: string): Promise<void>;

  /**
   * Reorder tabs by providing ordered IDs
   * @param orderedIds - Tab IDs in desired order
   */
  reorder(orderedIds: string[]): Promise<void>;

  /**
   * Delete the oldest inactive tab (for tab limit management)
   * Does nothing if no inactive tabs exist
   */
  deleteOldestInactive(): Promise<void>;

  /**
   * Delete all tabs by Space ID (cleanup when Space deleted)
   */
  deleteBySpaceId(spaceId: string): Promise<void>;

  /**
   * Update tracking status for all tabs from a Space item
   * Called when user navigates away from origin URL
   */
  updateTrackingByUrl(spaceItemId: string, newUrl: string, originUrl: string): Promise<void>;
}
```

---

### R3: URL Normalization Utility

#### 3.1 URL Normalizer

```typescript
// packages/core/src/domain/validators/UrlNormalizer.ts

/**
 * URL normalization for duplicate detection
 * 
 * Normalization rules:
 * 1. Lowercase the entire URL
 * 2. Remove protocol (http://, https://)
 * 3. Remove www. prefix
 * 4. Remove trailing slash
 * 5. Remove fragment (#...)
 * 6. Trim whitespace
 * 
 * @example
 * normalizeUrl('HTTPS://WWW.Example.COM/path/') => 'example.com/path'
 * normalizeUrl('http://example.com/page#section') => 'example.com/page'
 */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let normalized = url.toLowerCase().trim();

  // Remove protocol
  normalized = normalized
    .replace(/^https?:\/\//, '')
    .replace(/^\/\//, '');

  // Remove www. prefix
  if (normalized.startsWith('www.')) {
    normalized = normalized.substring(4);
  }

  // Remove trailing slash
  if (normalized.endsWith('/')) {
    normalized = normalized.substring(0, normalized.length - 1);
  }

  // Remove fragment
  const fragmentIndex = normalized.indexOf('#');
  if (fragmentIndex !== -1) {
    normalized = normalized.substring(0, fragmentIndex);
  }

  return normalized;
}

/**
 * Compare two URLs for equality after normalization
 */
export function urlsMatch(url1: string, url2: string): boolean {
  return normalizeUrl(url1) === normalizeUrl(url2);
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Check if URL is secure (https)
 */
export function isSecureUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}
```

---

### R4: Tab Validators

#### 4.1 CreateTabValidator

```typescript
// packages/core/src/domain/validators/CreateTabValidator.ts

import { ValidationError } from '../errors/ValidationError';
import type { ValidationResult } from './SchemaValidator';
import type { CreateTabInput } from '../entities/Tab';
import { TabType, CREATE_TAB_DEFAULTS } from '../entities/Tab';

/**
 * Validates CreateTabInput
 */
export class CreateTabValidator {
  static readonly MAX_URL_LENGTH = 2048;
  static readonly MAX_TITLE_LENGTH = 500;
  static readonly URL_PATTERN = /^https?:\/\/.+/;

  validate(input: unknown): ValidationResult<CreateTabInput> {
    const errors: ValidationError[] = [];

    if (!input || typeof input !== 'object') {
      // Return defaults for empty input (new tab)
      return {
        success: true,
        data: CREATE_TAB_DEFAULTS,
        errors: [],
      };
    }

    const data = input as Record<string, unknown>;

    // Validate URL if provided
    if (data.url !== undefined) {
      if (typeof data.url !== 'string') {
        errors.push(new ValidationError('url', data.url, 'must be a string'));
      } else if (data.url.length > CreateTabValidator.MAX_URL_LENGTH) {
        errors.push(new ValidationError('url', data.url, `must be at most ${CreateTabValidator.MAX_URL_LENGTH} characters`));
      } else if (data.url.trim().length > 0 && !CreateTabValidator.URL_PATTERN.test(data.url)) {
        // Non-empty URL must be valid
        errors.push(new ValidationError('url', data.url, 'must be a valid HTTP/HTTPS URL'));
      }
    }

    // Validate title if provided
    if (data.title !== undefined) {
      if (typeof data.title !== 'string') {
        errors.push(new ValidationError('title', data.title, 'must be a string'));
      } else if (data.title.length > CreateTabValidator.MAX_TITLE_LENGTH) {
        errors.push(new ValidationError('title', data.title, `must be at most ${CreateTabValidator.MAX_TITLE_LENGTH} characters`));
      }
    }

    // Validate tabType if provided
    if (data.tabType !== undefined) {
      if (!Object.values(TabType).includes(data.tabType as TabType)) {
        errors.push(new ValidationError('tabType', data.tabType, `must be one of: ${Object.values(TabType).join(', ')}`));
      }
    }

    // Validate origin fields (both or neither)
    const hasOriginSpace = data.originSpaceId !== undefined && data.originSpaceId !== null;
    const hasOriginItem = data.originSpaceItemId !== undefined && data.originSpaceItemId !== null;
    if (hasOriginSpace !== hasOriginItem) {
      errors.push(new ValidationError('originSpaceId', data.originSpaceId, 'originSpaceId and originSpaceItemId must both be provided or both be null'));
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Merge with defaults
    const validated: CreateTabInput = {
      url: (data.url as string | undefined) ?? CREATE_TAB_DEFAULTS.url,
      title: (data.title as string | undefined) ?? CREATE_TAB_DEFAULTS.title,
      tabType: (data.tabType as TabType | undefined) ?? CREATE_TAB_DEFAULTS.tabType,
      faviconUrl: (data.faviconUrl as string | null | undefined) ?? CREATE_TAB_DEFAULTS.faviconUrl,
      originSpaceId: (data.originSpaceId as string | null | undefined) ?? CREATE_TAB_DEFAULTS.originSpaceId,
      originSpaceItemId: (data.originSpaceItemId as string | null | undefined) ?? CREATE_TAB_DEFAULTS.originSpaceItemId,
      activate: (data.activate as boolean | undefined) ?? CREATE_TAB_DEFAULTS.activate,
    };

    return {
      success: true,
      data: validated,
      errors: [],
    };
  }
}
```

#### 4.2 UpdateTabValidator

```typescript
// packages/core/src/domain/validators/UpdateTabValidator.ts

import { ValidationError } from '../errors/ValidationError';
import type { ValidationResult } from './SchemaValidator';
import type { UpdateTabInput } from '../entities/Tab';

/**
 * Validates UpdateTabInput
 */
export class UpdateTabValidator {
  static readonly MAX_URL_LENGTH = 2048;
  static readonly MAX_TITLE_LENGTH = 500;

  validate(input: unknown): ValidationResult<UpdateTabInput> {
    const errors: ValidationError[] = [];

    if (!input || typeof input !== 'object') {
      errors.push(new ValidationError('input', input, 'must be an object'));
      return { success: false, errors };
    }

    const data = input as Record<string, unknown>;

    // ID is required
    if (!data.id || typeof data.id !== 'string') {
      errors.push(new ValidationError('id', data.id, 'must be a non-empty string'));
    }

    // Validate URL if provided
    if (data.url !== undefined && data.url !== null) {
      if (typeof data.url !== 'string') {
        errors.push(new ValidationError('url', data.url, 'must be a string'));
      } else if (data.url.length > UpdateTabValidator.MAX_URL_LENGTH) {
        errors.push(new ValidationError('url', data.url, `must be at most ${UpdateTabValidator.MAX_URL_LENGTH} characters`));
      }
    }

    // Validate title if provided
    if (data.title !== undefined && data.title !== null) {
      if (typeof data.title !== 'string') {
        errors.push(new ValidationError('title', data.title, 'must be a string'));
      } else if (data.title.length > UpdateTabValidator.MAX_TITLE_LENGTH) {
        errors.push(new ValidationError('title', data.title, `must be at most ${UpdateTabValidator.MAX_TITLE_LENGTH} characters`));
      }
    }

    // Validate loadingProgress if provided
    if (data.loadingProgress !== undefined) {
      if (typeof data.loadingProgress !== 'number') {
        errors.push(new ValidationError('loadingProgress', data.loadingProgress, 'must be a number'));
      } else if (data.loadingProgress < 0 || data.loadingProgress > 1) {
        errors.push(new ValidationError('loadingProgress', data.loadingProgress, 'must be between 0 and 1'));
      }
    }

    // Validate position if provided
    if (data.position !== undefined) {
      if (typeof data.position !== 'number' || !Number.isInteger(data.position)) {
        errors.push(new ValidationError('position', data.position, 'must be an integer'));
      } else if (data.position < 0) {
        errors.push(new ValidationError('position', data.position, 'must be non-negative'));
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: data as UpdateTabInput,
      errors: [],
    };
  }
}
```

---

### R5: Domain Events

#### 5.1 Tab Events

```typescript
// packages/core/src/domain/events/TabEvents.ts

import type { DomainEvent } from './DomainEvent';

/**
 * Event fired when a tab is created
 */
export class TabCreatedEvent implements DomainEvent {
  readonly type = 'tab.created';
  readonly timestamp = new Date();

  constructor(
    readonly payload: {
      readonly tabId: string;
      readonly url: string;
      readonly originSpaceId: string | null;
      readonly originSpaceItemId: string | null;
    }
  ) {}
}

/**
 * Event fired when a tab is closed
 */
export class TabClosedEvent implements DomainEvent {
  readonly type = 'tab.closed';
  readonly timestamp = new Date();

  constructor(
    readonly payload: {
      readonly tabId: string;
      readonly wasActive: boolean;
    }
  ) {}
}

/**
 * Event fired when a tab becomes active
 */
export class TabActivatedEvent implements DomainEvent {
  readonly type = 'tab.activated';
  readonly timestamp = new Date();

  constructor(
    readonly payload: {
      readonly tabId: string;
      readonly previousTabId: string | null;
    }
  ) {}
}

/**
 * Event fired when a tab navigates to a new URL
 */
export class TabNavigatedEvent implements DomainEvent {
  readonly type = 'tab.navigated';
  readonly timestamp = new Date();

  constructor(
    readonly payload: {
      readonly tabId: string;
      readonly url: string;
      readonly previousUrl: string;
      readonly isTracked: boolean;
    }
  ) {}
}

/**
 * Event fired when a tab's tracking status changes
 */
export class TabTrackingChangedEvent implements DomainEvent {
  readonly type = 'tab.tracking-changed';
  readonly timestamp = new Date();

  constructor(
    readonly payload: {
      readonly tabId: string;
      readonly originSpaceItemId: string;
      readonly isTracked: boolean;
    }
  ) {}
}

/**
 * Event fired when tabs are reordered
 */
export class TabsReorderedEvent implements DomainEvent {
  readonly type = 'tabs.reordered';
  readonly timestamp = new Date();

  constructor(
    readonly payload: {
      readonly orderedIds: readonly string[];
    }
  ) {}
}
```

---

### R6: TabsFacade

#### 6.1 Application Facade

```typescript
// packages/core/src/application/facades/TabsFacade.ts

import type { Result } from '../common/Result';
import type { TabEntity, CreateTabInput, UpdateTabInput } from '../../domain/entities/Tab';
import type { ITabsRepository } from '../../domain/repositories/ITabsRepository';
import type { IEventBus } from '../../domain/services/IEventBus';
import { CreateTabValidator } from '../../domain/validators/CreateTabValidator';
import { UpdateTabValidator } from '../../domain/validators/UpdateTabValidator';
import { normalizeUrl, urlsMatch } from '../../domain/validators/UrlNormalizer';
import { TabCreatedEvent, TabClosedEvent, TabActivatedEvent, TabNavigatedEvent, TabTrackingChangedEvent } from '../../domain/events/TabEvents';
import { ValidationError } from '../../domain/errors/ValidationError';
import { EntityNotFoundError } from '../../domain/errors/EntityNotFoundError';

/**
 * Application facade for tab operations
 * 
 * Design Decisions:
 * - Returns Result<T, Error> for all operations
 * - Emits domain events for cross-cutting concerns
 * - Handles duplicate detection (by SpaceItemId, then by URL)
 * - Manages tab limit (MAX_TABS = 20)
 * - Follows same patterns as SpacesFacade (Spec 009)
 */
export class TabsFacade {
  private readonly MAX_TABS = 20;
  private readonly createValidator = new CreateTabValidator();
  private readonly updateValidator = new UpdateTabValidator();

  constructor(
    private readonly tabsRepository: ITabsRepository,
    private readonly eventBus?: IEventBus
  ) {}

  // ============ Query Operations ============

  /**
   * Get all tabs ordered by position
   */
  async getTabs(): Promise<Result<TabEntity[], Error>> {
    try {
      const tabs = await this.tabsRepository.getAll();
      return { ok: true, value: tabs };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  /**
   * Get a single tab by ID
   */
  async getTab(id: string): Promise<Result<TabEntity | null, Error>> {
    try {
      const tab = await this.tabsRepository.getById(id);
      return { ok: true, value: tab };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  /**
   * Get the currently active tab
   */
  async getActiveTab(): Promise<Result<TabEntity | null, Error>> {
    try {
      const tab = await this.tabsRepository.getActive();
      return { ok: true, value: tab };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  /**
   * Get tab count
   */
  async getTabCount(): Promise<Result<number, Error>> {
    try {
      const count = await this.tabsRepository.count();
      return { ok: true, value: count };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  /**
   * Find tab by Space item ID (for sidebar highlighting)
   */
  async findTabBySpaceItem(spaceItemId: string): Promise<Result<TabEntity | null, Error>> {
    try {
      const tab = await this.tabsRepository.getBySpaceItemId(spaceItemId);
      return { ok: true, value: tab };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  // ============ Command Operations ============

  /**
   * Create a new tab
   * 
   * Handles:
   * - Validation
   * - Duplicate detection (by SpaceItemId, then by URL)
   * - Tab limit enforcement
   * - Event emission
   */
  async createTab(input: CreateTabInput): Promise<Result<TabEntity, Error>> {
    try {
      // Validate input
      const validation = this.createValidator.validate(input);
      if (!validation.success) {
        return { ok: false, error: validation.errors[0] };
      }
      const validatedInput = validation.data!;

      // Check tab limit
      const count = await this.tabsRepository.count();
      if (count >= this.MAX_TABS) {
        await this.tabsRepository.deleteOldestInactive();
      }

      // PRIMARY: Check for duplicate by Space item ID
      if (validatedInput.originSpaceItemId) {
        const existing = await this.tabsRepository.getBySpaceItemId(validatedInput.originSpaceItemId);
        if (existing) {
          // Activate existing tab instead of creating duplicate
          if (validatedInput.activate) {
            await this.tabsRepository.setActive(existing.id);
            await this.emitEvent(new TabActivatedEvent({
              tabId: existing.id,
              previousTabId: null, // TODO: track previous
            }));
          }
          return { ok: true, value: existing };
        }
      }

      // SECONDARY: Check for duplicate by URL
      if (validatedInput.url) {
        const existing = await this.tabsRepository.getByUrl(validatedInput.url);
        if (existing) {
          // Activate existing tab instead of creating duplicate
          if (validatedInput.activate) {
            await this.tabsRepository.setActive(existing.id);
            await this.emitEvent(new TabActivatedEvent({
              tabId: existing.id,
              previousTabId: null,
            }));
          }
          return { ok: true, value: existing };
        }
      }

      // Create new tab
      const tab = await this.tabsRepository.create(validatedInput);

      // Emit event
      await this.emitEvent(new TabCreatedEvent({
        tabId: tab.id,
        url: tab.url,
        originSpaceId: tab.originSpaceId,
        originSpaceItemId: tab.originSpaceItemId,
      }));

      return { ok: true, value: tab };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  /**
   * Create a tab from a Space item with origin tracking
   * Convenience method that sets up origin tracking
   */
  async createTabFromSpace(params: {
    url: string;
    title: string;
    spaceId: string;
    spaceItemId: string;
    faviconUrl?: string | null;
  }): Promise<Result<TabEntity, Error>> {
    return this.createTab({
      url: params.url,
      title: params.title,
      originSpaceId: params.spaceId,
      originSpaceItemId: params.spaceItemId,
      faviconUrl: params.faviconUrl,
      activate: true,
    });
  }

  /**
   * Update a tab
   */
  async updateTab(input: UpdateTabInput): Promise<Result<TabEntity, Error>> {
    try {
      // Validate input
      const validation = this.updateValidator.validate(input);
      if (!validation.success) {
        return { ok: false, error: validation.errors[0] };
      }

      const tab = await this.tabsRepository.update(input);
      return { ok: true, value: tab };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  /**
   * Update tab URL and handle tracking status
   */
  async updateTabUrl(tabId: string, newUrl: string): Promise<Result<TabEntity, Error>> {
    try {
      const existing = await this.tabsRepository.getById(tabId);
      if (!existing) {
        return { ok: false, error: new EntityNotFoundError('Tab', tabId) };
      }

      const previousUrl = existing.url;
      
      // Determine if still tracking origin
      let isTracked = existing.isTracked;
      if (existing.originUrl && isTracked) {
        isTracked = urlsMatch(newUrl, existing.originUrl);
        
        // Emit tracking changed event if status changed
        if (isTracked !== existing.isTracked && existing.originSpaceItemId) {
          await this.emitEvent(new TabTrackingChangedEvent({
            tabId,
            originSpaceItemId: existing.originSpaceItemId,
            isTracked,
          }));
        }
      }

      const tab = await this.tabsRepository.update({
        id: tabId,
        url: newUrl,
        isTracked,
        isSecure: newUrl.startsWith('https://'),
      });

      // Emit navigation event
      await this.emitEvent(new TabNavigatedEvent({
        tabId,
        url: newUrl,
        previousUrl,
        isTracked,
      }));

      return { ok: true, value: tab };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  /**
   * Switch to a tab (make it active)
   */
  async switchTab(tabId: string): Promise<Result<void, Error>> {
    try {
      const currentActive = await this.tabsRepository.getActive();
      await this.tabsRepository.setActive(tabId);
      
      await this.emitEvent(new TabActivatedEvent({
        tabId,
        previousTabId: currentActive?.id ?? null,
      }));

      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  /**
   * Close a tab
   */
  async closeTab(tabId: string): Promise<Result<void, Error>> {
    try {
      const tab = await this.tabsRepository.getById(tabId);
      if (!tab) {
        return { ok: false, error: new EntityNotFoundError('Tab', tabId) };
      }

      const wasActive = tab.isActive;
      await this.tabsRepository.delete(tabId);

      await this.emitEvent(new TabClosedEvent({
        tabId,
        wasActive,
      }));

      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  /**
   * Reorder tabs
   */
  async reorderTabs(orderedIds: string[]): Promise<Result<void, Error>> {
    try {
      await this.tabsRepository.reorder(orderedIds);
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  /**
   * Check if a Space item should be highlighted (has active tracked tab)
   */
  async shouldHighlightSpaceItem(spaceItemId: string): Promise<Result<boolean, Error>> {
    try {
      const activeTab = await this.tabsRepository.getActive();
      if (!activeTab) {
        return { ok: true, value: false };
      }

      const shouldHighlight = 
        activeTab.originSpaceItemId === spaceItemId && 
        activeTab.isTracked;

      return { ok: true, value: shouldHighlight };
    } catch (error) {
      return { ok: false, error: error as Error };
    }
  }

  // ============ Private Helpers ============

  private async emitEvent(event: unknown): Promise<void> {
    if (this.eventBus) {
      await this.eventBus.publish(event as any);
    }
  }
}
```

---

### R7: Constants

```typescript
// packages/core/src/domain/constants/TabConstants.ts

/**
 * Tab-related constants
 */
export const TAB_CONSTANTS = {
  /** Maximum number of web tabs */
  MAX_WEB_TABS: 20,
  
  /** Maximum number of total tabs (all types) */
  MAX_TOTAL_TABS: 50,
  
  /** Default URL for new tabs */
  DEFAULT_URL: 'https://www.google.com',
  
  /** Default title for new tabs */
  DEFAULT_TITLE: 'New Tab',
  
  /** Maximum URL length */
  MAX_URL_LENGTH: 2048,
  
  /** Maximum title length */
  MAX_TITLE_LENGTH: 500,
  
  /** Inactive tab timeout (days) */
  INACTIVE_TAB_TIMEOUT_DAYS: 30,
} as const;
```

---

## Acceptance Criteria

### Entity Definitions
- [ ] TabEntity interface with 23+ readonly properties
- [ ] TabType enum with 3 values (Web, Note, LocalFile)
- [ ] CreateTabInput DTO with optional fields and defaults
- [ ] UpdateTabInput DTO with required id
- [ ] hasOrigin() and isTrackingOrigin() helper functions
- [ ] All date fields use Date type

### Repository Interface
- [ ] ITabsRepository with 14 methods
- [ ] 7 query methods (getAll, getById, getActive, getBySpaceItemId, getByUrl, getBySpaceId, count, countByType)
- [ ] 7 command methods (create, update, delete, setActive, reorder, deleteOldestInactive, deleteBySpaceId, updateTrackingByUrl)
- [ ] All methods return Promise

### URL Normalization
- [ ] normalizeUrl() handles all cases
- [ ] Removes protocol, www, trailing slash, fragment
- [ ] urlsMatch() compares normalized URLs
- [ ] extractDomain() extracts hostname
- [ ] isSecureUrl() checks https

### Validators
- [ ] CreateTabValidator validates all fields
- [ ] URL length limit enforced
- [ ] Title length limit enforced
- [ ] TabType enum validated
- [ ] Origin fields validated (both or neither)
- [ ] UpdateTabValidator validates all fields
- [ ] loadingProgress 0-1 range validated
- [ ] position non-negative validated

### Domain Events
- [ ] TabCreatedEvent with payload
- [ ] TabClosedEvent with wasActive
- [ ] TabActivatedEvent with previousTabId
- [ ] TabNavigatedEvent with tracking
- [ ] TabTrackingChangedEvent
- [ ] TabsReorderedEvent
- [ ] All events immutable

### TabsFacade
- [ ] All methods return Result<T, Error>
- [ ] createTab() handles duplicate detection
- [ ] createTab() enforces tab limit
- [ ] createTabFromSpace() convenience method
- [ ] updateTabUrl() updates tracking status
- [ ] switchTab() activates tab
- [ ] closeTab() removes tab
- [ ] shouldHighlightSpaceItem() for sidebar
- [ ] Events emitted for all mutations

### Testing
- [ ] Unit tests for URL normalization (100% coverage)
- [ ] Unit tests for validators (>90% coverage)
- [ ] Unit tests for TabsFacade (mock repository)
- [ ] All tests pass

---

## File Structure

```
packages/core/src/
├── domain/
│   ├── entities/
│   │   ├── Tab.ts                      # NEW: TabEntity, DTOs, helpers
│   │   └── index.ts                    # Update: Export Tab
│   ├── repositories/
│   │   ├── ITabsRepository.ts          # NEW: Repository interface
│   │   └── index.ts                    # Update: Export ITabsRepository
│   ├── validators/
│   │   ├── UrlNormalizer.ts            # NEW: URL normalization
│   │   ├── CreateTabValidator.ts       # NEW: Create validation
│   │   ├── UpdateTabValidator.ts       # NEW: Update validation
│   │   └── index.ts                    # Update: Export validators
│   ├── events/
│   │   ├── TabEvents.ts                # NEW: Tab events
│   │   └── index.ts                    # Update: Export events
│   ├── constants/
│   │   ├── TabConstants.ts             # NEW: Tab constants
│   │   └── index.ts                    # Update: Export constants
│   └── index.ts                        # Update: Export all
├── application/
│   ├── facades/
│   │   ├── TabsFacade.ts               # NEW: Tabs facade
│   │   └── index.ts                    # Update: Export facade
│   └── index.ts                        # Update: Export all
└── index.ts                            # Update: Export all
```

---

## Dependencies

- **007** (core-domain-layer) - Entity patterns, error patterns
- **008** (infrastructure-layer) - Repository patterns
- **009** (application-layer) - Facade patterns
- **017** (browser-foundation) - Conceptual alignment

## Blocks

- **019** (single-tab-browser-mvp) - Needs tab entities
- **020** (tab-bar-ui) - Needs tab facade
- **021-031** (advanced browser features)

## Estimated Duration

2-3 days

## Flutter Reference

**Source**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/domain/tab_model.dart`

Key patterns replicated:
- Lines 4-8: TabType enum
- Lines 12-54: BrowserTab class properties → TabEntity
- Lines 56-82: Factory constructors → createTabFromSpace
- Lines 99-116: URL normalization → UrlNormalizer

**Source**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/data/tab_manager.dart`

Key patterns replicated:
- Lines 53-54: maxWebTabs, inactiveTabTimeout → TAB_CONSTANTS
- Lines 189-212: findTabBySpaceItem, findTabByUrl → ITabsRepository methods
- Lines 214-240: URL normalization → normalizeUrl()
- Lines 502-507: shouldHighlightSpaceItem → TabsFacade method

## Tech Decisions Update

After completing this spec, update `.speky/context/tech_decisions.md`:

```markdown
### 11. Browser Domain Layer - Tab Entities (Spec 018)

| Decision | Value | Rationale |
|----------|-------|-----------|
| Entity Pattern | Immutable interface (readonly) | Matches Spec 007 patterns |
| Repository Pattern | Promise-based async | Framework-agnostic |
| Duplicate Detection | SpaceItemId primary, URL secondary | Most reliable identification |
| Tab Limit | 20 web tabs max | Performance and UX balance |
| URL Normalization | Lowercase, no protocol/www/trailing slash | Accurate duplicate detection |
| Tracking | isTracked flag with originUrl | Sidebar highlighting |
```
