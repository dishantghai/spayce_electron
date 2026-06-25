# [BUG] Browser content goes blank when context menu opens in fixed sidebar mode

## Description
When the sidebar is in fixed mode and a context menu is opened (right-click on browser content, bookmarks, or other elements), the browser content area becomes blank/white until the context menu is dismissed. This only occurs in fixed sidebar mode - floating sidebar mode works correctly.

## Acceptance Criteria
- [ ] Browser content remains visible when context menus open in fixed sidebar mode
- [ ] Context menus function normally without affecting browser content visibility
- [ ] Fixed sidebar mode behaves consistently with floating sidebar mode for context menu interactions
- [ ] No visual artifacts or flashing when context menus appear/disappear
- [ ] Browser content maintains proper focus state after context menu dismissal

## Context
This appears to be a WebContentsView rendering issue specific to fixed sidebar layout. The problem likely stems from:
- Z-index conflicts between context menu overlay and WebContentsView
- Focus management issues when context menu captures input
- Potential Electron renderer process coordination problems between sidebar and browser content

Key areas to investigate:
- `packages/desktop/` - Electron main process WebContentsView management
- Sidebar layout CSS in fixed mode vs floating mode
- Context menu implementation and overlay handling
- Focus management between sidebar and browser content contexts

## Tasks
- [ ] Reproduce the bug consistently in fixed sidebar mode
- [ ] Compare WebContentsView handling between fixed and floating modes
- [ ] Investigate z-index and overlay conflicts with context menus
- [ ] Check focus management during context menu interactions
- [ ] Test context menu behavior across different browser content types
- [ ] Implement fix ensuring WebContentsView remains visible
- [ ] Add regression tests for context menu interactions in both sidebar modes

## Notes
- This is likely an Electron-specific rendering issue rather than a React component problem
- May need to adjust WebContentsView positioning or z-index handling in fixed mode
- Consider if this affects other overlay elements (tooltips, dropdowns) in fixed mode
- Ensure fix doesn't break existing context menu functionality