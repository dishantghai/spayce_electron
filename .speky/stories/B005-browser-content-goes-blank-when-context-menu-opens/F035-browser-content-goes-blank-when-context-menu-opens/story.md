# [BUG] Browser content goes blank when context menu opens in Fixed Sidebar Mode

## Description
When the sidebar is in Fixed mode and a context menu is opened (right-click in browser content), the browser content area goes completely blank/white until the context menu is dismissed. This only occurs in Fixed sidebar mode - Floating mode works correctly. The issue appears to be related to focus management or WebContentsView rendering when the context menu overlay appears.

## Acceptance Criteria
- [ ] Right-clicking in browser content in Fixed sidebar mode shows context menu without blanking the page
- [ ] Browser content remains visible and interactive while context menu is open
- [ ] Context menu functions normally (copy, paste, inspect element, etc.)
- [ ] No regression in Floating sidebar mode behavior
- [ ] Focus returns correctly to browser content when context menu is dismissed
- [ ] Works across different websites and content types

## Context
- Issue is specific to Fixed sidebar mode where sidebar is permanently docked
- WebContentsView is used for browser tabs (not deprecated BrowserView)
- Focus management has independent contexts for sidebar vs spaces screen
- May be related to z-index layering or WebContentsView visibility handling
- Context menus are native Electron menus, not custom React components

## Tasks
- [ ] Investigate WebContentsView visibility/rendering during context menu display
- [ ] Check if issue is related to focus management between sidebar and browser content
- [ ] Examine CSS z-index and positioning for Fixed sidebar mode
- [ ] Test context menu behavior in both sidebar modes to identify differences
- [ ] Implement fix ensuring WebContentsView remains visible during context menu
- [ ] Add regression tests for context menu behavior in both sidebar modes

## Notes
- This is a critical UX issue as context menus are frequently used for browser interaction
- May need to examine Electron's WebContentsView documentation for overlay handling
- Consider if this affects other overlays (tooltips, dropdowns) in Fixed mode
- Test with various context menu types (text selection, image, link, etc.)