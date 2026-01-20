# Implementation Plan: React UI Integration (010)

## Prerequisites
- Spec 007 (Core Domain Layer) must be complete
- Spec 008 (Infrastructure Layer) must be complete
- Spec 009 (Application Layer) must be complete

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

## Phase 7: Zustand Stores (Day 4)
7.1. Implement `useNavigationUiStore`
7.2. Implement `useDragDropUiStore`
7.3. Write tests for store actions

## Phase 8: Loading States (Day 4)
8.1. Implement `Skeleton` component
8.2. Implement `SpaceListSkeleton`
8.3. Add appropriate CSS

## Verification
- [ ] All data hooks return {data, loading, error, refetch}
- [ ] All mutation hooks trigger invalidation
- [ ] Error boundaries catch and display errors
- [ ] Form validation works with validators
- [ ] Zustand stores manage UI state
- [ ] Coverage >70%
