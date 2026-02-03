# B012: Sidebar Narrow Strip After CMD+R Reload + Tab Switch

## Description

When the user presses CMD+R on the Spaces Screen with the floating sidebar open, then switches
to the Browser tab, the sidebar appears as a narrow strip showing only its top ~80px instead
of the full window height. The strip corresponds to the area above the browser chrome
(tab bar + toolbar = ~76-80px).

This is a **z-order race condition**: `showInstant()` correctly adds the sidebar overlay at
the highest z-order, but then `BrowserService.setActiveView()` calls
`mainWindow.contentView.addChildView(browserView)` which pushes the browser view ABOVE the
sidebar overlay. Since the browser view starts at y≈80 (below tab bar + toolbar), the sidebar's
0-80px area peeks out as the visible "narrow strip".

## Root Cause Analysis

### Evidence 1: Z-Order Race in addChildView

**`BrowserService.setActiveView()` (line ~204):**
```typescript
this.mainWindow.contentView.addChildView(view);
```
- Electron's `addChildView()` always places the view at the highest z-order
- When a browser view is activated AFTER `showInstant()`, the browser view goes ABOVE the sidebar
- The sidebar becomes obscured except for the 0-80px area above the browser's y-offset

### Evidence 2: Browser Chrome Height Creates the Strip

**Browser view bounds start below the tab bar + toolbar:**
- TAB_BAR_HEIGHT = 36px
- TOOLBAR_HEIGHT = 40px
- Browser view y-offset ≈ 80px
- The sidebar at y=0 has its 0-80px area visible above the browser view
- This creates the "narrow strip" visual artifact

### Evidence 3: Correct Bounds but Wrong Z-Order

Console logs from reproduction confirmed:
```
[SidebarOverlayService] showInstant() completed — bounds: {"x":0,"y":0,"width":320,"height":900}
```
The sidebar had correct full-height bounds. The issue was purely z-order — the browser view
was painted on top of the sidebar.

## Fix Applied

### 1. `raiseToTop()` method on SidebarOverlayService

```typescript
raiseToTop(): void {
    if (!this.sidebarView || !this.mainWindow || !this.isVisible) return;
    try {
        this.mainWindow.contentView.addChildView(this.sidebarView);
    } catch (error) {
        console.warn('[SidebarOverlayService] Error raising to top:', error);
    }
}
```
Re-adding an already-attached view via `addChildView()` moves it to the highest z-order
without creating a duplicate.

### 2. Call `raiseToTop()` after every `browser:setActiveView` IPC

In `browserHandlers.ts`, the `browser:setActiveView` handler now calls
`getSidebarOverlayService().raiseToTop()` after `browserService.setActiveView(id)`.
This ensures the sidebar maintains z-order supremacy whenever a browser view is activated.

### 3. Defense-in-depth: DOM height updates in sidebar:view-attached

The `sidebar:view-attached` handler in `sidebar.tsx` now ALWAYS updates DOM heights
(`document.documentElement`, `document.body`, `#sidebar-root`) on every call, not just
on first attachment. This prevents stale heights after reload scenarios.

## Acceptance Criteria

- [x] Sidebar shows at full height after CMD+R on Spaces Screen → switch to Browser tab
- [x] Sidebar shows at full height after CMD+R on Browser tab with sidebar open
- [x] Sidebar stays on top when multiple browser views are activated in sequence
- [x] Sidebar stays on top during rapid Spaces↔Browser tab switching after reload
- [x] Multiple CMD+R reloads in sequence don't break sidebar z-order
- [x] `raiseToTop()` is a no-op when sidebar is hidden (no unnecessary work)
- [x] `raiseToTop()` handles errors gracefully (destroyed view, null references)
- [x] Animated `show()` still works correctly with `raiseToTop()`
- [x] Fixed sidebar mode is unaffected
- [x] All existing tests pass (no regressions)

## Context

- **Related Spec**: 020 (sidebar overlay and floating mode)
- **Related Bugs**: B008 (sidebar narrow strip after sleep/wake), B009 (sidebar collapse on tab switch), B010 (overlay animates on tab switch)
- **Affected Files**:
  - `packages/desktop/src/main/services/SidebarOverlayService.ts` (new `raiseToTop()` method)
  - `packages/desktop/src/main/ipc/browserHandlers.ts` (`raiseToTop()` call after setActiveView)
  - `packages/desktop/src/renderer/sidebar.tsx` (view-attached DOM height updates)

## Tasks

1. ~~Add `raiseToTop()` method to `SidebarOverlayService`~~ ✅
2. ~~Call `raiseToTop()` in `browserHandlers.ts` after `browser:setActiveView`~~ ✅
3. ~~Fix `sidebar:view-attached` handler to always update DOM heights~~ ✅
4. ~~Write comprehensive regression tests (B012 test file)~~ ✅
5. ~~Run full test suite to verify no regressions~~ ✅

## Test Coverage

**Test file**: `__tests__/B012-sidebar-narrow-strip-after-reload.test.ts` (31 tests)

- **Part 1**: sidebar:view-attached handler DOM height updates (6 tests)
- **Part 2**: showInstant sends correct view-attached after reload (3 tests)
- **Part 3**: raiseToTop() z-order restoration (7 tests)
- **Part 4**: End-to-end user scenario regression tests (7 tests)
- **Part 5**: Z-order invariant tests (8 tests)

## Notes

- The `addChildView()` behavior of moving an already-attached view to highest z-order
  is documented Electron behavior and is the correct way to re-order child views.
- `raiseToTop()` is intentionally guarded by `isVisible` — when the sidebar is hidden,
  there's no need to maintain z-order and calling `addChildView` would make it visible.
- The browser chrome height (76-80px) is what determined the visible strip size,
  which was the key clue that this was a z-order issue rather than a bounds/height issue.
