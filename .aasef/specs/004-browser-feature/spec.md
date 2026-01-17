# Spec 004: Browser Feature

## Overview
Implement Arc-style multi-tab browser using Electron's WebContentsView API with tab management, URL bar, and keyboard shortcuts.

## Requirements

### R1: TabManager (Main Process)
- WebContentsView per tab (not deprecated BrowserView)
- Tab state: id, url, title, favicon, isLoading, canGoBack, canGoForward, isAudible, isMuted, zoomLevel
- Origin tracking: originSpaceId, originSpaceItemId
- Max 20 concurrent tabs
- Tab lifecycle events: created, activated, updated, closed

### R2: Tab Bar UI
- Tab items with favicon, title, close button
- Loading indicator
- Audio indicator for playing tabs
- Drag reorder between tabs
- Cmd+Click opens new tab

### R3: URL Bar
- Auto-select all text on focus
- Unfocus on navigation or Escape
- JetBrains Mono font
- Smart search suggestions (history, spaces, search engine)
- URL normalization (lowercase, no trailing slash, no www)

### R4: Navigation Controls
- Back/Forward buttons with state
- Reload button
- Stop button (during loading)
- Zoom controls

### R5: Keyboard Shortcuts
- Cmd+T: New tab
- Cmd+W: Close tab
- Cmd+Shift+T: Reopen closed tab
- Cmd+L: Focus URL bar
- Cmd+R / Cmd+Shift+R: Reload / Hard reload
- Cmd+[/]: Back/Forward
- Cmd+1-9: Switch to tab N
- Cmd+F: Find in page
- Cmd++/-/0: Zoom

### R6: Tab Duplicate Prevention
- Check by SpaceItem ID first (most reliable)
- Fallback to URL check
- URL normalization for comparison

## Acceptance Criteria
- [ ] WebContentsView tabs load and display correctly
- [ ] Tab bar shows favicon and title updates
- [ ] URL bar auto-selects and handles Escape
- [ ] All keyboard shortcuts work
- [ ] Tab limit enforced at 20
- [ ] Duplicate tabs detected and focused

## Dependencies
- 001-project-foundation
- 002-navigation-shell
- 003-spaces-feature (for origin tracking)

## Reference Files
- Old: `spayce/frontend/lib/features/browser/`
- Old Tests: `spayce/frontend/test/unit/browser/`, `spayce/frontend/test/widget/browser/`
- Implementation Plan: AUGMENTED SECTION 11
