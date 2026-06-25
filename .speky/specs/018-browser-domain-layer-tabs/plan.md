# Implementation Plan: Browser Domain Layer - Tab Entities (018)

## Phase 1: Entity Definitions (Day 1)

### 1.1 Tab Entity
- [ ] Create `packages/core/src/domain/entities/Tab.ts`
- [ ] Define TabType enum (Web, Note, LocalFile)
- [ ] Define TabEntity interface with 23+ readonly properties
- [ ] Add origin tracking fields (originSpaceId, originSpaceItemId, isTracked, originUrl)
- [ ] Add state fields (isActive, isLoading, loadingProgress, canGoBack, canGoForward)
- [ ] Add security fields (isSecure, errorCode, errorDescription)
- [ ] Add timestamp fields (createdAt, updatedAt, lastAccessedAt)
- [ ] Implement hasOrigin() helper function
- [ ] Implement isTrackingOrigin() helper function

### 1.2 Input DTOs
- [ ] Define CreateTabInput interface with optional fields
- [ ] Define CREATE_TAB_DEFAULTS constant object
- [ ] Define UpdateTabInput interface with required id
- [ ] Export all from entities/index.ts

### 1.3 Constants
- [ ] Create `packages/core/src/domain/constants/TabConstants.ts`
- [ ] Define MAX_WEB_TABS = 20
- [ ] Define MAX_TOTAL_TABS = 50
- [ ] Define DEFAULT_URL, DEFAULT_TITLE
- [ ] Define MAX_URL_LENGTH, MAX_TITLE_LENGTH
- [ ] Define INACTIVE_TAB_TIMEOUT_DAYS
- [ ] Create and update constants/index.ts barrel export

## Phase 2: Repository Interface (Day 1)

### 2.1 ITabsRepository
- [ ] Create `packages/core/src/domain/repositories/ITabsRepository.ts`
- [ ] Define getAll(): Promise<TabEntity[]>
- [ ] Define getById(id): Promise<TabEntity | null>
- [ ] Define getActive(): Promise<TabEntity | null>
- [ ] Define getBySpaceItemId(spaceItemId): Promise<TabEntity | null>
- [ ] Define getByUrl(url): Promise<TabEntity | null>
- [ ] Define getBySpaceId(spaceId): Promise<TabEntity[]>
- [ ] Define count(): Promise<number>
- [ ] Define countByType(tabType): Promise<number>
- [ ] Define create(input): Promise<TabEntity>
- [ ] Define update(input): Promise<TabEntity>
- [ ] Define delete(id): Promise<void>
- [ ] Define setActive(id): Promise<void>
- [ ] Define reorder(orderedIds): Promise<void>
- [ ] Define deleteOldestInactive(): Promise<void>
- [ ] Define deleteBySpaceId(spaceId): Promise<void>
- [ ] Define updateTrackingByUrl(...): Promise<void>
- [ ] Update repositories/index.ts barrel export

## Phase 3: URL Normalization (Day 1)

### 3.1 UrlNormalizer
- [ ] Create `packages/core/src/domain/validators/UrlNormalizer.ts`
- [ ] Implement normalizeUrl() function
  - [ ] Handle null/undefined input
  - [ ] Lowercase entire URL
  - [ ] Remove protocol (http://, https://)
  - [ ] Remove www. prefix
  - [ ] Remove trailing slash
  - [ ] Remove fragment (#...)
  - [ ] Trim whitespace
- [ ] Implement urlsMatch() function
- [ ] Implement extractDomain() function
- [ ] Implement isSecureUrl() function
- [ ] Write unit tests for all functions (100% coverage)

## Phase 4: Validators (Day 2)

### 4.1 CreateTabValidator
- [ ] Create `packages/core/src/domain/validators/CreateTabValidator.ts`
- [ ] Define MAX_URL_LENGTH = 2048
- [ ] Define MAX_TITLE_LENGTH = 500
- [ ] Define URL_PATTERN regex
- [ ] Implement validate() method
  - [ ] Handle empty/null input (return defaults)
  - [ ] Validate URL format and length
  - [ ] Validate title length
  - [ ] Validate tabType enum
  - [ ] Validate origin fields (both or neither)
  - [ ] Merge with defaults
  - [ ] Return ValidationResult<CreateTabInput>

### 4.2 UpdateTabValidator
- [ ] Create `packages/core/src/domain/validators/UpdateTabValidator.ts`
- [ ] Implement validate() method
  - [ ] Require id field
  - [ ] Validate URL if provided
  - [ ] Validate title if provided
  - [ ] Validate loadingProgress 0-1 range
  - [ ] Validate position non-negative integer
  - [ ] Return ValidationResult<UpdateTabInput>

### 4.3 Validator Tests
- [ ] Write unit tests for CreateTabValidator (>90% coverage)
- [ ] Write unit tests for UpdateTabValidator (>90% coverage)
- [ ] Update validators/index.ts barrel export

## Phase 5: Domain Events (Day 2)

### 5.1 Tab Events
- [ ] Create `packages/core/src/domain/events/TabEvents.ts`
- [ ] Implement TabCreatedEvent with payload
- [ ] Implement TabClosedEvent with wasActive flag
- [ ] Implement TabActivatedEvent with previousTabId
- [ ] Implement TabNavigatedEvent with url, previousUrl, isTracked
- [ ] Implement TabTrackingChangedEvent with originSpaceItemId, isTracked
- [ ] Implement TabsReorderedEvent with orderedIds
- [ ] All events implement DomainEvent interface
- [ ] All events have readonly properties
- [ ] Update events/index.ts barrel export

## Phase 6: TabsFacade (Day 2-3)

### 6.1 Facade Implementation
- [ ] Create `packages/core/src/application/facades/TabsFacade.ts`
- [ ] Define MAX_TABS = 20 constant
- [ ] Constructor takes ITabsRepository and optional IEventBus
- [ ] Initialize validators in constructor

### 6.2 Query Methods
- [ ] Implement getTabs(): Promise<Result<TabEntity[], Error>>
- [ ] Implement getTab(id): Promise<Result<TabEntity | null, Error>>
- [ ] Implement getActiveTab(): Promise<Result<TabEntity | null, Error>>
- [ ] Implement getTabCount(): Promise<Result<number, Error>>
- [ ] Implement findTabBySpaceItem(spaceItemId): Promise<Result<TabEntity | null, Error>>

### 6.3 Command Methods
- [ ] Implement createTab(input): Promise<Result<TabEntity, Error>>
  - [ ] Validate input
  - [ ] Check tab limit, delete oldest if needed
  - [ ] Check duplicate by SpaceItemId (primary)
  - [ ] Check duplicate by URL (secondary)
  - [ ] Create tab via repository
  - [ ] Emit TabCreatedEvent
- [ ] Implement createTabFromSpace(params): Promise<Result<TabEntity, Error>>
- [ ] Implement updateTab(input): Promise<Result<TabEntity, Error>>
- [ ] Implement updateTabUrl(tabId, newUrl): Promise<Result<TabEntity, Error>>
  - [ ] Get existing tab
  - [ ] Determine tracking status
  - [ ] Emit TabTrackingChangedEvent if changed
  - [ ] Update via repository
  - [ ] Emit TabNavigatedEvent
- [ ] Implement switchTab(tabId): Promise<Result<void, Error>>
  - [ ] Get current active tab
  - [ ] Set new active tab
  - [ ] Emit TabActivatedEvent
- [ ] Implement closeTab(tabId): Promise<Result<void, Error>>
  - [ ] Get tab to check wasActive
  - [ ] Delete via repository
  - [ ] Emit TabClosedEvent
- [ ] Implement reorderTabs(orderedIds): Promise<Result<void, Error>>

### 6.4 Helper Methods
- [ ] Implement shouldHighlightSpaceItem(spaceItemId): Promise<Result<boolean, Error>>
- [ ] Implement private emitEvent(event): Promise<void>

### 6.5 Facade Tests
- [ ] Write unit tests with mock repository
- [ ] Test duplicate detection (SpaceItemId)
- [ ] Test duplicate detection (URL)
- [ ] Test tab limit enforcement
- [ ] Test tracking status updates
- [ ] Test event emission
- [ ] Update facades/index.ts barrel export

## Phase 7: Integration (Day 3)

### 7.1 Barrel Exports
- [ ] Update `packages/core/src/domain/index.ts`
- [ ] Update `packages/core/src/application/index.ts`
- [ ] Update `packages/core/src/index.ts`
- [ ] Verify all exports accessible via @spayce/core

### 7.2 Type Checking
- [ ] Run `pnpm tsc --noEmit` in packages/core
- [ ] Fix any TypeScript errors
- [ ] Ensure strict mode compliance

### 7.3 Documentation
- [ ] Add JSDoc comments to all public APIs
- [ ] Update tech_decisions.md with tab domain decisions
- [ ] Document integration patterns for infrastructure layer

## Verification Checklist

### Entity Correctness
- [ ] All TabEntity properties are readonly
- [ ] Date fields use Date type, not strings
- [ ] TabType enum has correct values
- [ ] Helper functions work correctly

### Repository Contract
- [ ] All methods defined
- [ ] Return types correct
- [ ] Promise-based async

### URL Normalization
- [ ] Handles all edge cases
- [ ] 100% test coverage
- [ ] Performance acceptable (<1ms)

### Validators
- [ ] All validation rules enforced
- [ ] Clear error messages
- [ ] >90% test coverage

### Facade
- [ ] All methods return Result<T, Error>
- [ ] Duplicate detection works
- [ ] Tab limit enforced
- [ ] Events emitted correctly

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] All tests pass
- [ ] No circular dependencies
- [ ] Zero external dependencies
