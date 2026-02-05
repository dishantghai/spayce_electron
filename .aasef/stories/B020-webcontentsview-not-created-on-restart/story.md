# B020: WebContentsView Not Created for Existing Tabs on App Restart

## Description
On app restart, tabs loaded from the SQLite database do not have corresponding WebContentsViews created in the main process BrowserService. The renderer displays a loading state (indeterminate progress bar, "New Tab" title, stored URL) but no actual web content loads because no native view exists to render it.

**Symptom**: Browser tab shows permanent loading state with black/empty content area on app startup.

## Root Cause Analysis

### The Bug
BrowserArea initialization (`BrowserArea.tsx:156-193`) follows this flow:
1. Sets up event subscriptions via `initializeBrowserEventSubscriptions()`
2. Calls `initializeTabs()` which loads tabs from DB via `tabs:getAll` IPC
3. Calls `registerView(tab.id, tab.url)` for each tab - **LOCAL STATE ONLY** (browserUiStore)
4. Sets `activeViewId` via `useBrowserUiStore.setState()` - **LOCAL STATE ONLY**
5. Sets `isReady = true`

**The gap**: Step 3 only updates the Zustand store in the renderer. No IPC call is made to:
- `browser:createView` (create WebContentsView in main process)
- `browser:setActiveView` (attach view to window and set bounds)

### Why It Works on First Run
On first run (empty DB), `tabStore.initialize()` calls `createTab()` which triggers the `tabs:create` IPC handler. This handler calls BOTH `browserService.createView()` AND `browserService.setActiveView()` in the main process.

### Why It Fails on Subsequent Runs
On restart, `tabStore.initialize()` calls `getAll()` which returns existing tabs from DB. Since tabs exist, `createTab()` is never called. No `tabs:create` IPC → no `browserService.createView()` → no WebContentsView → no URL loaded → permanent loading state.

### Evidence
- `BrowserService.ts:72`: `private views: Map<string, WebContentsView> = new Map()` - fresh empty Map on restart
- `BrowserService.ts:110-115`: `createView` checks `this.views.has(id)` - idempotent, safe to call again
- `browserUiStore.ts:71-85`: `createDefaultViewState` sets `isLoading: true, loadingProgress: 0` - matches screenshot
- `tabHandlers.ts:56-57`: Only `tabs:create` creates views; `tabs:getAll` is read-only

## Acceptance Criteria
- [ ] On app restart with existing tabs in DB, WebContentsViews are created for all tabs
- [ ] Active tab's view is set as active in the main process (added to window)
- [ ] Idempotent: first-run scenario (view already created by tabs:create) is not affected
- [ ] Resilient: if createView fails for one tab, other tabs still get views
- [ ] Safe: works when browser API is unavailable (testing environment)
- [ ] All existing tests (119) continue to pass

## Tasks
1. Extract `ensureBrowserViewsExist()` function in browserUiStore.ts
2. Call it from BrowserArea.tsx initialization after loading tabs
3. Write tests for the function (TDD)

## Context
- **Related Specs**: 019, 020
- **Related Bugs**: B018, B019 (same initialization flow)
- **Affected Files**: `packages/react-ui/src/stores/browserUiStore.ts`, `packages/react-ui/src/components/browser/BrowserArea.tsx`

## Notes
- `browser:createView` IPC → `BrowserService.createView()` is idempotent (returns early if view exists)
- `browser:setActiveView` IPC → `BrowserService.setActiveView()` adds view to window and applies current bounds
- `sidebarWidth` is always 0 (confirmed in App.tsx)
