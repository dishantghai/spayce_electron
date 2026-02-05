# B018: Multi-Tab Store Synchronization - Five Interconnected Browser Bugs

## Description

Five interconnected browser bugs caused by a single architectural gap: **tabStore and browserUiStore operate independently without synchronization**, despite managing overlapping state for the same tab/view entities.

### Symptoms

1. **No default tab on startup** - Browser starts with 0 tabs in the tab bar
2. **Last tab can close to empty** - Closing the last tab leaves the browser in an empty state instead of creating a new default tab (Flutter behavior: always keeps at least one tab)
3. **Tab title stays "New Tab"** - After a page loads, the tab bar still shows "New Tab" instead of the page title
4. **No favicon in tab bar** - Favicons from loaded pages never appear in the tab bar
5. **New tab doesn't show content** - Creating a new tab still shows the previous tab's content in the toolbar/URL bar

### Root Cause Analysis

**Fundamental gap**: `tabStore` (tab list, `tabs:*` IPC) and `browserUiStore` (view state, `browser:*` events) are disconnected stores managing the same entities.

**Critical link**: In `tabHandlers.ts:56`, `browserService.createView(tab.id, ...)` uses the tab ID as the view ID. So `tab.id === view.id`. But the two stores don't share this knowledge.

**Detailed breakdown**:

- **Bug 1 (No default tab)**: `tabStore.initialize()` loads empty DB (0 tabs). `browserUiStore.initialize()` creates a WebContentsView with a NEW `crypto.randomUUID()` that is NOT linked to any tab. Tab bar reads from tabStore (0 tabs), view reads from browserUiStore (1 unlinked view).

- **Bug 2 (Last tab closable)**: `tabStore.closeTab()` line 188 sets `activeTabId = null` when remaining is empty. No logic to auto-create a default tab like Flutter's `tab_manager.dart:332-337`.

- **Bug 3 (Title not updating)**: BrowserService sends `browser:title` events. `initializeBrowserEventSubscriptions()` routes these to `browserUiStore.handleTitleEvent(viewId, title)`. But `views.get(viewId)` returns undefined (viewId = tab.id was never registered in browserUiStore). Event silently dropped. `tabStore.updateTabFromEvent()` exists but is **never called** from any event subscription.

- **Bug 4 (No favicon)**: Same root cause as Bug 3. `browser:favicon` events go to browserUiStore (view not found), never reach tabStore.

- **Bug 5 (New tab shows old content)**: `tabStore.createTab()` calls `tabs:create` IPC which creates the view and swaps it in the main process (correct). But `browserUiStore.activeViewId` still points to the old UUID from initialization. Toolbar reads from stale browserUiStore view. Events from the new view are also dropped.

## Acceptance Criteria

- [ ] On fresh start (empty DB), one default tab opens with `https://www.google.com`
- [ ] Closing the last remaining tab auto-creates a new default tab (never 0 tabs)
- [ ] Tab title updates in the tab bar when a page finishes loading
- [ ] Tab favicon appears in the tab bar when a page provides one
- [ ] Creating a new tab shows the new tab's content and URL in the toolbar
- [ ] Switching tabs updates both the tab bar active state and the toolbar/URL bar
- [ ] Browser events (title, favicon, loading, navigation) update both tabStore and browserUiStore
- [ ] All existing 99 Phase 2 tests continue to pass
- [ ] All 32 IPC contract tests continue to pass

## Context

- **Related Stories**: F037, F038, F039 (Phase 2 Multi-Tab Browser)
- **Related Specs**: 019 (Single Tab Browser), 020 (Tab Bar), 021 (Tab Switching)
- **Flutter Reference**: `tab_manager.dart:101-108` (default tab), `tab_manager.dart:332-337` (last tab guard), `tabbed_browser_screen.dart:436-441` (title update)
- **Affected Files**:
  - `packages/react-ui/src/stores/tabStore.ts` - closeTab guard, default tab
  - `packages/react-ui/src/stores/browserUiStore.ts` - registerView/unregisterView helpers
  - `packages/react-ui/src/components/browser/BrowserArea.tsx` - initialization rewrite, event bridging
  - `packages/react-ui/__tests__/stores/tabStore.test.ts` - new tests for closeTab guard
  - `packages/react-ui/__tests__/components/browser/BrowserArea.test.tsx` - integration tests (if added)

## Tasks

1. Add `registerView()` and `unregisterView()` to browserUiStore for external registration
2. Rewrite BrowserArea initialization to create default tab when empty, register views in browserUiStore
3. Bridge browser event subscriptions to update BOTH stores (title, favicon, loading, navigation)
4. Add last-tab-close guard in tabStore.closeTab() that auto-creates a default tab
5. Sync browserUiStore.activeViewId on tab create/switch/close operations
6. Write TDD tests for all acceptance criteria
7. Verify all 99 existing Phase 2 tests still pass

## Notes

- Tab ID === View ID (confirmed in `tabHandlers.ts:56`)
- `browserUiStore.initialize()` should no longer create its own independent view
- Event bridging should use `useTabStore.getState().updateTabFromEvent()` which already exists
- Follow Flutter pattern: minimum 1 tab always, default URL is `https://www.google.com`
