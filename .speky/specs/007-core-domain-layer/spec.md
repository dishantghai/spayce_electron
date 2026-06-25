# Spec 007: Core Domain Layer

## Overview

Implement the foundation Domain layer of the Clean Architecture, containing pure TypeScript entities, repository interfaces, value objects, domain events, and validators. This layer has **ZERO external dependencies** and defines the contracts that all other layers depend upon.

## Dependencies & Scope Coordination

**Dependencies:**
- **Spec 001**: Project foundation (TypeScript configuration, package setup)

**Integration Points:**
- Defines interfaces that Spec 008 (Infrastructure) implements
- Provides entities that Spec 009 (Application) orchestrates
- Exports types that Spec 010 (React UI) consumes

**This Spec Covers:**
- Domain entities (SpaceEntity, SpaceItemEntity)
- Repository interfaces (contracts)
- Value objects (Color, Icon)
- Domain events (SpaceCreated, ItemMoved)
- Domain errors (ValidationError, BusinessRuleError, EntityNotFoundError)
- Domain validators (schema, format, business rules)
- Service interfaces (IEventBus, ILogger)

## User Stories

### US-007-001: Domain Entity Definitions
- **As a developer**, I want strongly-typed domain entities so that business data is consistently structured across the application
- **Acceptance Criteria:**
  - Given I import SpaceEntity from the core package
  - Then I have access to all space properties with correct TypeScript types
  - And the entity is immutable (readonly properties)
  - And date fields use Date type (not strings)

### US-007-002: Repository Contracts
- **As a developer**, I want repository interfaces that define all data operations so that infrastructure implementations are interchangeable
- **Acceptance Criteria:**
  - Given I need to implement a new database backend
  - When I implement ISpacesRepository interface
  - Then the implementation is compatible with all consuming code
  - And TypeScript enforces all required method signatures

### US-007-003: Domain Validation
- **As a developer**, I want domain-level validation so that invalid data never enters the system
- **Acceptance Criteria:**
  - Given I try to create a space with invalid data
  - When validation runs
  - Then I receive a specific ValidationError with field, value, and rule
  - And the error message is user-friendly

## MVP Scope

### Included:
- SpaceEntity and SpaceItemEntity with full field definitions
- ISpacesRepository and ISpaceItemsRepository interfaces
- Color value object with validation
- SpaceItemType enum
- Domain events (SpaceCreated, SpaceDeleted, ItemMoved, ItemPinned)
- Domain errors (ValidationError, BusinessRuleError, EntityNotFoundError)
- Schema validators (CreateSpaceValidator, CreateItemValidator)
- Format validators (URL, hex color, file path)
- IEventBus and ILogger interfaces

### Excluded:
- Repository implementations (see Spec 008)
- Use cases and facades (see Spec 009)
- React hooks and components (see Spec 010)

## Out of Scope

- SQLite or any database implementation
- React or any UI framework code
- External npm packages
- Application-level orchestration
- Infrastructure concerns

## Tech Decisions Update Required

After completing this spec, update `.speky/context/tech_decisions.md` to add:

```markdown
## Clean Architecture - Domain Layer

| Decision | Value | Rationale |
|----------|-------|-----------|
| Package Location | `packages/core/src/domain/` | Centralized domain logic |
| Entity Pattern | Readonly interfaces | Immutability, type safety |
| Repository Pattern | Interfaces with Promise-based async | Framework-agnostic contracts |
| Error Pattern | Class hierarchy extending DomainError | Consistent error handling |
| Validator Pattern | Schema, Format, BusinessRule validators | Multi-layer validation |
| Event Pattern | Typed DomainEvent interface | Loose coupling via events |
```

---

## Requirements

### R1: Domain Entities

#### 1.1 SpaceEntity

```typescript
// packages/core/src/domain/entities/Space.ts
export interface SpaceEntity {
  readonly id: string;
  readonly profileId: string;
  readonly userId: string;
  readonly name: string;
  readonly accentColor: string;  // Hex color e.g., '#6D5AE6'
  readonly iconName: string;     // e.g., 'folder', 'code', 'book'
  readonly order: number;
  readonly isExpanded: boolean;
  readonly createdAt: Date;
}
```

#### 1.2 SpaceItemEntity

```typescript
// packages/core/src/domain/entities/SpaceItem.ts
export enum SpaceItemType {
  Link = 'link',
  File = 'file',
  Folder = 'folder',
  LocalFolder = 'localFolder',
  LocalFile = 'localFile',
}

export interface SpaceItemEntity {
  readonly id: string;
  readonly spaceId: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly path: string;
  readonly type: SpaceItemType;
  readonly isExpanded: boolean;
  readonly sortOrder: number;
  readonly createdAt: Date;
  
  // Link metadata
  readonly faviconUrl: string | null;
  readonly description: string | null;
  readonly visitCount: number;
  readonly lastVisited: Date | null;
  
  // Pin fields
  readonly isPinned: boolean;
  readonly pinPosition: number | null;
  
  // Local file system
  readonly localPath: string | null;
  readonly securityBookmark: string | null;
  readonly lastSyncedAt: Date | null;
  readonly isWatching: boolean;
}
```

---

### R2: Repository Interfaces

#### 2.1 ISpacesRepository

```typescript
// packages/core/src/domain/repositories/ISpacesRepository.ts
import { SpaceEntity } from '../entities/Space';

export interface ISpacesRepository {
  // Query operations
  getAllSpaces(profileId: string): Promise<SpaceEntity[]>;
  getSpaceById(id: string): Promise<SpaceEntity | null>;
  searchSpaces(profileId: string, query: string): Promise<SpaceEntity[]>;
  
  // Command operations
  createSpace(space: Omit<SpaceEntity, 'createdAt'>): Promise<SpaceEntity>;
  updateSpace(space: SpaceEntity): Promise<void>;
  deleteSpace(id: string): Promise<void>;
  reorderSpaces(profileId: string, orderedIds: string[]): Promise<void>;
}
```

#### 2.2 ISpaceItemsRepository

```typescript
// packages/core/src/domain/repositories/ISpaceItemsRepository.ts
import { SpaceItemEntity } from '../entities/SpaceItem';

export interface ISpaceItemsRepository {
  // Query operations
  getItemsBySpaceId(spaceId: string): Promise<SpaceItemEntity[]>;
  getItemById(id: string): Promise<SpaceItemEntity | null>;
  getItemChildren(parentId: string): Promise<SpaceItemEntity[]>;
  getPinnedItems(spaceId: string): Promise<SpaceItemEntity[]>;
  searchItems(profileId: string, query: string): Promise<SpaceItemEntity[]>;
  getRecentItems(profileId: string, limit: number): Promise<SpaceItemEntity[]>;
  getMostVisitedItems(profileId: string, limit: number): Promise<SpaceItemEntity[]>;
  
  // Command operations
  createItem(item: Omit<SpaceItemEntity, 'createdAt'>): Promise<SpaceItemEntity>;
  updateItem(item: SpaceItemEntity): Promise<void>;
  deleteItem(id: string): Promise<void>;
  moveItem(itemId: string, newSpaceId: string, newParentId: string | null, newOrder: number): Promise<void>;
  reorderItems(parentId: string | null, orderedIds: string[]): Promise<void>;
  
  // Pin operations
  pinItem(itemId: string, position: number): Promise<void>;
  unpinItem(itemId: string): Promise<void>;
  reorderPins(spaceId: string, orderedIds: string[]): Promise<void>;
  
  // Visit tracking
  incrementVisitCount(itemId: string): Promise<void>;
}
```

---

### R3: Value Objects

#### 3.1 Color Value Object

```typescript
// packages/core/src/domain/value-objects/Color.ts
export class Color {
  private constructor(public readonly hex: string) {}
  
  static fromHex(hex: string): Color | null {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
    return new Color(hex.toUpperCase());
  }
  
  static fromRGB(r: number, g: number, b: number): Color {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return new Color(`#${[r, g, b].map(x => clamp(x).toString(16).padStart(2, '0')).join('')}`.toUpperCase());
  }
  
  toRGB(): { r: number; g: number; b: number } {
    const hex = this.hex.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  
  equals(other: Color): boolean {
    return this.hex === other.hex;
  }
}
```

---

### R4: Domain Events

#### 4.1 Event Interface and Types

```typescript
// packages/core/src/domain/events/DomainEvent.ts
export interface DomainEvent {
  readonly type: string;
  readonly timestamp: Date;
  readonly payload: unknown;
}

// packages/core/src/domain/events/SpaceEvents.ts
export class SpaceCreatedEvent implements DomainEvent {
  readonly type = 'space.created';
  readonly timestamp = new Date();
  constructor(readonly payload: { spaceId: string; profileId: string }) {}
}

export class SpaceDeletedEvent implements DomainEvent {
  readonly type = 'space.deleted';
  readonly timestamp = new Date();
  constructor(readonly payload: { spaceId: string; profileId: string }) {}
}

export class SpaceRenamedEvent implements DomainEvent {
  readonly type = 'space.renamed';
  readonly timestamp = new Date();
  constructor(readonly payload: { spaceId: string; oldName: string; newName: string }) {}
}

// packages/core/src/domain/events/SpaceItemEvents.ts
export class SpaceItemCreatedEvent implements DomainEvent {
  readonly type = 'space-item.created';
  readonly timestamp = new Date();
  constructor(readonly payload: { itemId: string; spaceId: string }) {}
}

export class SpaceItemMovedEvent implements DomainEvent {
  readonly type = 'space-item.moved';
  readonly timestamp = new Date();
  constructor(readonly payload: { 
    itemId: string; 
    fromSpaceId: string; 
    toSpaceId: string;
    fromParentId: string | null;
    toParentId: string | null;
  }) {}
}

export class SpaceItemPinnedEvent implements DomainEvent {
  readonly type = 'space-item.pinned';
  readonly timestamp = new Date();
  constructor(readonly payload: { itemId: string; spaceId: string; position: number }) {}
}
```

---

### R5: Domain Errors

#### 5.1 Error Class Hierarchy

```typescript
// packages/core/src/domain/errors/DomainError.ts
export abstract class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// packages/core/src/domain/errors/ValidationError.ts
export class ValidationError extends DomainError {
  constructor(field: string, value: unknown, rule: string) {
    super(`Validation failed for ${field}: ${rule}`, 'VALIDATION_ERROR', {
      field, value, rule
    });
  }
  
  get field(): string {
    return this.details?.field as string;
  }
}

// packages/core/src/domain/errors/BusinessRuleError.ts
export class BusinessRuleError extends DomainError {
  constructor(rule: string, context?: Record<string, unknown>) {
    super(`Business rule violation: ${rule}`, 'BUSINESS_RULE_ERROR', context);
  }
}

// packages/core/src/domain/errors/EntityNotFoundError.ts
export class EntityNotFoundError extends DomainError {
  constructor(entityType: string, id: string) {
    super(`${entityType} with id '${id}' not found`, 'ENTITY_NOT_FOUND', {
      entityType, id
    });
  }
}

// packages/core/src/domain/errors/ConcurrencyError.ts
export class ConcurrencyError extends DomainError {
  constructor(entityType: string, id: string) {
    super(`Concurrent modification detected for ${entityType} '${id}'`, 'CONCURRENCY_ERROR', {
      entityType, id
    });
  }
}
```

---

### R6: Domain Validators

#### 6.1 Schema Validators

```typescript
// packages/core/src/domain/validators/SchemaValidator.ts
import { ValidationError } from '../errors/ValidationError';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
}

export interface ValidationSchema<T> {
  validate(input: unknown): ValidationResult<T>;
  validatePartial(input: unknown): ValidationResult<Partial<T>>;
}

// packages/core/src/domain/validators/CreateSpaceValidator.ts
export interface CreateSpaceInput {
  profileId: string;
  userId: string;
  name: string;
  iconName?: string;
  accentColor?: string;
}

export class CreateSpaceValidator implements ValidationSchema<CreateSpaceInput> {
  validate(input: unknown): ValidationResult<CreateSpaceInput> {
    const errors: ValidationError[] = [];
    
    if (!input || typeof input !== 'object') {
      errors.push(new ValidationError('input', input, 'must be an object'));
      return { success: false, errors };
    }
    
    const data = input as Record<string, unknown>;
    
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push(new ValidationError('name', data.name, 'must be a non-empty string'));
    }
    
    if (!data.profileId || typeof data.profileId !== 'string') {
      errors.push(new ValidationError('profileId', data.profileId, 'must be a valid string'));
    }
    
    if (!data.userId || typeof data.userId !== 'string') {
      errors.push(new ValidationError('userId', data.userId, 'must be a valid string'));
    }
    
    if (data.accentColor && typeof data.accentColor === 'string') {
      if (!/^#[0-9A-Fa-f]{6}$/.test(data.accentColor)) {
        errors.push(new ValidationError('accentColor', data.accentColor, 'must be a valid hex color'));
      }
    }
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    return {
      success: true,
      data: {
        profileId: data.profileId as string,
        userId: data.userId as string,
        name: (data.name as string).trim(),
        iconName: (data.iconName as string | undefined) || 'folder',
        accentColor: (data.accentColor as string | undefined) || '#6D5AE6'
      },
      errors: []
    };
  }
  
  validatePartial(input: unknown): ValidationResult<Partial<CreateSpaceInput>> {
    return { success: true, data: input as Partial<CreateSpaceInput>, errors: [] };
  }
}
```

#### 6.2 Format Validators

```typescript
// packages/core/src/domain/validators/FormatValidators.ts
import { ValidationError } from '../errors/ValidationError';
import { ValidationResult } from './SchemaValidator';

export class FormatValidators {
  static readonly URL_PATTERN = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  static readonly HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
  static readonly FILE_PATH_PATTERN = /^[^<>:"|?*]+$/;
  
  static validateUrl(url: string): ValidationResult<string> {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        errors: [new ValidationError('url', url, 'must be a string')]
      };
    }
    
    const trimmed = url.trim();
    if (!this.URL_PATTERN.test(trimmed)) {
      return {
        success: false,
        errors: [new ValidationError('url', url, 'must be a valid HTTP/HTTPS URL')]
      };
    }
    
    return { success: true, data: trimmed, errors: [] };
  }
  
  static validateHexColor(color: string): ValidationResult<string> {
    if (!color || typeof color !== 'string') {
      return {
        success: false,
        errors: [new ValidationError('color', color, 'must be a string')]
      };
    }
    
    if (!this.HEX_COLOR_PATTERN.test(color)) {
      return {
        success: false,
        errors: [new ValidationError('color', color, 'must be a valid hex color (e.g., #FF0000)')]
      };
    }
    
    return { success: true, data: color.toUpperCase(), errors: [] };
  }
  
  static validateFilePath(path: string): ValidationResult<string> {
    if (!path || typeof path !== 'string') {
      return {
        success: false,
        errors: [new ValidationError('path', path, 'must be a string')]
      };
    }
    
    if (!this.FILE_PATH_PATTERN.test(path)) {
      return {
        success: false,
        errors: [new ValidationError('path', path, 'contains invalid characters')]
      };
    }
    
    return { success: true, data: path.trim(), errors: [] };
  }
}
```

#### 6.3 Data Sanitizer

```typescript
// packages/core/src/domain/validators/DataSanitizer.ts
export class DataSanitizer {
  static sanitizeString(input: string, maxLength = 1000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .slice(0, maxLength);
  }
  
  static sanitizeUrl(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    const trimmed = input.trim();
    
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    
    return trimmed.slice(0, 2048);
  }
  
  static sanitizeFileName(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>:"|?*]/g, '')
      .replace(/\.\./g, '')
      .slice(0, 255);
  }
}
```

---

### R7: Service Interfaces

#### 7.1 IEventBus

```typescript
// packages/core/src/domain/services/IEventBus.ts
import { DomainEvent } from '../events/DomainEvent';

export interface IEventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string, 
    handler: (event: T) => Promise<void>
  ): void;
  unsubscribe(eventType: string, handler: (event: any) => Promise<void>): void;
  clear(): void;
}
```

#### 7.2 ILogger

```typescript
// packages/core/src/domain/services/ILogger.ts
export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}
```

---

### R8: Package Configuration

#### 8.1 Package Structure

```
packages/core/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Space.ts
│   │   │   ├── SpaceItem.ts
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── ISpacesRepository.ts
│   │   │   ├── ISpaceItemsRepository.ts
│   │   │   └── index.ts
│   │   ├── value-objects/
│   │   │   ├── Color.ts
│   │   │   └── index.ts
│   │   ├── events/
│   │   │   ├── DomainEvent.ts
│   │   │   ├── SpaceEvents.ts
│   │   │   ├── SpaceItemEvents.ts
│   │   │   └── index.ts
│   │   ├── errors/
│   │   │   ├── DomainError.ts
│   │   │   ├── ValidationError.ts
│   │   │   ├── BusinessRuleError.ts
│   │   │   ├── EntityNotFoundError.ts
│   │   │   ├── ConcurrencyError.ts
│   │   │   └── index.ts
│   │   ├── validators/
│   │   │   ├── SchemaValidator.ts
│   │   │   ├── CreateSpaceValidator.ts
│   │   │   ├── FormatValidators.ts
│   │   │   ├── DataSanitizer.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── IEventBus.ts
│   │   │   ├── ILogger.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

#### 8.2 Package.json

```json
{
  "name": "@spayce/core",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

> [!IMPORTANT]
> This package has **ZERO production dependencies**. Only dev dependencies for building and testing.

---

## Acceptance Criteria

### Entity Definitions
- [ ] `SpaceEntity` interface defined with all 9 properties as readonly
- [ ] `SpaceItemEntity` interface defined with all 20 properties as readonly
- [ ] `SpaceItemType` enum with 5 values: Link, File, Folder, LocalFolder, LocalFile
- [ ] All date fields use `Date` type, not `string`
- [ ] All ID fields use `string` type

### Repository Interfaces
- [ ] `ISpacesRepository` defines 7 methods (3 query, 4 command)
- [ ] `ISpaceItemsRepository` defines 14 methods (7 query, 5 command, 3 pin, 1 tracking)
- [ ] All methods return `Promise<>` for async operations
- [ ] Input types use `Omit<Entity, 'createdAt'>` for create operations

### Value Objects
- [ ] `Color` class validates hex format
- [ ] `Color.fromHex()` returns null for invalid input
- [ ] `Color.fromRGB()` clamps values 0-255
- [ ] `Color.toRGB()` returns correct values
- [ ] `Color.equals()` compares normalized hex values

### Domain Events
- [ ] `DomainEvent` interface with type, timestamp, payload
- [ ] 6+ event classes implemented (SpaceCreated, SpaceDeleted, SpaceRenamed, ItemCreated, ItemMoved, ItemPinned)
- [ ] All events are immutable (readonly properties)
- [ ] Timestamps auto-set on construction

### Domain Errors
- [ ] `DomainError` abstract base class with code and details
- [ ] `ValidationError` with field, value, rule in details
- [ ] `BusinessRuleError` with rule and context
- [ ] `EntityNotFoundError` with entityType and id
- [ ] `ConcurrencyError` with entityType and id
- [ ] All errors extend `Error` with proper prototype chain

### Validators
- [ ] `CreateSpaceValidator` validates name, profileId, userId, accentColor
- [ ] `FormatValidators.validateUrl()` checks HTTP/HTTPS pattern
- [ ] `FormatValidators.validateHexColor()` checks #RRGGBB format
- [ ] `FormatValidators.validateFilePath()` rejects invalid characters
- [ ] `DataSanitizer` removes XSS vectors
- [ ] All validators return `ValidationResult<T>` type

### Service Interfaces
- [ ] `IEventBus` with publish, subscribe, unsubscribe, clear methods
- [ ] `ILogger` with debug, info, warn, error methods

### Package Configuration
- [ ] Package has zero production dependencies
- [ ] All exports via barrel files (index.ts)
- [ ] TypeScript strict mode enabled
- [ ] Package builds successfully with `pnpm build`

### Testing
- [ ] Unit tests for Color value object (>90% coverage)
- [ ] Unit tests for all validators (>90% coverage)
- [ ] Unit tests for domain errors (correct inheritance)
- [ ] All tests pass with `pnpm test`

## Dependencies

- 001 (project-foundation)

## Estimated Duration
2-3 days

## Related Specs
- **Spec 008**: Implements repository interfaces defined here
- **Spec 009**: Uses entities and events defined here
- **Spec 010**: Imports types for React component props