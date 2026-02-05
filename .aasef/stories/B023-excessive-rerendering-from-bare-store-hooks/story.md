# B023: Excessive Re-rendering from Bare Store Hook Subscriptions

## Description
Phase 2 browser changes (B019 auto-registration fix) combined with pre-existing bare
`useBrowserUiStore()` hook calls create a re-render storm. Every browser WebContentsView
event (loading, progress, navigation, title, favicon) triggers `set()` in browserUiStore,
which re-renders ALL components subscribed via bare hooks — including App.tsx (root component).

This causes 100-300 unnecessary re-renders per page load, making sidebar mode transitions
(pin/unpin) unresponsive and visually broken during page loading.

## Root Cause
B019 fix changed event handlers from "bail silently for unknown views" to "auto-register
and always call set()". This is correct behavior (prevents race conditions), but the
downstream impact on App.tsx wasn't considered. App.tsx uses `useBrowserUiStore()` without
a selector just to extract the `setVisibility` action, subscribing the entire app tree to
every store update.

## Acceptance Criteria
- [ ] App.tsx uses selector for `setVisibility` (not bare hook)
- [ ] BrowserArea.tsx uses selectors for both stores (actions vs state)
- [ ] BrowserErrorOverlay.tsx uses selectors for actions
- [ ] Sidebar mode transitions (pin/unpin) work smoothly during page loading
- [ ] All existing tests pass

## Context
- **Related Spec**: 018, 019, 020
- **Dependencies**: B019 (auto-registration change)
- **Affected Files**:
  - `packages/desktop/src/renderer/App.tsx` (line 361)
  - `packages/react-ui/src/components/browser/BrowserArea.tsx` (lines 70, 73)
  - `packages/react-ui/src/components/browser/BrowserErrorOverlay.tsx` (line 73)

## Tasks
1. Fix App.tsx: Replace bare hook with selector for setVisibility action
2. Fix BrowserArea.tsx: Use selectors for browserUiStore and tabStore
3. Fix BrowserErrorOverlay.tsx: Use selectors for actions
4. Verify sidebar pinning works during page loading
5. Run all existing tests to confirm no regressions

## Notes
- Zustand bare hooks `useStore()` subscribe to ALL state changes
- Zustand selectors `useStore((s) => s.action)` subscribe only to returned value changes
- Actions in Zustand are stable references (same identity across renders)
- Using selectors for actions prevents re-renders when only state values change
