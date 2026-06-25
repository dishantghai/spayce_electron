# Implementation Guide: Spec 018 - Browser Domain Layer

## How to Use This Guide

This guide provides step-by-step instructions for implementing the Tab domain layer.
Read this file first, then follow the phases in order.

---

## Quick Reference

| Document | Consult When... |
|----------|----------------|
| spec.md | Always - primary requirements |
| plan.md | Starting each phase |
| testing-strategy.md | Writing unit tests, creating mocks |
| status.json | Checking dependencies |

---

## Phase 1: Entity Definitions (Day 1 Morning)

### Read First
1. `spec.md` - Section R1 (Domain Entities)
2. Flutter reference: `tab_model.dart` for property alignment

### Implement

```typescript
// packages/core/src/domain/entities/Tab.ts

// From spec.md R1.1: TabType enum
export enum TabType {
  Web = 'web',
  Note = 'note',
  LocalFile = 'localFile',
}

// From spec.md R1.2: TabEntity interface (IMMUTABLE - all readonly)
export interface TabEntity {
  readonly id: string;
  readonly tabType: TabType;
  readonly url: string;
  readonly title: string;
  readonly faviconUrl: string | null;
  // ... all properties from spec.md R1.2
}

// From spec.md R1.3: Helper functions
export function createTabEntity(dto: CreateTabDTO): TabEntity { ... }
export function updateTabEntity(tab: TabEntity, dto: UpdateTabDTO): TabEntity { ... }
```

### Verify
- [ ] All properties from spec.md R1.2 included
- [ ] All properties are `readonly`
- [ ] TabType enum matches Flutter's enum values
- [ ] Helper functions return new objects (immutability)

---

## Phase 2: Repository Interface (Day 1 Afternoon)

### Read First
1. `spec.md` - Section R2 (Repository Interface)
2. Existing pattern: `packages/core/src/domain/repositories/ISpacesRepository.ts`

### Implement

```typescript
// packages/core/src/domain/repositories/ITabsRepository.ts

// From spec.md R2.1: Repository interface
export interface ITabsRepository {
  // Query methods (from spec.md R2.1)
  getAll(): Promise<TabEntity[]>;
  getById(id: string): Promise<TabEntity | null>;
  getActive(): Promise<TabEntity | null>;
  getBySpaceItemId(spaceItemId: string): Promise<TabEntity | null>; // For duplicate detection
  getByUrl(normalizedUrl: string): Promise<TabEntity | null>;       // For duplicate detection
  
  // Mutation methods (from spec.md R2.2)
  create(dto: CreateTabDTO): Promise<TabEntity>;
  update(id: string, dto: UpdateTabDTO): Promise<TabEntity>;
  delete(id: string): Promise<void>;
  
  // Special operations (from spec.md R2.3)
  setActive(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
  deleteOldestInactive(): Promise<void>; // For tab limit
}
```

### Verify
- [ ] All methods from spec.md R2 included
- [ ] Method signatures match existing repository patterns
- [ ] All return types use Promise (async)
- [ ] Null handling consistent with ISpacesRepository

---

## Phase 3: URL Normalization (Day 1 Late Afternoon)

### Read First
1. `spec.md` - Section R3 (URL Normalization)
2. `testing-strategy.md` - URL Normalizer Tests section

### Implement

```typescript
// packages/core/src/domain/validators/UrlNormalizer.ts

// From spec.md R3.1: normalizeUrl function
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  let normalized = url.trim().toLowerCase();
  
  // Remove protocol (from spec.md R3.1)
  normalized = normalized.replace(/^https?:\/\//, '');
  normalized = normalized.replace(/^\/\//, '');
  
  // Remove www (from spec.md R3.1)
  normalized = normalized.replace(/^www\./, '');
  
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  
  // Remove fragment
  normalized = normalized.replace(/#.*$/, '');
  
  return normalized;
}

// From spec.md R3.2: urlsMatch function
export function urlsMatch(url1: string, url2: string): boolean {
  return normalizeUrl(url1) === normalizeUrl(url2);
}
```

### Verify
- [ ] All test cases from testing-strategy.md pass
- [ ] Handles edge cases (null, undefined, empty)
- [ ] Protocol removal works for http, https, //
- [ ] Fragment removal preserves query params

---

## Phase 4: Validators (Day 2 Morning)

### Read First
1. `spec.md` - Section R4 (Validators)
2. `testing-strategy.md` - CreateTabValidator Tests section
3. Existing pattern: `packages/core/src/domain/validators/`

### Implement

```typescript
// packages/core/src/domain/validators/CreateTabValidator.ts

// From spec.md R4.1: CreateTabValidator
export class CreateTabValidator {
  validate(input: unknown): ValidationResult<CreateTabDTO> {
    const errors: ValidationError[] = [];
    
    // URL validation (from spec.md R4.1)
    if (input.url && typeof input.url !== 'string') {
      errors.push({ field: 'url', message: 'URL must be a string' });
    }
    if (input.url && input.url.length > 2048) {
      errors.push({ field: 'url', message: 'URL exceeds maximum length' });
    }
    
    // Origin validation (from spec.md R4.1)
    // Both originSpaceId and originSpaceItemId must be present or both absent
    const hasSpaceId = !!input.originSpaceId;
    const hasItemId = !!input.originSpaceItemId;
    if (hasSpaceId !== hasItemId) {
      errors.push({ 
        field: 'origin', 
        message: 'Both originSpaceId and originSpaceItemId required together' 
      });
    }
    
    // ... more validations from spec.md R4.1
    
    return errors.length ? { success: false, errors } : { success: true, data: validated };
  }
}
```

### Verify
- [ ] All validation rules from spec.md R4 implemented
- [ ] All test cases from testing-strategy.md pass
- [ ] Origin fields validated together
- [ ] URL length limit enforced (2048)

---

## Phase 5: Domain Events (Day 2 Afternoon)

### Read First
1. `spec.md` - Section R5 (Domain Events)
2. Existing pattern: `packages/core/src/domain/events/`

### Implement

```typescript
// packages/core/src/domain/events/TabEvents.ts

// From spec.md R5: All tab domain events
export const TabEvents = {
  TAB_CREATED: 'tab:created',
  TAB_UPDATED: 'tab:updated',
  TAB_DELETED: 'tab:deleted',
  TAB_ACTIVATED: 'tab:activated',
  TAB_NAVIGATED: 'tab:navigated',
  TAB_TRACKING_CHANGED: 'tab:tracking-changed',
  TAB_REORDERED: 'tab:reordered',
} as const;

// Event payloads (from spec.md R5)
export interface TabCreatedEvent {
  type: typeof TabEvents.TAB_CREATED;
  payload: { tab: TabEntity };
}

// ... more event interfaces from spec.md R5
```

### Verify
- [ ] All events from spec.md R5 defined
- [ ] Event payloads match spec requirements
- [ ] Consistent with existing event patterns

---

## Phase 6: TabsFacade (Day 2 Late Afternoon)

### Read First
1. `spec.md` - Section R6 (TabsFacade)
2. `testing-strategy.md` - TabsFacade Tests section
3. Existing pattern: `packages/core/src/application/facades/SpacesFacade.ts`

### Implement

```typescript
// packages/core/src/application/facades/TabsFacade.ts

// From spec.md R6: TabsFacade
export class TabsFacade {
  constructor(
    private readonly repository: ITabsRepository,
    private readonly eventBus: IEventBus,
  ) {}

  // From spec.md R6.1: createTab with duplicate detection
  async createTab(dto: CreateTabDTO): Promise<Result<TabEntity, Error>> {
    // 1. Validate input
    const validation = this.validator.validate(dto);
    if (!validation.success) {
      return Result.err(new ValidationError(validation.errors));
    }
    
    // 2. Check duplicates by SpaceItemId (primary) - from spec.md R6.1
    if (dto.originSpaceItemId) {
      const existing = await this.repository.getBySpaceItemId(dto.originSpaceItemId);
      if (existing) {
        await this.repository.setActive(existing.id);
        return Result.ok(existing);
      }
    }
    
    // 3. Check duplicates by URL (secondary) - from spec.md R6.1
    const normalizedUrl = normalizeUrl(dto.url);
    const existingByUrl = await this.repository.getByUrl(normalizedUrl);
    if (existingByUrl) {
      await this.repository.setActive(existingByUrl.id);
      return Result.ok(existingByUrl);
    }
    
    // 4. Check tab limit (from spec.md R6.2)
    const count = await this.repository.count();
    if (count >= MAX_TABS) {
      await this.repository.deleteOldestInactive();
    }
    
    // 5. Create new tab
    const tab = await this.repository.create(dto);
    this.eventBus.publish({ type: TabEvents.TAB_CREATED, payload: { tab } });
    
    return Result.ok(tab);
  }

  // From spec.md R6.3: shouldHighlightSpaceItem for sidebar integration
  async shouldHighlightSpaceItem(spaceItemId: string): Promise<Result<boolean, Error>> {
    const activeTab = await this.repository.getActive();
    if (!activeTab) return Result.ok(false);
    
    return Result.ok(
      activeTab.originSpaceItemId === spaceItemId && activeTab.isTracked
    );
  }
}
```

### Verify
- [ ] All methods from spec.md R6 implemented
- [ ] Duplicate detection order: SpaceItemId first, URL second
- [ ] Tab limit enforcement works
- [ ] Events published for all mutations
- [ ] All test cases from testing-strategy.md pass

---

## Phase 7: Integration & Barrel Exports (Day 3 Morning)

### Read First
1. `spec.md` - File Structure section
2. Existing barrel pattern: `packages/core/src/index.ts`

### Implement

```typescript
// packages/core/src/domain/entities/index.ts
export * from './Tab';

// packages/core/src/domain/repositories/index.ts
export * from './ITabsRepository';

// packages/core/src/domain/validators/index.ts
export * from './UrlNormalizer';
export * from './CreateTabValidator';
export * from './UpdateTabValidator';

// packages/core/src/domain/events/index.ts
export * from './TabEvents';

// packages/core/src/application/facades/index.ts
export * from './TabsFacade';

// packages/core/src/index.ts - Add exports
export * from './domain/entities/Tab';
export * from './domain/repositories/ITabsRepository';
// ... etc
```

### Verify
- [ ] All new files exported from barrel files
- [ ] No circular dependencies
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes

---

## Checklist Before Completion

### From spec.md Acceptance Criteria

**Entity Definition**
- [ ] TabEntity interface complete with all properties
- [ ] All properties are readonly
- [ ] TabType enum defined
- [ ] Helper functions create new objects (immutability)

**Repository Interface**
- [ ] ITabsRepository interface complete
- [ ] All query methods defined
- [ ] All mutation methods defined
- [ ] Special operations for tab limit

**URL Normalization**
- [ ] normalizeUrl handles all cases
- [ ] urlsMatch uses normalization
- [ ] extractDomain helper works
- [ ] isSecureUrl helper works

**Validators**
- [ ] CreateTabValidator complete
- [ ] UpdateTabValidator complete
- [ ] Origin fields validated together

**Domain Events**
- [ ] All events defined
- [ ] Event payloads typed

**TabsFacade**
- [ ] Duplicate detection works
- [ ] Tab limit enforced
- [ ] Events published
- [ ] shouldHighlightSpaceItem works

### From testing-strategy.md

- [ ] UrlNormalizer: 100% coverage
- [ ] CreateTabValidator: 95%+ coverage
- [ ] TabsFacade: 90%+ coverage
- [ ] All edge cases covered

---

## Common Patterns

### Pattern 1: Immutable Entity Updates

```typescript
// CORRECT: Return new object
function updateTabEntity(tab: TabEntity, dto: UpdateTabDTO): TabEntity {
  return {
    ...tab,
    ...dto,
    updatedAt: new Date(),
  };
}

// WRONG: Mutating existing object
function updateTabEntity(tab: TabEntity, dto: UpdateTabDTO): TabEntity {
  tab.url = dto.url; // ERROR - readonly property
  return tab;
}
```

### Pattern 2: Result Type Usage

```typescript
// From existing patterns in the codebase
async createTab(dto: CreateTabDTO): Promise<Result<TabEntity, Error>> {
  try {
    // ... implementation
    return Result.ok(tab);
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error(String(error)));
  }
}
```

### Pattern 3: Duplicate Detection Priority

```typescript
// From spec.md R6.1: SpaceItemId is PRIMARY, URL is SECONDARY
async findDuplicate(dto: CreateTabDTO): Promise<TabEntity | null> {
  // 1. Check by SpaceItemId first (higher priority)
  if (dto.originSpaceItemId) {
    const byItem = await this.repository.getBySpaceItemId(dto.originSpaceItemId);
    if (byItem) return byItem;
  }
  
  // 2. Then check by URL (lower priority)
  const normalizedUrl = normalizeUrl(dto.url);
  return this.repository.getByUrl(normalizedUrl);
}
```
