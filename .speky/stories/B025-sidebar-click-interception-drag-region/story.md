# B025: Sidebar Overlay Click Events Not Captured Over Tab Bar Drag Region

## Description
Click events on the sidebar overlay are not being captured when the underlying BrowserTabBar area is a `-webkit-app-region: drag` region. Clicks work when a tab element (with `no-drag`) is behind the clicked area, but fail when the empty tab bar background or spacer (with `drag`) is behind.

## Root Cause
The BrowserTabBar uses `-webkit-app-region: drag` for window dragging functionality. In Electron, drag regions are handled at the Chromium compositor level and can intercept mouse events **even through overlapping transparent WebContentsViews**.

The initial fix attempt (adding `-webkit-app-region: no-drag` to sidebar.html `#sidebar-root`) did NOT work because:
- Drag regions in a DIFFERENT WebContentsView (the main renderer) still intercept clicks
- The `no-drag` property only affects elements within the SAME WebContentsView

## Solution
Dynamically disable drag regions in the main renderer when the sidebar overlay is visible:

1. Added `sidebarOverlayActive` prop to `BrowserTabBarProps` and `BrowserAreaProps`
2. When `sidebarOverlayActive={true}`, apply inline style `WebkitAppRegion: 'no-drag'` to `.tabBar` and `.tabBarSpacer` elements
3. App.tsx passes `sidebarOverlayActive={useOverlayMode && sidebarVisible}` to BrowserArea

This ensures:
- Window dragging works on the tab bar when sidebar is hidden
- Clicks are captured on the sidebar overlay when it's visible

## Acceptance Criteria
- [x] Clicks on sidebar overlay are captured regardless of what's behind it
- [x] Window dragging still works on the tab bar (when sidebar is not visible)
- [x] All existing sidebar functionality remains intact
- [x] All existing tests pass (178 B0xx tests pass)

## Files Changed
- `packages/desktop/src/renderer/sidebar.html` - Added defensive `-webkit-app-region: no-drag`
- `packages/react-ui/src/components/browser/BrowserTabBar.tsx` - Added `sidebarOverlayActive` prop
- `packages/react-ui/src/components/browser/BrowserArea.tsx` - Added `sidebarOverlayActive` prop
- `packages/desktop/src/renderer/App.tsx` - Pass prop based on overlay visibility
- `packages/desktop/__tests__/B025-sidebar-click-interception-drag-region.test.ts` - 13 tests

## Technical Details
The `-webkit-app-region: drag` CSS property is processed by Chromium's compositor at a lower level than DOM events. When overlapping WebContentsViews exist:
- Main renderer has drag regions in BrowserTabBar
- Sidebar overlay is a transparent WebContentsView on top
- Drag regions in the LOWER view can intercept clicks meant for the UPPER view

Reference: [Electron Issue #12150](https://github.com/electron/electron/issues/12150)

## Test Coverage
- 13 tests verify:
  - Sidebar HTML has `-webkit-app-region: no-drag` on `#sidebar-root` (defensive)
  - BrowserTabBar preserves drag regions in CSS (for when overlay is hidden)
  - `sidebarOverlayActive` prop exists and is wired correctly through the component chain
  - App.tsx passes the prop based on `useOverlayMode && sidebarVisible`
