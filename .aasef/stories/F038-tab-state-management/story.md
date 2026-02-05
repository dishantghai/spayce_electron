# F038: Tab State Management

## Description
Create the Zustand store for multi-tab state management in the renderer process with IPC
synchronization and optimistic updates. This store replaces the single-tab view management
in browserUiStore with proper multi-tab support backed by persistent storage.

Phase 2 of Browser Integration Plan (Spec 022: Tab State Management).

## Acceptance Criteria
- [ ] tabStore.ts created with Zustand
- [ ] Store initializes from persisted state (tabs:getAll IPC)
- [ ] Create tab action calls IPC and updates store
- [ ] Close tab action with optimistic update and rollback
- [ ] Switch tab action with optimistic update
- [ ] Reorder tabs with optimistic update and persistence
- [ ] IPC event listeners update tab properties in real-time (title, url, favicon, loading)
- [ ] Failed operations roll back state
- [ ] No redundant re-renders (Zustand selectors)
- [ ] BrowserArea integrated with tabStore instead of browserUiStore for tab management
- [ ] Tab bar reflects store state accurately
- [ ] Unit tests for tabStore

## Context
- **Related Spec**: 022 (Tab State Management from Phase 2 plan)
- **Dependencies**: F037 (Tab CRUD Infrastructure)
- **Affected Files**:
  - packages/react-ui/src/stores/tabStore.ts (NEW)
  - packages/react-ui/src/stores/browserUiStore.ts (update to use tabStore for tab list)
  - packages/react-ui/src/components/browser/BrowserArea.tsx (integrate tabStore)

## Tasks
1. Create tabStore.ts with Zustand store
2. Implement initialize() action - fetch from IPC
3. Implement createTab() with IPC call and state update
4. Implement closeTab() with optimistic update and rollback
5. Implement switchTab() with optimistic update
6. Implement reorderTabs() with optimistic update
7. Add IPC event listeners for real-time updates
8. Integrate tabStore with BrowserArea component
9. Write unit tests for tabStore

## Notes
- Keep browserUiStore for view-level state (loading, errors, navigation)
- tabStore manages tab list, active tab, and tab metadata
- browserUiStore manages active view's UI state (progress, errors, etc.)
- The two stores work together: tabStore for "which tabs exist" + browserUiStore for "what the active view is doing"
- Follow existing Zustand patterns from sidebar/navigation stores
