# B010: Sidebar Overlay Unnecessarily Animates When Switching to Browser Tab in Floating Mode

## Description

When the user is in Spaces or Workspace tab with floating sidebar mode and switches to the Browser tab, the sidebar overlay slides in from the left with a 250ms animation. This is inconsistent with switching between Spaces and Workspace tabs, which is instantaneous. The overlay should appear instantly during tab switches, reserving the slide-in animation only for the auto-show triggered by mouse hover on the left edge.

## Root Cause Analysis

### Summary
The overlay visibility effect always calls `show()` (animated) when entering overlay mode (`useOverlayMode` becomes `true`). There is no `showInstant()` method to distinguish between tab-switch context (should be instant) and auto-show context (should animate). The asymmetry is evident: `hideInstant()` exists and is correctly used when leaving overlay mode, but the symmetric `showInstant()` is missing.

### Issue: `show()` always animates with 250ms slide-in

When `activeTab` changes from `'spaces'`/`'workspace'` to `'browser'`:
1. `useOverlayMode` becomes `true` (derived: `sidebarMode === 'floating' && activeTab === 'browser'`)
2. The overlay visibility effect fires and takes Branch A (`useOverlayMode && sidebarVisible`)
3. Branch A calls `window.electronAPI.sidebarOverlay.show()` (App.tsx:544)
4. `show()` in SidebarOverlayService always calls `animateBounds(-320, 0)` (line 301)
5. `animateBounds()` performs a 250ms ease-out cubic animation, sliding the overlay from x=-320 to x=0

### Why Spaces↔Workspace is instant (for comparison)
When switching between Spaces and Workspace, `useOverlayMode` stays `false` (both are non-browser tabs). The React sidebar stays visible and just swaps content — no overlay is involved, so no animation occurs.

### Why Browser→Spaces/Workspace is instant (asymmetric fix already exists)
When leaving overlay mode, the effect detects `isTransitioningOut = true` and calls `hideInstant()` (line 559). This method removes the overlay WebContentsView immediately without animation. The B009 fix also sets `reactSidebarVisible=true` synchronously so the React sidebar appears instantly.

### Evidence Chain
- `App.tsx:298` - `useOverlayMode = sidebarMode === 'floating' && activeTab === 'browser'`
- `App.tsx:500` - `isTransitioningOut = wasOverlayMode === true && useOverlayMode === false` (only detects leaving overlay)
- `App.tsx:540-548` - Branch A: `if (useOverlayMode && sidebarVisible)` → calls `show()` (always animated)
- `App.tsx:549-564` - Branch B: `else if (isTransitioningOut)` → calls `hideInstant()` (instant)
- `SidebarOverlayService.ts:232-307` - `show()` method always calls `animateBounds(-this.config.width, 0)`
- `SidebarOverlayService.ts:301` - `await this.animateBounds(-this.config.width, 0)` — 250ms animation
- `SidebarOverlayService.ts:356-370` - `hideInstant()` exists — no animation, immediate removal
- `SidebarOverlayService.ts:429` - `animationDuration = 250` (from DEFAULT_CONFIG)
- `preload/index.ts:164` - `show()` exposed but no `showInstant()` method
- `sidebarOverlayHandlers.ts:68` - IPC handler for `show` exists, no `showInstant` handler

### Visual Result
User clicks Browser tab → React sidebar hides → 250ms gap with overlay sliding in from left → overlay fully visible. Should be: React sidebar hides → overlay instantly visible (no animation).

## Acceptance Criteria

- [ ] Switching from Spaces tab to Browser tab in floating mode does NOT show slide-in animation
- [ ] Switching from Workspace tab to Browser tab in floating mode does NOT show slide-in animation
- [ ] Overlay appears instantly when entering overlay mode via tab switch
- [ ] Auto-show via mouse hover on left edge still uses the slide-in animation
- [ ] `showInstant()` method added to SidebarOverlayService
- [ ] `showInstant` IPC handler registered in sidebarOverlayHandlers
- [ ] `showInstant` exposed in preload API
- [ ] Overlay visibility effect detects tab-switch-into-overlay context (`isTransitioningIn`)
- [ ] `isTransitioningIn` uses `showInstant()` instead of `show()`
- [ ] Browser→Spaces/Workspace transition still works correctly (hideInstant)
- [ ] Mode toggle (pin/unpin) still works correctly
- [ ] All existing B009 and B008 tests pass

## Context

- **Related Stories**: B009, B002, B003, B008
- **Related Spec**: 020 (Sidebar Overlay)
- **Affected Files**: `packages/desktop/src/main/services/SidebarOverlayService.ts`, `packages/desktop/src/main/ipc/sidebarOverlayHandlers.ts`, `packages/desktop/src/preload/index.ts`, `packages/desktop/src/renderer/App.tsx`

## Tasks

1. Write TDD tests verifying instant show on tab switch, animated show on auto-show, and isTransitioningIn detection
2. Add `showInstant()` method to `SidebarOverlayService` (symmetric to `hideInstant()`)
3. Register `sidebar-overlay:showInstant` IPC handler in `sidebarOverlayHandlers.ts`
4. Expose `showInstant` in preload API (`preload/index.ts`)
5. Add `isTransitioningIn` detection in overlay visibility effect (symmetric to `isTransitioningOut`)
6. Use `showInstant()` in Branch A when `isTransitioningIn` is true
7. Run all tests and verify no regressions

## Notes

- The fix follows the exact same pattern as `hideInstant()` which already exists and works correctly
- `isTransitioningIn` is the symmetric counterpart to `isTransitioningOut`: `wasOverlayMode === false && useOverlayMode === true`
- Auto-show from mouse tracking does NOT go through the overlay visibility effect — it's triggered by `sidebar-overlay:auto-show-triggered` event which calls `setSidebarVisible(true)`, causing the effect to fire with `useOverlayMode` already true and `wasOverlayMode` also true (no transition detected). So `isTransitioningIn` will NOT match auto-show, only tab switches.
- The `showInstant()` method skips `animateBounds()` and directly sets bounds at x=0, matching the pattern of `hideInstant()` which skips animation and directly removes the view
