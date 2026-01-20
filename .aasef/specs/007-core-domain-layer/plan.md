# Implementation Plan: Core Domain Layer (007)

## Phase 1: Entity Definitions (Day 1)
1.1. Create `packages/core/` package with TypeScript config
1.2. Implement `SpaceEntity` interface
1.3. Implement `SpaceItemEntity` interface and `SpaceItemType` enum
1.4. Create barrel exports (`index.ts` files)

## Phase 2: Repository Interfaces (Day 1)
2.1. Define `ISpacesRepository` interface
2.2. Define `ISpaceItemsRepository` interface
2.3. Export from domain layer

## Phase 3: Value Objects & Errors (Day 2)
3.1. Implement `Color` value object with validation
3.2. Implement `DomainError` base class
3.3. Implement `ValidationError`, `BusinessRuleError`, `EntityNotFoundError`
3.4. Implement `ConcurrencyError`
3.5. Write unit tests for all error classes

## Phase 4: Validators (Day 2)
4.1. Implement `CreateSpaceValidator`
4.2. Implement `FormatValidators` (URL, hex color, file path)
4.3. Implement `DataSanitizer`
4.4. Write unit tests for validators (>90% coverage)

## Phase 5: Events & Service Interfaces (Day 3)
5.1. Define `DomainEvent` interface
5.2. Implement space events (`SpaceCreated`, `SpaceDeleted`, `SpaceRenamed`)
5.3. Implement item events (`ItemCreated`, `ItemMoved`, `ItemPinned`)
5.4. Define `IEventBus` interface
5.5. Define `ILogger` interface

## Phase 6: Final Integration (Day 3)
6.1. Create main barrel export
6.2. Verify package builds successfully
6.3. Run all unit tests
6.4. Document any tech_decisions.md updates needed

## Verification
- [ ] `pnpm build` succeeds for @spayce/core
- [ ] `pnpm test` passes with >90% coverage
- [ ] No external runtime dependencies
- [ ] TypeScript strict mode enabled
