# Implementation Plan: Infrastructure Layer (008)

## Prerequisites
- Spec 007 (Core Domain Layer) must be complete

## Phase 1: Package Setup (Day 1)
1.1. Create `packages/infrastructure/` with TypeScript config
1.2. Add `@spayce/core` and `better-sqlite3` dependencies
1.3. Set up directory structure

## Phase 2: SQLite Repositories (Days 1-2)
2.1. Implement `SqliteSpacesRepository`
    - getAllSpaces, getSpaceById, searchSpaces
    - createSpace, updateSpace, deleteSpace, reorderSpaces
    - Row-to-entity mapping
2.2. Implement `SqliteSpaceItemsRepository`
    - All query operations
    - All command operations
    - Pin operations
    - Visit tracking
2.3. Write integration tests with in-memory SQLite

## Phase 3: Database Schema (Day 2)
3.1. Create schema.sql file
3.2. Implement `DatabaseInitializer`
3.3. Create indexes for common queries
3.4. Test foreign key constraints

## Phase 4: Schema Validation (Day 3)
4.1. Implement `SchemaValidator`
4.2. Implement `IntegrityChecker`
4.3. Write validation tests

## Phase 5: Service Infrastructure (Day 3)
5.1. Implement `ServiceRegistry`
5.2. Implement `ServiceBootstrap`
5.3. Define `SERVICE_KEYS` constants

## Phase 6: Event Bus & Logger (Day 4)
6.1. Implement `InMemoryEventBus`
6.2. Implement `ConsoleLogger`
6.3. Write tests for event publishing/subscribing

## Phase 7: Error Classes (Day 4)
7.1. Implement `DatabaseError`
7.2. Implement `FileSystemError`
7.3. Ensure proper error wrapping in repositories

## Verification
- [ ] All ISpacesRepository methods implemented
- [ ] All ISpaceItemsRepository methods implemented
- [ ] ServiceRegistry works correctly
- [ ] Database schema creates successfully
- [ ] All tests pass with >80% coverage
