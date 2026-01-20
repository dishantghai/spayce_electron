# Implementation Plan: Application Layer (009)

## Prerequisites
- Spec 007 (Core Domain Layer) must be complete
- Spec 008 (Infrastructure Layer) must be complete

## Phase 1: Common Utilities (Day 1)
1.1. Implement `Result<T, E>` type with `ok()` and `err()` helpers
1.2. Implement `AppError` interface
1.3. Implement `generateId()` utility

## Phase 2: Space Use Cases (Days 1-2)
2.1. Implement `CreateSpaceUseCase`
2.2. Implement `DeleteSpaceUseCase`
2.3. Implement `RenameSpaceUseCase`
2.4. Implement `UpdateSpaceUseCase`
2.5. Implement `ReorderSpacesUseCase`
2.6. Write unit tests for all space use cases

## Phase 3: Item Use Cases (Day 2)
3.1. Implement `CreateItemUseCase`
3.2. Implement `DeleteItemUseCase`
3.3. Implement `MoveItemUseCase` (with circular reference check)
3.4. Implement `RenameItemUseCase`
3.5. Implement `ReorderItemsUseCase`
3.6. Write unit tests for all item use cases

## Phase 4: Pin Use Cases (Day 3)
4.1. Implement `PinItemUseCase`
4.2. Implement `UnpinItemUseCase`
4.3. Implement `ReorderPinsUseCase`
4.4. Write unit tests

## Phase 5: Queries (Day 3)
5.1. Implement `GetSpacesQuery`
5.2. Implement `GetSpaceItemsQuery` (with tree building)
5.3. Implement `SearchItemsQuery`
5.4. Implement `GetRecentItemsQuery`
5.5. Implement `GetMostVisitedItemsQuery`
5.6. Implement `GetPinnedItemsQuery`

## Phase 6: Facades (Day 4)
6.1. Implement `SpacesFacade`
6.2. Implement `SpaceItemsFacade`
6.3. Implement `SearchFacade`
6.4. Implement error mapping in all facades
6.5. Write facade integration tests

## Phase 7: Service Registration (Day 4)
7.1. Register facades in `ServiceBootstrap`
7.2. Update `SERVICE_KEYS` with facade keys
7.3. End-to-end test of facade operations

## Verification
- [ ] All use cases have unit tests (mocked repos)
- [ ] All queries work correctly
- [ ] Facades return Result<T> types
- [ ] Error mapping works for all error types
- [ ] Coverage >85%
