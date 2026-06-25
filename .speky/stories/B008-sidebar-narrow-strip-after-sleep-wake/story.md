# B008: Sidebar Overlay Narrow Strip After System Sleep/Wake

## Description
After the system wakes from sleep (or the app is reopened after the system was off), the sidebar overlay renders as a narrow dark/purple strip at the top of the window instead of being properly hidden. The browser content is partially obscured by this strip.

**Expected behavior:**
- On wake from sleep: sidebar should be in floating mode, **collapsed** (hidden)
- Browser context area should be fully visible with no narrow strip
- If Spaces/Workspace was the active tab before sleep, that should restore with sidebar floating but collapsed

**Actual behavior:**
- A narrow dark strip from the sidebar overlay is visible at the top of the window
- The sidebar overlay WebContentsView has stale/invalid bounds
- The browser WebContentsView position may also be incorrect

## Root Cause Analysis

### RC1: No `powerMonitor.on('resume')` handler in main process
The app does not listen for Electron's `powerMonitor` resume event. When the system wakes from sleep:
- `SidebarOverlayService` still thinks the overlay is visible (`isVisible = true`)
- The overlay WebContentsView retains pre-sleep bounds that may now be invalid
- No mechanism exists to re-validate or fix overlay bounds on wake

**File:** `packages/desktop/src/main/index.ts` - No `powerMonitor` usage

### RC2: No `visibilitychange` handler in renderer
Neither `App.tsx` nor `BrowserArea` listens for `document.visibilitychange`. When the system wakes:
- The renderer doesn't know it was asleep
- `BrowserArea` doesn't re-measure and re-send bounds to main process
- The browser WebContentsView position may be stale

**File:** `packages/desktop/src/renderer/App.tsx` - No visibility change handling

### RC3: Stale WebContentsView bounds after sleep
After system wake, the compositor may have invalidated the WebContentsView's internal dimensions:
- The sidebar overlay keeps pre-sleep bounds
- If the window's internal viewport was reset or the display changed, the overlay renders as a narrow strip
- This is the same class of bug as B002 but triggered by a different event (wake vs initial load)

**File:** `packages/desktop/src/main/services/SidebarOverlayService.ts` - No resume handling

### RC4: Fresh start detection doesn't re-evaluate on wake
The `freshStartOverrideActive` flag is computed only once during initial React render via `useState(() => ...)`. After wake from sleep:
- React does NOT re-mount (process stays alive during sleep)
- `freshStartOverrideActive` remains `false` (user had already interacted)
- Sidebar stays in whatever visibility state it was in before sleep

**File:** `packages/desktop/src/renderer/App.tsx:243-269` - One-time evaluation only

## Acceptance Criteria
- [ ] AC1: After system wake from sleep with browser tab active + floating sidebar, sidebar is collapsed (hidden) with no narrow strip
- [ ] AC2: After system wake from sleep with spaces tab active, spaces screen shows with sidebar floating but collapsed
- [ ] AC3: Browser WebContentsView bounds are re-validated and correct after wake
- [ ] AC4: Sidebar overlay WebContentsView bounds are re-validated after wake (correct height)
- [ ] AC5: Mouse-hover auto-show still works after wake (user can reveal sidebar by hovering left edge)
- [ ] AC6: All existing tests continue to pass - no regression in B002 narrow strip fix, B003 state persistence, or B005-B007 fixes

## Context
- **Related Stories:** B002 (narrow strip on initial load), B003 (state persistence on refresh)
- **Related Spec:** 020 (Browser Integration - Sidebar Overlay)
- **Affected Files:**
  - `packages/desktop/src/main/index.ts` - Add powerMonitor listener
  - `packages/desktop/src/main/services/SidebarOverlayService.ts` - Add handleSystemResume()
  - `packages/desktop/src/main/services/BrowserService.ts` - Add handleSystemResume()
  - `packages/desktop/src/main/window.ts` - Wire resume event to services
  - `packages/desktop/src/renderer/App.tsx` - Handle resume IPC event
  - `packages/desktop/src/preload/types.ts` - Add IPC type
  - `packages/desktop/src/preload/index.ts` - Expose IPC channel

## Tasks
1. **Main process**: Add `powerMonitor.on('resume')` listener in `index.ts`/`window.ts`
2. **IPC**: Add `app:resumed-from-sleep` channel to preload bridge
3. **SidebarOverlayService**: Add `handleSystemResume()` method - hide overlay, re-validate bounds
4. **BrowserService**: Add `handleSystemResume()` method - re-validate bounds
5. **App.tsx**: Listen for resume event - collapse sidebar, trigger re-measurement
6. **Tests**: Write comprehensive tests for all acceptance criteria

## Notes
- The `powerMonitor` API is available in Electron's main process
- `powerMonitor.on('resume')` fires when the system resumes from sleep/hibernate
- On macOS, this covers both sleep (lid close) and display sleep
- The fix follows the same UX pattern as fresh start: sidebar collapses in floating mode
- Must NOT break the page refresh behavior (B003) - refresh should still restore state
- The sidebar overlay bounds re-validation should use the same MIN_VALID_HEIGHT/FALLBACK_HEIGHT constants as B002
