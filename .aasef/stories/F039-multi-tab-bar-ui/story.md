# F039: Multi-Tab Bar UI Enhancement

## Description
Enhance the BrowserTabBar component for full multi-tab support with drag-and-drop reordering,
scrollable tabs, proper close button behavior (visible on hover/active only), and pixel-perfect
match to the Flutter Spayce app design.

Phase 2 of Browser Integration Plan (Spec 020: Tab Bar UI Component).

## Acceptance Criteria
- [ ] Tabs display with title and favicon (from tabStore)
- [ ] Active tab has visual indicator (2px top purple border + lighter background)
- [ ] Close button visible only on hover and active tabs (opacity transition)
- [ ] Close button always visible when active tab (even without hover)
- [ ] New tab (+) button creates new tab via tabStore.createTab()
- [ ] Clicking tab switches to it via tabStore.switchTab()
- [ ] Drag-and-drop reorders tabs (HTML5 drag API)
- [ ] Tab bar scrolls horizontally when tabs overflow (hidden scrollbar)
- [ ] Active tab auto-scrolls into view
- [ ] Loading spinner shows during page load (replaces favicon)
- [ ] Default globe icon when no favicon
- [ ] Tab title truncated with ellipsis
- [ ] Matches Flutter app screenshot pixel-perfectly (colors, spacing, sizes)
- [ ] Keyboard accessible (Tab, Enter, Delete)
- [ ] Component tests for TabBar and TabItem

## Context
- **Related Spec**: 020 (Tab Bar UI Component from Phase 2 plan)
- **Dependencies**: F037, F038
- **Affected Files**:
  - packages/react-ui/src/components/browser/BrowserTabBar.tsx (REWRITE)
  - packages/react-ui/src/components/browser/BrowserTabBar.module.css (UPDATE)
  - packages/react-ui/src/components/browser/TabItem.tsx (NEW)
  - packages/react-ui/src/components/browser/TabItem.module.css (NEW)
  - packages/react-ui/src/components/browser/BrowserArea.tsx (UPDATE integration)

## Tasks
1. Create TabItem.tsx component with hover/active/loading states
2. Create TabItem.module.css with pixel-perfect styling
3. Rewrite BrowserTabBar.tsx to use tabStore and TabItem
4. Add drag-and-drop reordering with HTML5 Drag API
5. Add horizontal scroll with hidden scrollbar
6. Add auto-scroll to active tab
7. Update BrowserArea.tsx to wire tabStore actions
8. Write component tests for TabItem
9. Write component tests for BrowserTabBar

## Notes
- Match Flutter screenshot: dark bg (#131020), active tab lighter bg (#1A1628), purple top border (#6D5AE6)
- Tab dimensions: min-width 120px, max-width 200px, height 32px
- Favicon: 14x14px with 2px border-radius
- Close button: 18x18px, opacity 0 -> 1 on hover
- Font: 12px/500 weight for tab title
- Left padding 76px for macOS traffic lights
- New tab button: 32x32px, left of tabs
- Drag overlay: subtle highlight on drop target
- Use CSS custom properties from design system
