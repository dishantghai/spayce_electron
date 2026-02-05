# F037: Tab CRUD Infrastructure

## Description
Implement the infrastructure layer for browser tab persistence using SQLite and IPC handlers.
This provides the foundation for multi-tab browser support by adding database persistence,
repository implementation, service registration, IPC handlers, and preload API extension.

Phase 2 of Browser Integration Plan (Spec 021: Tab CRUD Operations).

## Acceptance Criteria
- [ ] browser_tabs table created in SQLite (via DatabaseInitializer)
- [ ] SqliteTabsRepository implements ITabsRepository interface fully
- [ ] SERVICE_KEYS extended with TABS_REPOSITORY and TABS_FACADE
- [ ] ServiceBootstrap registers TabsRepository and TabsFacade
- [ ] Tab IPC handlers registered (tabs:getAll, tabs:create, tabs:close, tabs:switch, tabs:update, tabs:reorder)
- [ ] Preload bridge extended with tabs API
- [ ] Create new tabs with default URL (google.com)
- [ ] Close tabs with proper adjacent tab activation
- [ ] Switch between tabs (activates WebContentsView)
- [ ] Tab limit (20) enforced with LRU eviction
- [ ] Duplicate detection by Space item ID reuses existing tab
- [ ] Duplicate detection by URL reuses existing tab
- [ ] Tab reorder persists to database
- [ ] All operations < 100ms
- [ ] Unit tests for SqliteTabsRepository

## Context
- **Related Spec**: 021 (Tab CRUD Operations from Phase 2 plan)
- **Dependencies**: Spec 017 (BrowserService), Spec 018 (Tab domain layer)
- **Affected Files**:
  - packages/infrastructure/src/persistence/sqlite/DatabaseInitializer.ts (add browser_tabs table)
  - packages/infrastructure/src/persistence/sqlite/SqliteTabsRepository.ts (NEW)
  - packages/infrastructure/src/di/ServiceRegistry.ts (add keys)
  - packages/infrastructure/src/bootstrap/ServiceBootstrap.ts (register)
  - packages/desktop/src/main/ipc/tabHandlers.ts (NEW)
  - packages/desktop/src/main/index.ts (register handlers)
  - packages/desktop/src/preload/index.ts (add tabs API)
  - packages/desktop/src/preload/types.ts (add tab types)

## Tasks
1. Add browser_tabs table to DatabaseInitializer.createTables()
2. Create SqliteTabsRepository implementing ITabsRepository
3. Add TABS_REPOSITORY and TABS_FACADE to SERVICE_KEYS
4. Register SqliteTabsRepository and TabsFacade in ServiceBootstrap
5. Create tabHandlers.ts with IPC handlers
6. Register tab handlers in main/index.ts
7. Extend preload/index.ts with tabs API
8. Write unit tests for SqliteTabsRepository
9. Write unit tests for tab IPC handlers

## Notes
- Follow existing patterns from SqliteSpacesRepository and SqliteSpaceItemsRepository
- Tab entity uses Date type for timestamps (domain rule)
- All IPC handlers return Result type (ok/err pattern)
- WebContentsView lifecycle must be synced with tab CRUD (create view on tab create, destroy on close)
- BrowserService already has createView/destroyView/setActiveView methods
