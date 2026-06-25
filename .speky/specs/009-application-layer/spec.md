# Spec 009: Application Layer - Use Cases & Facades

## Overview

Implement the Application layer with use cases, queries, and facades that orchestrate business logic. This layer coordinates between the Domain layer (Spec 007) and Infrastructure layer (Spec 008), providing a simplified API for the Presentation layer (Spec 010).

## Dependencies & Scope Coordination

**Dependencies:**
- **Spec 007** (Core Domain Layer): Entities, repository interfaces, events, validators
- **Spec 008**: Infrastructure Layer (repository implementations, service registry)

**Integration Points:**
- Uses repository interfaces from Spec 007
- Uses service registry from Spec 008 for dependency resolution
- Provides facades consumed by Spec 010 (React UI)
- Emits domain events from Spec 007

**This Spec Covers:**
- Use cases for all Space CRUD operations
- Use cases for all SpaceItem CRUD operations
- Queries for fetching, searching, and filtering
- Facades (SpacesFacade, SpaceItemsFacade, PinsFacade, SearchFacade)
- Application-level error handling and transformation
- Input validation orchestration
- Result types for UI-friendly error handling

## User Stories

### US-009-001: Space Management Use Cases
- **As a user**, I want to create, rename, delete, and reorder spaces so that I can organize my content effectively
- **Acceptance Criteria:**
  - Given I provide a valid space name
  - When I call createSpace
  - Then a new space is created and persisted
  - And a SpaceCreatedEvent is emitted
  - And the space appears at the end of my space list

### US-009-002: Space Item Management Use Cases
- **As a user**, I want to add, move, and delete items within spaces
- **Acceptance Criteria:**
  - Given I have a space
  - When I add a link item
  - Then the item is created with extracted metadata
  - And it appears at the correct position in the tree

### US-009-003: Pin System Use Cases
- **As a user**, I want to pin and unpin items for quick access
- **Acceptance Criteria:**
  - Given I have an item in a space
  - When I pin it
  - Then it appears in the pinned items grid
  - And its position is persisted

### US-009-004: Search & Discovery
- **As a user**, I want to search across all my spaces and items
- **Acceptance Criteria:**
  - Given I have items with matching names
  - When I search for a term
  - Then relevant results are returned quickly
  - And results include recent and most-visited items

### US-009-005: Facade API Simplicity
- **As a developer**, I want simple facade methods so that UI code is clean
- **Acceptance Criteria:**
  - Given I need to create a space
  - When I call `spacesFacade.createSpace(input)`
  - Then I receive either the created space or a structured error
  - And I don't need to understand internal use case structure

## MVP Scope

### Included:
- All Space management use cases (Create, Delete, Rename, Update, Reorder)
- All SpaceItem management use cases (Create, Delete, Rename, Move, Reorder)
- Pin operations use cases (Pin, Unpin, Reorder pins)
- Query classes (GetSpaces, GetItems, SearchItems, RecentItems, MostVisited)
- SpacesFacade with complete API
- SpaceItemsFacade with complete API
- PinsFacade for pin-specific operations
- SearchFacade for search and discovery
- Result<T> type for error handling
- Application-level error transformation

### Excluded:
- React hooks (see Spec 010)
- Local file system operations (see Spec 011)
- Cloud sync operations

## Out of Scope

- UI components
- React-specific patterns
- Local file import logic (detailed in Spec 011)

## Tech Decisions Update Required

After completing this spec, update `.speky/context/tech_decisions.md` to add:

```markdown
## Clean Architecture - Application Layer

| Decision | Value | Rationale |
|----------|-------|-----------|
| Package Location | `packages/core/src/application/` | Within core package |
| Use Case Pattern | Single execute() method | Clear, testable operations |
| Query Pattern | Separate from commands | CQRS-lite separation |
| Facade Pattern | Thin orchestrators | Simple API for UI layer |
| Error Handling | Result<T, Error> type | UI-friendly error propagation |
| Validation | Schema + Business rule | Multi-layer validation |
```

---

## Requirements

### R1: Use Case Base Pattern

#### 1.1 Use Case Interface

```typescript
// packages/core/src/application/use-cases/UseCase.ts
export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

#### 1.2 Result Type for Error Handling

```typescript
// packages/core/src/application/common/Result.ts
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface AppError {
  type: 'validation' | 'business_rule' | 'not_found' | 'system';
  message: string;
  field?: string;
  code?: string;
}

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}
```

---

### R2: Space Use Cases

#### 2.1 CreateSpaceUseCase

```typescript
// packages/core/src/application/use-cases/spaces/CreateSpaceUseCase.ts
import { SpaceEntity, ISpacesRepository, IEventBus, SpaceCreatedEvent } from '@spayce/core/domain';
import { CreateSpaceValidator, DataSanitizer, ValidationError } from '@spayce/core/domain/validators';
import { generateId } from '../../common/idGenerator';

export interface CreateSpaceInput {
  profileId: string;
  userId: string;
  name: string;
  iconName?: string;
  accentColor?: string;
}

export interface CreateSpaceOutput {
  space: SpaceEntity;
}

export class CreateSpaceUseCase {
  constructor(
    private readonly spacesRepository: ISpacesRepository,
    private readonly eventBus: IEventBus,
    private readonly validator: CreateSpaceValidator
  ) {}
  
  async execute(input: CreateSpaceInput): Promise<CreateSpaceOutput> {
    // 1. Validate input
    const validationResult = this.validator.validate(input);
    if (!validationResult.success) {
      throw validationResult.errors[0];
    }
    
    // 2. Sanitize
    const sanitizedName = DataSanitizer.sanitizeString(input.name);
    if (!sanitizedName) {
      throw new ValidationError('name', input.name, 'cannot be empty after sanitization');
    }
    
    // 3. Get next order
    const existingSpaces = await this.spacesRepository.getAllSpaces(input.profileId);
    const nextOrder = existingSpaces.length;
    
    // 4. Create space
    const space = await this.spacesRepository.createSpace({
      id: generateId(),
      profileId: input.profileId,
      userId: input.userId,
      name: sanitizedName,
      iconName: input.iconName || 'folder',
      accentColor: input.accentColor || '#6D5AE6',
      order: nextOrder,
      isExpanded: true,
    });
    
    // 5. Emit event
    await this.eventBus.publish(new SpaceCreatedEvent({ 
      spaceId: space.id, 
      profileId: input.profileId 
    }));
    
    return { space };
  }
}
```

#### 2.2 DeleteSpaceUseCase

```typescript
// packages/core/src/application/use-cases/spaces/DeleteSpaceUseCase.ts
import { ISpacesRepository, IEventBus, SpaceDeletedEvent, EntityNotFoundError } from '@spayce/core/domain';

export interface DeleteSpaceInput {
  spaceId: string;
  profileId: string;
}

export class DeleteSpaceUseCase {
  constructor(
    private readonly spacesRepository: ISpacesRepository,
    private readonly eventBus: IEventBus
  ) {}
  
  async execute(input: DeleteSpaceInput): Promise<void> {
    // 1. Verify space exists
    const space = await this.spacesRepository.getSpaceById(input.spaceId);
    if (!space) {
      throw new EntityNotFoundError('Space', input.spaceId);
    }
    
    // 2. Delete space (cascade deletes items)
    await this.spacesRepository.deleteSpace(input.spaceId);
    
    // 3. Emit event
    await this.eventBus.publish(new SpaceDeletedEvent({ 
      spaceId: input.spaceId, 
      profileId: input.profileId 
    }));
  }
}
```

#### 2.3 RenameSpaceUseCase

```typescript
// packages/core/src/application/use-cases/spaces/RenameSpaceUseCase.ts
import { ISpacesRepository, IEventBus, SpaceRenamedEvent, EntityNotFoundError, ValidationError } from '@spayce/core/domain';
import { DataSanitizer } from '@spayce/core/domain/validators';

export interface RenameSpaceInput {
  spaceId: string;
  newName: string;
}

export class RenameSpaceUseCase {
  constructor(
    private readonly spacesRepository: ISpacesRepository,
    private readonly eventBus: IEventBus
  ) {}
  
  async execute(input: RenameSpaceInput): Promise<void> {
    // 1. Validate and sanitize name
    const sanitizedName = DataSanitizer.sanitizeString(input.newName);
    if (!sanitizedName) {
      throw new ValidationError('name', input.newName, 'cannot be empty');
    }
    
    // 2. Get existing space
    const space = await this.spacesRepository.getSpaceById(input.spaceId);
    if (!space) {
      throw new EntityNotFoundError('Space', input.spaceId);
    }
    
    const oldName = space.name;
    
    // 3. Update space
    await this.spacesRepository.updateSpace({
      ...space,
      name: sanitizedName
    });
    
    // 4. Emit event
    await this.eventBus.publish(new SpaceRenamedEvent({ 
      spaceId: input.spaceId, 
      oldName,
      newName: sanitizedName
    }));
  }
}
```

#### 2.4 UpdateSpaceUseCase

```typescript
// packages/core/src/application/use-cases/spaces/UpdateSpaceUseCase.ts
import { ISpacesRepository, SpaceEntity, EntityNotFoundError, ValidationError } from '@spayce/core/domain';
import { FormatValidators, DataSanitizer } from '@spayce/core/domain/validators';

export interface UpdateSpaceInput {
  spaceId: string;
  name?: string;
  iconName?: string;
  accentColor?: string;
  isExpanded?: boolean;
}

export class UpdateSpaceUseCase {
  constructor(private readonly spacesRepository: ISpacesRepository) {}
  
  async execute(input: UpdateSpaceInput): Promise<SpaceEntity> {
    // 1. Get existing space
    const space = await this.spacesRepository.getSpaceById(input.spaceId);
    if (!space) {
      throw new EntityNotFoundError('Space', input.spaceId);
    }
    
    // 2. Validate and sanitize updates
    let name = space.name;
    if (input.name !== undefined) {
      name = DataSanitizer.sanitizeString(input.name);
      if (!name) {
        throw new ValidationError('name', input.name, 'cannot be empty');
      }
    }
    
    let accentColor = space.accentColor;
    if (input.accentColor !== undefined) {
      const colorResult = FormatValidators.validateHexColor(input.accentColor);
      if (!colorResult.success) {
        throw colorResult.errors[0];
      }
      accentColor = colorResult.data!;
    }
    
    // 3. Update space
    const updatedSpace: SpaceEntity = {
      ...space,
      name,
      iconName: input.iconName ?? space.iconName,
      accentColor,
      isExpanded: input.isExpanded ?? space.isExpanded
    };
    
    await this.spacesRepository.updateSpace(updatedSpace);
    
    return updatedSpace;
  }
}
```

#### 2.5 ReorderSpacesUseCase

```typescript
// packages/core/src/application/use-cases/spaces/ReorderSpacesUseCase.ts
import { ISpacesRepository, ValidationError } from '@spayce/core/domain';

export interface ReorderSpacesInput {
  profileId: string;
  orderedSpaceIds: string[];
}

export class ReorderSpacesUseCase {
  constructor(private readonly spacesRepository: ISpacesRepository) {}
  
  async execute(input: ReorderSpacesInput): Promise<void> {
    // 1. Validate all IDs belong to profile
    const existingSpaces = await this.spacesRepository.getAllSpaces(input.profileId);
    const existingIds = new Set(existingSpaces.map(s => s.id));
    
    for (const id of input.orderedSpaceIds) {
      if (!existingIds.has(id)) {
        throw new ValidationError('orderedSpaceIds', id, 'space does not exist in profile');
      }
    }
    
    // 2. Reorder
    await this.spacesRepository.reorderSpaces(input.profileId, input.orderedSpaceIds);
  }
}
```

---

### R3: Space Item Use Cases

#### 3.1 CreateItemUseCase

```typescript
// packages/core/src/application/use-cases/items/CreateItemUseCase.ts
import { 
  SpaceItemEntity, SpaceItemType, ISpaceItemsRepository, ISpacesRepository,
  IEventBus, SpaceItemCreatedEvent, EntityNotFoundError, ValidationError 
} from '@spayce/core/domain';
import { FormatValidators, DataSanitizer } from '@spayce/core/domain/validators';
import { generateId } from '../../common/idGenerator';

export interface CreateItemInput {
  spaceId: string;
  parentId?: string | null;
  name: string;
  path: string;
  type: SpaceItemType;
  faviconUrl?: string | null;
  description?: string | null;
}

export class CreateItemUseCase {
  constructor(
    private readonly spaceItemsRepository: ISpaceItemsRepository,
    private readonly spacesRepository: ISpacesRepository,
    private readonly eventBus: IEventBus
  ) {}
  
  async execute(input: CreateItemInput): Promise<SpaceItemEntity> {
    // 1. Validate space exists
    const space = await this.spacesRepository.getSpaceById(input.spaceId);
    if (!space) {
      throw new EntityNotFoundError('Space', input.spaceId);
    }
    
    // 2. Validate parent if provided
    if (input.parentId) {
      const parent = await this.spaceItemsRepository.getItemById(input.parentId);
      if (!parent) {
        throw new EntityNotFoundError('Parent Item', input.parentId);
      }
      if (parent.spaceId !== input.spaceId) {
        throw new ValidationError('parentId', input.parentId, 'parent must be in same space');
      }
    }
    
    // 3. Sanitize input
    const sanitizedName = DataSanitizer.sanitizeString(input.name) || 'Untitled';
    
    // 4. Validate URL for link type
    if (input.type === SpaceItemType.Link) {
      const urlResult = FormatValidators.validateUrl(input.path);
      if (!urlResult.success) {
        throw urlResult.errors[0];
      }
    }
    
    // 5. Get next sort order
    const siblings = input.parentId 
      ? await this.spaceItemsRepository.getItemChildren(input.parentId)
      : await this.spaceItemsRepository.getItemsBySpaceId(input.spaceId)
          .then(items => items.filter(i => !i.parentId));
    const nextOrder = siblings.length;
    
    // 6. Create item
    const item = await this.spaceItemsRepository.createItem({
      id: generateId(),
      spaceId: input.spaceId,
      parentId: input.parentId || null,
      name: sanitizedName,
      path: input.path,
      type: input.type,
      isExpanded: false,
      sortOrder: nextOrder,
      faviconUrl: input.faviconUrl || null,
      description: input.description || null,
      visitCount: 0,
      lastVisited: null,
      isPinned: false,
      pinPosition: null,
      localPath: null,
      securityBookmark: null,
      lastSyncedAt: null,
      isWatching: false
    });
    
    // 7. Emit event
    await this.eventBus.publish(new SpaceItemCreatedEvent({ 
      itemId: item.id, 
      spaceId: input.spaceId 
    }));
    
    return item;
  }
}
```

#### 3.2 DeleteItemUseCase

```typescript
// packages/core/src/application/use-cases/items/DeleteItemUseCase.ts
import { ISpaceItemsRepository, IEventBus, EntityNotFoundError } from '@spayce/core/domain';

export interface DeleteItemInput {
  itemId: string;
}

export class DeleteItemUseCase {
  constructor(
    private readonly spaceItemsRepository: ISpaceItemsRepository,
    private readonly eventBus: IEventBus
  ) {}
  
  async execute(input: DeleteItemInput): Promise<void> {
    const item = await this.spaceItemsRepository.getItemById(input.itemId);
    if (!item) {
      throw new EntityNotFoundError('SpaceItem', input.itemId);
    }
    
    await this.spaceItemsRepository.deleteItem(input.itemId);
  }
}
```

#### 3.3 MoveItemUseCase

```typescript
// packages/core/src/application/use-cases/items/MoveItemUseCase.ts
import { 
  ISpaceItemsRepository, ISpacesRepository, IEventBus, 
  SpaceItemMovedEvent, EntityNotFoundError, BusinessRuleError 
} from '@spayce/core/domain';

export interface MoveItemInput {
  itemId: string;
  toSpaceId: string;
  toParentId: string | null;
  toPosition: number;
}

export class MoveItemUseCase {
  constructor(
    private readonly spaceItemsRepository: ISpaceItemsRepository,
    private readonly spacesRepository: ISpacesRepository,
    private readonly eventBus: IEventBus
  ) {}
  
  async execute(input: MoveItemInput): Promise<void> {
    // 1. Get item
    const item = await this.spaceItemsRepository.getItemById(input.itemId);
    if (!item) {
      throw new EntityNotFoundError('SpaceItem', input.itemId);
    }
    
    // 2. Validate target space
    const targetSpace = await this.spacesRepository.getSpaceById(input.toSpaceId);
    if (!targetSpace) {
      throw new EntityNotFoundError('Space', input.toSpaceId);
    }
    
    // 3. Validate parent if provided
    if (input.toParentId) {
      const parent = await this.spaceItemsRepository.getItemById(input.toParentId);
      if (!parent) {
        throw new EntityNotFoundError('Parent Item', input.toParentId);
      }
      
      // Check for circular reference
      if (input.toParentId === input.itemId) {
        throw new BusinessRuleError('Cannot move item into itself');
      }
      
      // Check if parent is a descendant of item
      let current = parent;
      while (current.parentId) {
        if (current.parentId === input.itemId) {
          throw new BusinessRuleError('Cannot move item into its own descendant');
        }
        current = (await this.spaceItemsRepository.getItemById(current.parentId))!;
      }
    }
    
    // 4. Store old values for event
    const fromSpaceId = item.spaceId;
    const fromParentId = item.parentId;
    
    // 5. Move item
    await this.spaceItemsRepository.moveItem(
      input.itemId, 
      input.toSpaceId, 
      input.toParentId, 
      input.toPosition
    );
    
    // 6. Emit event
    await this.eventBus.publish(new SpaceItemMovedEvent({
      itemId: input.itemId,
      fromSpaceId,
      toSpaceId: input.toSpaceId,
      fromParentId,
      toParentId: input.toParentId
    }));
  }
}
```

---

### R4: Pin Use Cases

#### 4.1 PinItemUseCase

```typescript
// packages/core/src/application/use-cases/pins/PinItemUseCase.ts
import { ISpaceItemsRepository, IEventBus, SpaceItemPinnedEvent, EntityNotFoundError } from '@spayce/core/domain';

export interface PinItemInput {
  itemId: string;
}

export class PinItemUseCase {
  constructor(
    private readonly spaceItemsRepository: ISpaceItemsRepository,
    private readonly eventBus: IEventBus
  ) {}
  
  async execute(input: PinItemInput): Promise<void> {
    // 1. Get item
    const item = await this.spaceItemsRepository.getItemById(input.itemId);
    if (!item) {
      throw new EntityNotFoundError('SpaceItem', input.itemId);
    }
    
    // 2. Get next pin position
    const pinnedItems = await this.spaceItemsRepository.getPinnedItems(item.spaceId);
    const nextPosition = pinnedItems.length;
    
    // 3. Pin item
    await this.spaceItemsRepository.pinItem(input.itemId, nextPosition);
    
    // 4. Emit event
    await this.eventBus.publish(new SpaceItemPinnedEvent({
      itemId: input.itemId,
      spaceId: item.spaceId,
      position: nextPosition
    }));
  }
}
```

#### 4.2 UnpinItemUseCase

```typescript
// packages/core/src/application/use-cases/pins/UnpinItemUseCase.ts
import { ISpaceItemsRepository, EntityNotFoundError } from '@spayce/core/domain';

export interface UnpinItemInput {
  itemId: string;
}

export class UnpinItemUseCase {
  constructor(private readonly spaceItemsRepository: ISpaceItemsRepository) {}
  
  async execute(input: UnpinItemInput): Promise<void> {
    const item = await this.spaceItemsRepository.getItemById(input.itemId);
    if (!item) {
      throw new EntityNotFoundError('SpaceItem', input.itemId);
    }
    
    await this.spaceItemsRepository.unpinItem(input.itemId);
  }
}
```

#### 4.3 ReorderPinsUseCase

```typescript
// packages/core/src/application/use-cases/pins/ReorderPinsUseCase.ts
import { ISpaceItemsRepository, ISpacesRepository, EntityNotFoundError } from '@spayce/core/domain';

export interface ReorderPinsInput {
  spaceId: string;
  orderedItemIds: string[];
}

export class ReorderPinsUseCase {
  constructor(
    private readonly spaceItemsRepository: ISpaceItemsRepository,
    private readonly spacesRepository: ISpacesRepository
  ) {}
  
  async execute(input: ReorderPinsInput): Promise<void> {
    const space = await this.spacesRepository.getSpaceById(input.spaceId);
    if (!space) {
      throw new EntityNotFoundError('Space', input.spaceId);
    }
    
    await this.spaceItemsRepository.reorderPins(input.spaceId, input.orderedItemIds);
  }
}
```

---

### R5: Query Classes

#### 5.1 GetSpacesQuery

```typescript
// packages/core/src/application/queries/GetSpacesQuery.ts
import { SpaceEntity, ISpacesRepository } from '@spayce/core/domain';

export interface GetSpacesInput {
  profileId: string;
}

export class GetSpacesQuery {
  constructor(private readonly spacesRepository: ISpacesRepository) {}
  
  async execute(input: GetSpacesInput): Promise<SpaceEntity[]> {
    return this.spacesRepository.getAllSpaces(input.profileId);
  }
}
```

#### 5.2 GetSpaceItemsQuery

```typescript
// packages/core/src/application/queries/GetSpaceItemsQuery.ts
import { SpaceItemEntity, ISpaceItemsRepository } from '@spayce/core/domain';

export interface GetSpaceItemsInput {
  spaceId: string;
}

export interface SpaceItemWithChildren extends SpaceItemEntity {
  children: SpaceItemWithChildren[];
}

export class GetSpaceItemsQuery {
  constructor(private readonly spaceItemsRepository: ISpaceItemsRepository) {}
  
  async execute(input: GetSpaceItemsInput): Promise<SpaceItemWithChildren[]> {
    const items = await this.spaceItemsRepository.getItemsBySpaceId(input.spaceId);
    return this.buildTree(items);
  }
  
  private buildTree(items: SpaceItemEntity[]): SpaceItemWithChildren[] {
    const itemMap = new Map<string, SpaceItemWithChildren>();
    const roots: SpaceItemWithChildren[] = [];
    
    // First pass: create all nodes
    for (const item of items) {
      itemMap.set(item.id, { ...item, children: [] });
    }
    
    // Second pass: build tree
    for (const item of items) {
      const node = itemMap.get(item.id)!;
      if (item.parentId && itemMap.has(item.parentId)) {
        itemMap.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    
    // Sort children by sortOrder
    const sortChildren = (nodes: SpaceItemWithChildren[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const node of nodes) {
        sortChildren(node.children);
      }
    };
    
    sortChildren(roots);
    
    return roots;
  }
}
```

#### 5.3 SearchItemsQuery

```typescript
// packages/core/src/application/queries/SearchItemsQuery.ts
import { SpaceItemEntity, ISpaceItemsRepository } from '@spayce/core/domain';

export interface SearchItemsInput {
  profileId: string;
  query: string;
  limit?: number;
}

export interface SearchResult {
  items: SpaceItemEntity[];
  totalCount: number;
}

export class SearchItemsQuery {
  constructor(private readonly spaceItemsRepository: ISpaceItemsRepository) {}
  
  async execute(input: SearchItemsInput): Promise<SearchResult> {
    const items = await this.spaceItemsRepository.searchItems(
      input.profileId, 
      input.query
    );
    
    return {
      items: items.slice(0, input.limit || 50),
      totalCount: items.length
    };
  }
}
```

#### 5.4 GetRecentItemsQuery

```typescript
// packages/core/src/application/queries/GetRecentItemsQuery.ts
import { SpaceItemEntity, ISpaceItemsRepository } from '@spayce/core/domain';

export interface GetRecentItemsInput {
  profileId: string;
  limit?: number;
}

export class GetRecentItemsQuery {
  constructor(private readonly spaceItemsRepository: ISpaceItemsRepository) {}
  
  async execute(input: GetRecentItemsInput): Promise<SpaceItemEntity[]> {
    return this.spaceItemsRepository.getRecentItems(
      input.profileId, 
      input.limit || 10
    );
  }
}
```

#### 5.5 GetMostVisitedItemsQuery

```typescript
// packages/core/src/application/queries/GetMostVisitedItemsQuery.ts
import { SpaceItemEntity, ISpaceItemsRepository } from '@spayce/core/domain';

export interface GetMostVisitedItemsInput {
  profileId: string;
  limit?: number;
}

export class GetMostVisitedItemsQuery {
  constructor(private readonly spaceItemsRepository: ISpaceItemsRepository) {}
  
  async execute(input: GetMostVisitedItemsInput): Promise<SpaceItemEntity[]> {
    return this.spaceItemsRepository.getMostVisitedItems(
      input.profileId, 
      input.limit || 10
    );
  }
}
```

---

### R6: Facades

#### 6.1 SpacesFacade

```typescript
// packages/core/src/application/facades/SpacesFacade.ts
import { SpaceEntity, ValidationError, BusinessRuleError, EntityNotFoundError } from '@spayce/core/domain';
import { Result, ok, err, AppError } from '../common/Result';
import { 
  CreateSpaceUseCase, DeleteSpaceUseCase, RenameSpaceUseCase, 
  UpdateSpaceUseCase, ReorderSpacesUseCase 
} from '../use-cases/spaces';
import { GetSpacesQuery } from '../queries';

export class SpacesFacade {
  constructor(
    private readonly createSpaceUseCase: CreateSpaceUseCase,
    private readonly deleteSpaceUseCase: DeleteSpaceUseCase,
    private readonly renameSpaceUseCase: RenameSpaceUseCase,
    private readonly updateSpaceUseCase: UpdateSpaceUseCase,
    private readonly reorderSpacesUseCase: ReorderSpacesUseCase,
    private readonly getSpacesQuery: GetSpacesQuery
  ) {}
  
  async getSpaces(profileId: string): Promise<Result<SpaceEntity[], AppError>> {
    try {
      const spaces = await this.getSpacesQuery.execute({ profileId });
      return ok(spaces);
    } catch (error) {
      return err(this.mapError(error));
    }
  }
  
  async createSpace(input: {
    profileId: string;
    userId: string;
    name: string;
    iconName?: string;
    accentColor?: string;
  }): Promise<Result<SpaceEntity, AppError>> {
    try {
      const result = await this.createSpaceUseCase.execute(input);
      return ok(result.space);
    } catch (error) {
      return err(this.mapError(error));
    }
  }
  
  async deleteSpace(spaceId: string, profileId: string): Promise<Result<void, AppError>> {
    try {
      await this.deleteSpaceUseCase.execute({ spaceId, profileId });
      return ok(undefined);
    } catch (error) {
      return err(this.mapError(error));
    }
  }
  
  async renameSpace(spaceId: string, newName: string): Promise<Result<void, AppError>> {
    try {
      await this.renameSpaceUseCase.execute({ spaceId, newName });
      return ok(undefined);
    } catch (error) {
      return err(this.mapError(error));
    }
  }
  
  async updateSpace(input: {
    spaceId: string;
    name?: string;
    iconName?: string;
    accentColor?: string;
    isExpanded?: boolean;
  }): Promise<Result<SpaceEntity, AppError>> {
    try {
      const space = await this.updateSpaceUseCase.execute(input);
      return ok(space);
    } catch (error) {
      return err(this.mapError(error));
    }
  }
  
  async reorderSpaces(
    profileId: string, 
    orderedSpaceIds: string[]
  ): Promise<Result<void, AppError>> {
    try {
      await this.reorderSpacesUseCase.execute({ profileId, orderedSpaceIds });
      return ok(undefined);
    } catch (error) {
      return err(this.mapError(error));
    }
  }
  
  private mapError(error: unknown): AppError {
    if (error instanceof ValidationError) {
      return {
        type: 'validation',
        message: error.message,
        field: error.field,
        code: error.code
      };
    }
    
    if (error instanceof BusinessRuleError) {
      return {
        type: 'business_rule',
        message: error.message,
        code: error.code
      };
    }
    
    if (error instanceof EntityNotFoundError) {
      return {
        type: 'not_found',
        message: error.message,
        code: error.code
      };
    }
    
    return {
      type: 'system',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}
```

#### 6.2 SpaceItemsFacade

```typescript
// packages/core/src/application/facades/SpaceItemsFacade.ts
import { SpaceItemEntity, SpaceItemType } from '@spayce/core/domain';
import { Result, ok, err, AppError } from '../common/Result';
import { 
  CreateItemUseCase, DeleteItemUseCase, MoveItemUseCase 
} from '../use-cases/items';
import { GetSpaceItemsQuery, SpaceItemWithChildren } from '../queries';

export class SpaceItemsFacade {
  constructor(
    private readonly createItemUseCase: CreateItemUseCase,
    private readonly deleteItemUseCase: DeleteItemUseCase,
    private readonly moveItemUseCase: MoveItemUseCase,
    private readonly getSpaceItemsQuery: GetSpaceItemsQuery
  ) {}
  
  async getItems(spaceId: string): Promise<Result<SpaceItemWithChildren[], AppError>> {
    try {
      const items = await this.getSpaceItemsQuery.execute({ spaceId });
      return ok(items);
    } catch (error) {
      return err(this.mapError(error));
    }
  }
  
  async createItem(input: {
    spaceId: string;
    parentId?: string | null;
    name: string;
    path: string;
    type: SpaceItemType;
    faviconUrl?: string | null;
    description?: string | null;
  }): Promise<Result<SpaceItemEntity, AppError>> {
    try {
      const item = await this.createItemUseCase.execute(input);
      return ok(item);
    } catch (error) {
      return err(this.mapError(error));
    }
  }
  
  async deleteItem(itemId: string): Promise<Result<void, AppError>> {
    try {
      await this.deleteItemUseCase.execute({ itemId });
      return ok(undefined);
    } catch (error) {
      return err(this.mapError(error));
    }
  }
  
  async moveItem(input: {
    itemId: string;
    toSpaceId: string;
    toParentId: string | null;
    toPosition: number;
  }): Promise<Result<void, AppError>> {
    try {
      await this.moveItemUseCase.execute(input);
      return ok(undefined);
    } catch (error) {
      return err(this.mapError(error));
    }
  }
  
  private mapError(error: unknown): AppError {
    // Same implementation as SpacesFacade.mapError
    return {
      type: 'system',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}
```

#### 6.3 SearchFacade

```typescript
// packages/core/src/application/facades/SearchFacade.ts
import { SpaceItemEntity } from '@spayce/core/domain';
import { Result, ok, err, AppError } from '../common/Result';
import { SearchItemsQuery, GetRecentItemsQuery, GetMostVisitedItemsQuery } from '../queries';

export class SearchFacade {
  constructor(
    private readonly searchItemsQuery: SearchItemsQuery,
    private readonly recentItemsQuery: GetRecentItemsQuery,
    private readonly mostVisitedQuery: GetMostVisitedItemsQuery
  ) {}
  
  async search(
    profileId: string, 
    query: string
  ): Promise<Result<SpaceItemEntity[], AppError>> {
    try {
      const result = await this.searchItemsQuery.execute({ profileId, query });
      return ok(result.items);
    } catch (error) {
      return err({ type: 'system', message: 'Search failed' });
    }
  }
  
  async getRecent(profileId: string, limit?: number): Promise<Result<SpaceItemEntity[], AppError>> {
    try {
      const items = await this.recentItemsQuery.execute({ profileId, limit });
      return ok(items);
    } catch (error) {
      return err({ type: 'system', message: 'Failed to fetch recent items' });
    }
  }
  
  async getMostVisited(profileId: string, limit?: number): Promise<Result<SpaceItemEntity[], AppError>> {
    try {
      const items = await this.mostVisitedQuery.execute({ profileId, limit });
      return ok(items);
    } catch (error) {
      return err({ type: 'system', message: 'Failed to fetch most visited items' });
    }
  }
}
```

---

### R7: Utility Functions

#### 7.1 ID Generator

```typescript
// packages/core/src/application/common/idGenerator.ts
export function generateId(): string {
  // UUID v4 implementation without dependencies
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

---

### R8: Package Structure

```
packages/core/src/application/
├── common/
│   ├── Result.ts
│   ├── idGenerator.ts
│   └── index.ts
├── use-cases/
│   ├── spaces/
│   │   ├── CreateSpaceUseCase.ts
│   │   ├── DeleteSpaceUseCase.ts
│   │   ├── RenameSpaceUseCase.ts
│   │   ├── UpdateSpaceUseCase.ts
│   │   ├── ReorderSpacesUseCase.ts
│   │   └── index.ts
│   ├── items/
│   │   ├── CreateItemUseCase.ts
│   │   ├── DeleteItemUseCase.ts
│   │   ├── MoveItemUseCase.ts
│   │   ├── RenameItemUseCase.ts
│   │   ├── ReorderItemsUseCase.ts
│   │   └── index.ts
│   ├── pins/
│   │   ├── PinItemUseCase.ts
│   │   ├── UnpinItemUseCase.ts
│   │   ├── ReorderPinsUseCase.ts
│   │   └── index.ts
│   └── index.ts
├── queries/
│   ├── GetSpacesQuery.ts
│   ├── GetSpaceItemsQuery.ts
│   ├── GetPinnedItemsQuery.ts
│   ├── SearchItemsQuery.ts
│   ├── GetRecentItemsQuery.ts
│   ├── GetMostVisitedItemsQuery.ts
│   └── index.ts
├── facades/
│   ├── SpacesFacade.ts
│   ├── SpaceItemsFacade.ts
│   ├── SearchFacade.ts
│   └── index.ts
├── errors/
│   ├── ApplicationError.ts
│   └── index.ts
└── index.ts
```

---

## Acceptance Criteria

### Use Cases
- [ ] `CreateSpaceUseCase` validates input, sanitizes name, assigns order, emits event
- [ ] `DeleteSpaceUseCase` checks existence, deletes, emits event
- [ ] `RenameSpaceUseCase` validates new name, updates, emits event
- [ ] `UpdateSpaceUseCase` validates color format, applies partial updates
- [ ] `ReorderSpacesUseCase` validates all IDs, updates orders
- [ ] `CreateItemUseCase` validates space/parent, handles all item types
- [ ] `DeleteItemUseCase` handles cascade deletion
- [ ] `MoveItemUseCase` detects circular references
- [ ] All use cases properly catch and transform errors

### Pin Use Cases
- [ ] `PinItemUseCase` assigns correct position, emits event
- [ ] `UnpinItemUseCase` clears pin status
- [ ] `ReorderPinsUseCase` updates positions correctly

### Queries
- [ ] `GetSpacesQuery` returns ordered spaces
- [ ] `GetSpaceItemsQuery` builds correct tree structure
- [ ] `SearchItemsQuery` searches name and path
- [ ] `GetRecentItemsQuery` orders by last visited
- [ ] `GetMostVisitedItemsQuery` orders by visit count

### Facades
- [ ] `SpacesFacade` exposes all space operations with Result<T> returns
- [ ] `SpaceItemsFacade` exposes all item operations
- [ ] `SearchFacade` exposes search and discovery
- [ ] All facades transform errors to `AppError` type
- [ ] Facades are thin wrappers around use cases

### Error Handling
- [ ] `Result<T, E>` type properly discriminates success/error
- [ ] `AppError` includes type, message, optional field
- [ ] All domain errors mapped to appropriate AppError type
- [ ] System errors provide generic user message

### Testing
- [ ] All use cases have unit tests with mocked repositories
- [ ] All queries have unit tests
- [ ] All facades have integration tests
- [ ] Test coverage >80% for application layer
- [ ] Edge cases tested (empty input, not found, circular references)

## Dependencies

- 007-core-domain-layer
- 008 (infrastructure-layer)

## Estimated Duration
3-4 days

## Related Specs
- **Spec 007**: Provides domain types and interfaces
- **Spec 008**: Provides repository implementations
- **Spec 010**: Consumes facades via React hooks
