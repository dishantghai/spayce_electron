# Implementation Plan: React UI Integration (010)

## Prerequisites
- Spec 007 (Core Domain Layer) must be complete
- Spec 008 (Infrastructure Layer) must be complete
- Spec 009 (Application Layer) must be complete **INCLUDING ALL FACADES**:
  - SpacesFacade implemented and registered
  - SpaceItemsFacade implemented and registered
  - SearchFacade implemented and registered
  - All 15 use cases implemented

> [!CAUTION]
> Do NOT proceed with Phase 1 until Spec 009 facade prerequisite is verified.

## Phase 0: Spec 009 Facade Verification (Pre-work)
0.1. Run `pnpm test --filter @spayce/core -- application/facades`
0.2. Verify SpacesFacade exists and has all methods
0.3. Verify SpaceItemsFacade exists and has all methods
0.4. Verify SearchFacade exists and has all methods
0.5. Verify facades are registered in ServiceBootstrap

## Phase 1: Package Setup (Day 1)
1.1. Create `packages/react-ui/` with TypeScript + React config
1.2. Set up directory structure (hooks, components, stores)
1.3. Add dependencies (@spayce/core, @spayce/infrastructure)

## Phase 2: Invalidation System (Day 1)
2.1. Implement `InvalidationContext` and `InvalidationProvider`
2.2. Implement `useInvalidation` hook
2.3. Write tests for subscription/invalidation

## Phase 3: Data Fetching Hooks (Days 1-2)
3.1. Implement `useAsync` base hook
3.2. Implement `useSpaces` hook
3.3. Implement `useSpaceItems` hook
3.4. Implement `usePinnedItems` hook
3.5. Implement `useRecentItems` hook
3.6. Wire up invalidation subscriptions
3.7. Write tests for all hooks

## Phase 4: Mutation Hooks (Day 2)
4.1. Implement `useCreateSpace` hook
4.2. Implement `useDeleteSpace` hook
4.3. Implement `useRenameSpace` hook
4.4. Implement `useCreateItem` hook
4.5. Implement `useDeleteItem` hook
4.6. Implement `useMoveItem` hook
4.7. Implement `usePinItem` / `useUnpinItem`
4.8. Wire up invalidation triggers

## Phase 5: Error Boundaries (Day 3)
5.1. Implement `DomainErrorBoundary`
5.2. Implement `ErrorFallback` component
5.3. Create `ErrorFallback.module.css` styles
5.4. Implement `GlobalErrorBoundary`
5.5. Write tests for error catching

## Phase 6: Form Validation (Day 3)
6.1. Implement `useFormValidation` hook
6.2. Test with `CreateSpaceValidator`
6.3. Document usage patterns

## Phase 7: Zustand Stores (Day 3)
7.1. Implement `useNavigationUiStore`
7.2. Implement `useDragDropUiStore`
7.3. Write tests for store actions

## Phase 8: Loading States (Day 3)
8.1. Implement `Skeleton` component
8.2. Implement `SpaceListSkeleton`
8.3. Add appropriate CSS

## Phase 9: Main Process Initialization (Day 4) - NEW
9.1. Update `packages/desktop/src/main/index.ts`:
   - Remove SurrealDB import and init code
   - Import ServiceBootstrap from @spayce/infrastructure
   - Call ServiceBootstrap.initialize({ databasePath })
   - Use app.getPath('userData') for database path
9.2. Create `packages/desktop/src/main/database/firstLaunch.ts`:
   - Copy Flutter database on first launch if exists
9.3. Delete `packages/desktop/src/main/database/surrealdb.ts`
9.4. Verify main process logs "Service registry initialized"

## Phase 10: App.tsx Integration (Days 4-5) - NEW
10.1. Delete DEMO_SPACES constant from App.tsx (~380 lines)
10.2. Update App.tsx to wrap with `<InvalidationProvider>`
10.3. Create AppContent.tsx with:
   - useSpaces() hook for data fetching
   - Loading state component
   - Error state component
10.4. Wire all handlers to mutation hooks:
   - handleCreateSpace → useCreateSpace
   - handleUpdateSpace → useUpdateSpace
   - handleDeleteSpace → useDeleteSpace
   - handleReorderSpaces → useReorderSpaces
   - handleCreateItem → useCreateItem
   - handleDeleteItem → useDeleteItem
   - handleMoveItem → useMoveItem
   - handlePinItem → usePinItem
   - handleUnpinItem → useUnpinItem
10.5. Test that app loads real data from database

## Verification Checklist
- [ ] **Spec 009 Prerequisite**: All facades exist and are registered
- [ ] **Main Process**: ServiceBootstrap.initialize() called
- [ ] **Main Process**: SurrealDB code removed
- [ ] **Main Process**: Database path uses app.getPath('userData')
- [ ] **App.tsx**: DEMO_SPACES removed (0 mock data)
- [ ] **App.tsx**: InvalidationProvider wraps app
- [ ] **App.tsx**: useSpaces() fetches real data
- [ ] **App.tsx**: All handlers use mutation hooks
- [ ] All data hooks return {data, loading, error, refetch}
- [ ] All mutation hooks trigger invalidation
- [ ] Error boundaries catch and display errors
- [ ] Form validation works with validators
- [ ] Zustand stores manage UI state
- [ ] Coverage >70%
- [ ] App launches and displays real data
