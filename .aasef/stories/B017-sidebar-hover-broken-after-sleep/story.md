# B017: Sidebar Hover-to-Open Broken After System Sleep/Wake

## Description
After the system wakes from sleep, moving the mouse to the left edge of the screen no longer opens the floating sidebar overlay. The content area loads correctly, but the hover auto-show mechanism is permanently broken until the app is restarted.

## Root Cause Analysis

### ROOT CAUSE 1: Show/Hide Race During Post-Resume Cooldown

After resume, the renderer activates a 1.5s cooldown (`autoShowCooldownRef`) to prevent immediate auto-show. But main process mouse tracking restarts immediately and calls `show()` before the cooldown expires.

**The Race**:
1. `handleSystemResume()` restarts mouse tracking immediately (line 728-729)
2. Renderer sets 1.5s cooldown (line 2280)
3. Mouse tracking detects cursor at left edge → calls `show()` directly (line 136)
4. `show()` stops mouse tracking (line 277), starts animation
5. Renderer receives `auto-show-triggered`, rejects it (cooldown) → calls `hideInstant()`
6. `hideInstant()` checks `!isVisible` → `isVisible` is still `false` during animation → **NO-OP**
7. `show()` completes: `isVisible = true`, mouse tracking stopped
8. **Dead state**: overlay visible but renderer unaware, mouse tracking permanently stopped

Mouse tracking is stopped inside `show()` (line 277) and only restarted inside `hide()` (line 346-348). Since `hide()` never runs (renderer's attempt failed), tracking never restarts.

### ROOT CAUSE 2: Error in Mouse Tracking Permanently Kills It

The `catch` block in `startMouseTracking()` (lines 139-143) calls `this.stopMouseTracking()` on ANY error. If `screen.getCursorScreenPoint()` or `mainWindow.getBounds()` throws transiently after system wake (display not fully initialized), mouse tracking is permanently stopped with no recovery mechanism.

```typescript
} catch (error) {
    console.error('[SidebarOverlayService] Error in mouse tracking:', error);
    this.stopMouseTracking(); // ← PERMANENTLY DEAD
}
```

## Fix

### Fix 1: Post-Resume Cooldown in Main Process
Add a `resumeCooldownUntil` timestamp to `SidebarOverlayService`. In `handleSystemResume()`, set it to `Date.now() + 2000` (2s, slightly longer than the renderer's 1.5s cooldown). In the mouse tracking interval, skip auto-show if within the cooldown.

This prevents the show/hide race entirely — mouse tracking keeps running but doesn't trigger `show()` during the cooldown.

### Fix 2: Remove Permanent Tracking Kill on Error
Remove `this.stopMouseTracking()` from the catch block. Transient errors (display not ready after wake) should just skip the current tick, not permanently kill tracking.

## Acceptance Criteria
- [ ] Mouse tracking does NOT trigger `show()` during 2s post-resume cooldown
- [ ] Mouse tracking continues running during post-resume cooldown (just skips trigger)
- [ ] After cooldown expires, hover-to-open works normally
- [ ] A transient error in mouse tracking does NOT permanently stop tracking
- [ ] Existing sleep/wake behavior (B008 overlay hide) is preserved
- [ ] Same-space reorder and non-resume flows are unaffected

## Context
- **Related Bugs**: B008 (sleep/wake overlay recovery)
- **Affected Files**: `packages/desktop/src/main/services/SidebarOverlayService.ts`
- **Test File**: `packages/desktop/__tests__/B017-sidebar-hover-after-sleep.test.ts`

## Tasks
1. Write TDD tests for post-resume cooldown and error resilience (RED phase)
2. Add `resumeCooldownUntil` field and check in mouse tracking callback (GREEN phase)
3. Remove `stopMouseTracking()` from catch block (GREEN phase)
4. Run all tests to verify zero regressions (VERIFY phase)
