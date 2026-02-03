# B009: Sidebar Collapses When Switching From Browser to Non-Browser Tabs in Floating Mode

## Description

When the user is in Browser tab with Floating sidebar mode and the sidebar overlay is visible, clicking the Spaces tab or Workspace tab causes the sidebar to collapse (slide off-screen) and then re-expand with a 250ms animation. Additionally, rapidly switching tabs (e.g., Workspace → Browser → Workspace) causes the sidebar to collapse due to a race condition in the overlay visibility effect. The sidebar should remain visible without any collapse animation during tab switches. This affects all non-browser tabs (`'spaces'` and `'workspace'`).

## Root Cause Analysis

### Summary
Four coordinated issues cause the sidebar to collapse when transitioning from overlay mode (Browser tab) to React sidebar mode (any non-browser tab).

### Issue 1: `reactSidebarVisible` is not set synchronously
When `activeTab` changes from `'browser'` to `'spaces'` or `'workspace'`:
1. `useOverlayMode` becomes `false` immediately (derived: `sidebarMode === 'floating' && activeTab === 'browser'`)
2. The sidebar wrapper becomes visible (`opacity: 1, visibility: visible`) - derived directly from `useOverlayMode`
3. BUT `reactSidebarVisible` is still `false` - only updated by a useEffect (App.tsx:415-425) that runs AFTER render
4. Sidebar receives `isVisible={false}` -> renders with `.collapsed` class -> `transform: translateX(-320px)`

### Issue 2: CSS transitions are not suppressed
The `no-transitions` class (which sets `transition: none !important` on all children) is only applied during mode switches (floating <-> fixed) via the `isModeSwitch` flag. During tab switches, transitions remain active, causing the 250ms slide-in animation when `reactSidebarVisible` becomes true.

### Issue 3: `prevUseOverlayMode.current` race condition (rapid tab switching)
The overlay visibility effect's async function updates `prevUseOverlayMode.current` at the END of the function, AFTER `await show()/hide()`. When tabs switch rapidly (e.g., Workspace → Browser → Workspace):
1. Step 2 (Browser tab): effect fires, `await show()` starts (~300ms). Ref NOT yet updated.
2. Step 3 (Workspace tab): effect fires AGAIN before show() completes. Reads stale `prevUseOverlayMode.current = false`.
3. `isTransitioningOut = false` (WRONG - should be true). Falls to `else` branch (wrong branch).
4. Step 2's `await show()` eventually completes, corrupts state (`overlayActuallyVisible = true`, `prevUseOverlayMode.current = true`) even though overlay should be hidden.

### Issue 4: Spurious `VISIBILITY_CHANGE {visible: false}` from overlay after tab switch
When the overlay WebContentsView is hidden (via `hideInstant()`) after a tab switch from browser to non-browser, the overlay sidebar's Sidebar component fires a mouseleave event (mouse "leaves" as the view disappears). This triggers `handleVisibilityChange(false)` in `sidebar.tsx`, which sends `VISIBILITY_CHANGE {visible: false}` back to the main renderer. The main renderer's `VISIBILITY_CHANGE` handler calls `setSidebarVisible(false)`, and the sync effect then sets `reactSidebarVisible=false`, collapsing the React sidebar.
1. TAB_CHANGE {tab: 'workspace'} → B009 fix fires: `reactSidebarVisible=true`, `isModeSwitch=true`
2. Overlay visibility effect hides the overlay WebContentsView via `hideInstant()`
3. Overlay sidebar's mouseleave fires → `VISIBILITY_CHANGE {visible: false}` sent via IPC
4. Main renderer processes `VISIBILITY_CHANGE` → `setSidebarVisible(false)` → sync effect → `reactSidebarVisible=false` → sidebar collapses

### Evidence Chain
- `App.tsx:298` - `useOverlayMode` derived synchronously from `sidebarMode` and `activeTab`
- `App.tsx:2265-2266` - wrapper opacity/visibility derived from `useOverlayMode` (changes in same render)
- `App.tsx:2281` - `isVisible={reactSidebarVisible}` passed to Sidebar (still false during first render)
- `App.tsx:415-425` - sync effect sets `reactSidebarVisible = sidebarVisible` (runs after render)
- `Sidebar.tsx:695` - `!isVisible` adds `collapsed` CSS class
- `Sidebar.module.css:18` - `.floating` has `transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1)`
- `Sidebar.module.css:22` - `.collapsed` has `transform: translateX(-320px)`
- `App.tsx:554` - `prevUseOverlayMode.current` updated AFTER async operations (stale for rapid switches)
- `App.tsx:855-886` - `handleModeToggle` already solves same class of bug for mode switches
- `SidebarTabs.tsx:6` - Tab IDs: `'browser' | 'spaces' | 'workspace'` - all non-browser tabs affected
- `sidebar.tsx:223-253` - `handleVisibilityChange` sends `VISIBILITY_CHANGE` on mouseleave (300ms grace period insufficient)
- `sidebar.tsx:620` - overlay sidebar passes `isVisible={true}` → mouseleave handler always active
- `App.tsx:2161-2166` - `VISIBILITY_CHANGE` handler unconditionally calls `setSidebarVisible(action.payload.visible)`

### Visual Result
Overlay disappears -> 1-frame gap (no sidebar) -> sidebar slides in from left over 250ms.
With rapid switching: overlay doesn't transition correctly, sidebar may collapse and stay collapsed.

## Acceptance Criteria

- [x] Switching from Browser tab to Spaces tab in floating mode does NOT cause sidebar collapse animation
- [x] Switching from Browser tab to Workspace tab in floating mode does NOT cause sidebar collapse animation
- [x] Rapid Workspace->Browser->Workspace sequence does NOT cause sidebar collapse
- [x] React sidebar appears instantly (no slide-in animation) when transitioning from overlay to React sidebar
- [x] `reactSidebarVisible` is set to `true` synchronously during the tab switch
- [x] `no-transitions` class is applied during the overlay-to-React sidebar transition
- [x] `prevUseOverlayMode.current` is updated synchronously before async operations
- [x] Stale async operations are aborted via generation counter
- [x] `useOverlayModeRef` is updated synchronously in TAB_CHANGE handler
- [x] `VISIBILITY_CHANGE {visible: false}` is ignored when not in overlay mode
- [x] Normal mouse-leave in overlay mode still works (VISIBILITY_CHANGE processed correctly)
- [x] Switching from Spaces tab to Browser tab still works correctly (React sidebar hides, overlay shows)
- [x] Mode toggle (pin/unpin) still works correctly
- [x] All existing tests pass

## Context

- **Related Stories**: B002, B003, B005, B006, B007, B008
- **Related Spec**: 020 (Sidebar Overlay)
- **Affected Files**: `packages/desktop/src/renderer/App.tsx`

## Tasks

1. Write TDD tests verifying synchronous visibility, transition suppression, and race condition handling
2. Fix TAB_CHANGE handler: set `reactSidebarVisible=true` and `isModeSwitch=true` synchronously when leaving overlay mode
3. Fix overlay visibility effect: move `prevUseOverlayMode.current` update to BEFORE async operations
4. Add generation counter (`overlayEffectGenRef`) to abort stale async invocations
5. Clear `isModeSwitch` after 2 rAFs (same pattern as `handleModeToggle`)
6. Add `useOverlayModeRef` to track overlay mode in IPC callback closures
7. Guard `VISIBILITY_CHANGE` handler to ignore spurious events when not in overlay mode
8. Update `useOverlayModeRef` synchronously in TAB_CHANGE handler
9. Run all tests and verify no regressions

## Notes

- The TAB_CHANGE fix mirrors the pattern from `handleModeToggle` (App.tsx:855-886) which already solves the same class of timing bug for mode switches (floating <-> fixed)
- The overlay visibility effect race condition is a classic async effect staleness bug. Moving ref updates before async operations and adding a generation counter (abort pattern) prevents state corruption from concurrent invocations.
- The condition `newTab !== 'browser'` covers ALL current and future non-browser tabs generically
- Since TAB_CHANGE actions only arrive from the overlay sidebar via IPC, and the overlay is only visible when `sidebarVisible=true`, it is safe to set `reactSidebarVisible=true` unconditionally when leaving overlay mode
- The `useOverlayModeRef` is necessary because the `onAction` IPC callback closure does not have access to the current `useOverlayMode` derived value. The ref is updated both on every render and synchronously in the TAB_CHANGE handler to ensure the VISIBILITY_CHANGE guard has the correct value even before React re-renders.
- The VISIBILITY_CHANGE guard only suppresses `{visible: false}` (not `{visible: true}`) to avoid unintended side effects
