# B021: Duplicate Tab Entries from Initialization Race Condition

## Description
React strict mode (development) double-mounts BrowserArea, causing `tabStore.initialize()`
to run concurrently. Both calls pass the `isInitialized` guard before either completes the
async IPC call. When both detect an empty DB, both call `createTab()`. The second call triggers
TabsFacade's URL duplicate detection, which returns the **existing** tab entity instead of
creating a new one. `tabStore.createTab()` then blindly prepends this returned entity, producing
the same tab ID twice in the store's `tabs` array.

This also affects production: if `handleNewTab()` or any code calls `createTab()` with a URL
that matches an existing tab, the facade returns the existing entity, and the store prepends a
duplicate.

**Console Warning:** `Warning: Encountered two children with the same key, <uuid>`

## Root Cause

Two bugs combine:

1. **No mutex on `tabStore.initialize()`**: The `isInitialized` flag is checked synchronously,
   but the subsequent async work allows a second concurrent call to pass the guard before the
   first sets the flag.

2. **`tabStore.createTab()` doesn't deduplicate**: When TabsFacade returns an existing tab
   (via URL or SpaceItemId duplicate detection), `createTab()` prepends it to `state.tabs`
   without checking if that ID already exists.

## Acceptance Criteria
- [ ] `tabStore.initialize()` uses a module-level promise lock so concurrent calls return the same promise
- [ ] `tabStore.createTab()` checks if returned tab ID already exists in store; if so, activates it instead of prepending
- [ ] BrowserArea initialization effect uses a cancellation flag to avoid stale async work after unmount
- [ ] No duplicate key warnings in React strict mode
- [ ] All existing 68 browser/tab tests pass
- [ ] New tests cover the race condition and dedup scenarios

## Context
- **Related Bugs**: B018, B019, B020
- **Related Specs**: 019, 020
- **Affected Files**:
  - `packages/react-ui/src/stores/tabStore.ts`
  - `packages/react-ui/src/components/browser/BrowserArea.tsx`

## Tasks
1. Write failing tests for initialize() race condition (concurrent calls)
2. Write failing tests for createTab() dedup (facade returns existing tab)
3. Add module-level promise lock to initialize()
4. Add ID dedup check to createTab()
5. Add cancellation flag to BrowserArea async effect
6. Verify all 68+ existing tests pass

## Notes
- TabsFacade (line 152-166) has intentional URL duplicate detection - returns existing tab instead of creating new
- tabStore.createTab prepends without checking: `[newTab, ...state.tabs]`
- BrowserService.createView is already idempotent - this is a renderer-store issue only
