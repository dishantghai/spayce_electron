# B019: Tab Loading Race Condition and New Tab Ordering

## Description

Two interconnected issues with tab creation:

1. **Tab stuck in loading state forever** - On app startup and when creating new tabs, the tab shows endless loading spinner. Page content loads in the WebContentsView but the UI never reflects completion.

2. **New tab opens at rightmost position** - New tabs appear at the end of the tab list instead of the beginning. Flutter behavior (tab_manager.dart:177) prepends at position 0: `updatedTabs.insert(0, newTab)`.

### Root Cause: Race Condition

**Timeline of the race**:
1. `initializeBrowserEventSubscriptions()` sets up IPC listeners
2. `tabStore.createTab()` calls IPC `tabs:create`
3. Main process `tabHandlers.ts` creates WebContentsView → view **immediately** starts loading
4. Main process sends `browser:loading(true)`, `browser:navigated`, `browser:title`, `browser:favicon` events
5. browserUiStore receives events, calls `views.get(viewId)` → returns `undefined` (not yet registered)
6. **Events silently dropped** - `if (view) { ... }` guards prevent updates
7. IPC response finally returns → tabStore adds tab → `registerView()` called
8. `registerView()` creates DEFAULT state with `isLoading: true`
9. All "load complete" events already fired → **view stuck in initial loading state**

**Evidence**: `browserUiStore.ts` lines 292-302 - `handleLoadingEvent` only updates if `views.get(viewId)` exists:
```typescript
handleLoadingEvent: (viewId, isLoading) => {
    const view = views.get(viewId);
    if (view) { // ← Returns false during race window
        views.set(viewId, { ...view, isLoading, ... });
    }
},
```

## Acceptance Criteria

- [ ] Browser event handlers auto-register views when receiving events for unknown viewIds
- [ ] Default tab loads google.com on startup without getting stuck in loading state
- [ ] New tabs appear at position 0 (leftmost, matching Flutter behavior)
- [ ] Title, favicon, and loading state update correctly despite async IPC timing
- [ ] All existing 113 tests continue to pass

## Context

- **Related Stories**: B018, F037, F038, F039
- **Flutter Reference**: `tab_manager.dart:177` - `updatedTabs.insert(0, newTab)` (newest first)
- **Affected Files**:
  - `packages/react-ui/src/stores/browserUiStore.ts` - Event handlers auto-register
  - `packages/react-ui/src/stores/tabStore.ts` - Prepend new tabs

## Tasks

1. Modify all browserUiStore event handlers to auto-register unknown viewIds
2. Change tabStore.createTab() to prepend instead of append
3. Write TDD tests for auto-registration and prepend ordering
4. Verify all 113+ tests pass

## Notes

- Fix must be safe for event handlers receiving events from views that don't exist yet
- `createDefaultViewState(id)` is already available for auto-registration
- Tab ordering affects BrowserTabBar rendering (tab bar reads from tabStore.tabs array order)
