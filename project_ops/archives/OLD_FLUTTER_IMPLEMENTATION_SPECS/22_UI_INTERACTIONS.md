# Spayce - User Interactions

> **Document Purpose**: Complete specification of all user interactions, gestures, and behaviors for pixel-perfect recreation.

---

## Table of Contents

1. [Interaction Overview](#interaction-overview)
2. [Mouse Interactions](#mouse-interactions)
3. [Keyboard Shortcuts](#keyboard-shortcuts)
4. [Touch Gestures](#touch-gestures)
5. [Drag & Drop](#drag--drop)
6. [Form Interactions](#form-interactions)
7. [Navigation Patterns](#navigation-patterns)
8. [Error States](#error-states)

---

## Interaction Overview

### Platform Conventions

| Platform | Primary Input | Secondary |
|----------|---------------|-----------|
| macOS | Mouse/Trackpad | Keyboard |
| Windows | Mouse | Keyboard |
| Linux | Mouse | Keyboard |
| iOS | Touch | None |
| Android | Touch | None |

### Interaction Feedback

| Interaction | Feedback Type | Timing |
|-------------|---------------|--------|
| Hover | Background change | Immediate |
| Press | Scale down | 100ms |
| Click | Action + ripple | Immediate |
| Long press | Context menu | 500ms delay |
| Drag | Ghost element | Immediate |

---

## Mouse Interactions

### Click Actions

| Target | Single Click | Double Click | Right Click |
|--------|--------------|--------------|-------------|
| Space Icon | Select space | - | Space context menu |
| Space Card | Focus space | Open in full view | Space context menu |
| Tree Item (Link) | Open in browser | Rename mode | Item context menu |
| Tree Item (Folder) | Expand/collapse | Rename mode | Folder context menu |
| Folder Chevron | Expand/collapse | - | - |
| URL Bar | Focus + select all | - | Paste context |
| Nav Button | Switch mode | - | - |
| Nav Dot | - | - | - |

### Hover Effects

#### Immediate Feedback (0ms delay)

| Element | Hover State |
|---------|-------------|
| Tree Item | Background: white 5% |
| Space Icon | Background: opacity 20% → 30% |
| Nav Button | Background: `accentDark` |
| Nav Dot | Scale: 1.0 → 1.5, color change |
| Card | Shadow: subtle → elevated |

#### Delayed Reveal (hover for 150ms)

| Element | Revealed Content |
|---------|------------------|
| Folder Row | Action buttons (+link, +folder, ⋮) |
| Link Row | Visit count badge |
| Tab | Close button |

### Cursor Changes

| Context | Cursor |
|---------|--------|
| Default | Default arrow |
| Clickable | Pointer |
| Text input | Text cursor |
| Dragging | Grabbing hand |
| Resizing | Resize arrows |
| Loading | Wait/spinner |
| Not allowed | Forbidden |

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd/Ctrl + 1-9` | Switch to Space 1-9 | Anywhere |
| `Cmd/Ctrl + N` | Create new Space | Anywhere |
| `Cmd/Ctrl + K` | Quick search | Anywhere |
| `Cmd/Ctrl + ,` | Open settings | Anywhere |
| `Cmd/Ctrl + Q` | Quit app | macOS/Windows |

### Browser Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + L` | Focus URL bar |
| `Cmd/Ctrl + R` | Refresh page |
| `Cmd/Ctrl + [` | Go back |
| `Cmd/Ctrl + ]` | Go forward |
| `Cmd/Ctrl + D` | Add to Space |
| `Escape` | Stop loading / blur URL bar |
| `Enter` (in URL bar) | Navigate |
| `Cmd/Ctrl + Shift + N` | New incognito (planned) |

### Spaces Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + N` | Create new Space |
| `Arrow Up/Down` | Navigate tree items |
| `Arrow Left` | Collapse folder / go to parent |
| `Arrow Right` | Expand folder / go to child |
| `Enter` | Open selected item |
| `Delete/Backspace` | Delete selected item |
| `F2` or `Enter` on selected | Rename mode |
| `Escape` | Deselect / exit rename |

### Text Editing

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + A` | Select all |
| `Cmd/Ctrl + C` | Copy |
| `Cmd/Ctrl + V` | Paste |
| `Cmd/Ctrl + X` | Cut |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |

---

## Touch Gestures

### Tap Gestures

| Gesture | Target | Action |
|---------|--------|--------|
| Single tap | Link item | Open in browser |
| Single tap | Folder item | Expand/collapse |
| Single tap | Space card | Select space |
| Double tap | Item name | Enter rename mode |

### Long Press

| Duration | Target | Action |
|----------|--------|--------|
| 500ms | Any item | Show context menu |
| 500ms | Space card | Show space context menu |
| 500ms | URL bar | Show paste options |

### Swipe Gestures

| Gesture | Context | Action |
|---------|---------|--------|
| Swipe right | Item row | Reveal delete button |
| Swipe left | Browser | Go back (iOS) |
| Swipe right | Browser | Go forward (iOS) |
| Swipe from left edge | Sidebar hidden | Reveal sidebar |

### Pinch Gestures

| Gesture | Context | Action |
|---------|---------|--------|
| Pinch to zoom | Browser | Zoom in/out |
| Double-tap zoom | Browser | Toggle zoom |

---

## Drag & Drop

### Enabled Drag Sources

| Element | Drag Data |
|---------|-----------|
| Space Item (Link) | URL, item ID |
| Space Item (Folder) | Folder ID, children |
| Space Icon | Space ID |
| Tab | Tab ID, URL |

### Drop Targets

| Target | Accepts | Action |
|--------|---------|--------|
| Folder | Items | Move item to folder |
| Space | Items | Move item to Space root |
| Space Icon | Items | Move item to different Space |
| URL Bar | URLs | Navigate to URL |
| Add Item Area | URLs | Create new link |

### Drag Visual Feedback

```
┌─────────────────────────────────────────────┐
│ Drag Preview                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 🔗 Flutter Documentation                │ │  ← Semi-transparent
│ │    (Dragging...)                        │ │    follows cursor
│ └─────────────────────────────────────────┘ │
│                                             │
│ Drop Target Highlight                       │
│ ┌─────────────────────────────────────────┐ │
│ │ 📁 Research                        [+] │ │  ← Blue border
│ └─────────────────────────────────────────┘ │    appears on valid
│                                             │    drop target
└─────────────────────────────────────────────┘
```

### Drag States

| State | Visual |
|-------|--------|
| Idle | Normal appearance |
| Dragging | Source opacity 50%, preview follows cursor |
| Over valid target | Target has primary border, subtle scale |
| Over invalid target | Forbidden cursor |
| Drop complete | Animation to new position |

### Reorder Behavior

For reordering Spaces in bottom bar:

1. Long press or click+drag on Space icon
2. Ghost appears, original dims
3. Drag left/right
4. Insertion indicator shows between icons
5. Release to drop
6. Smooth animation to new position

---

## Form Interactions

### Text Input Fields

#### Focus Behavior

| Trigger | Action |
|---------|--------|
| Click | Focus + select all (URL bar) |
| Tab | Focus next field |
| Shift+Tab | Focus previous field |
| Escape | Blur / restore original value |

#### Validation

| Event | Behavior |
|-------|----------|
| On change | Real-time validation (debounced 300ms) |
| On blur | Show error if invalid |
| On submit | Validate + show errors |

### Inline Editing

Double-click to edit triggers inline editing mode:

```
Before:
│ 🔗 Flutter Documentation                    │

After double-click:
│ 🔗 ┌────────────────────────────────────┐   │
│    │ Flutter Documentation          ✓ ✕ │   │
│    └────────────────────────────────────┘   │
```

#### Inline Edit States

| Action | Result |
|--------|--------|
| Enter | Save changes, exit edit mode |
| Escape | Discard changes, exit edit mode |
| Click outside | Save changes, exit edit mode |
| Click ✓ | Save changes, exit edit mode |
| Click ✕ | Discard changes, exit edit mode |
| Empty submit | Restore previous value |

### Add Item Input

When double-clicking empty area or clicking "+" button:

```
┌─────────────────────────────────────────────────────────────────────┐
│  │ Paste or type URL, or enter folder name...                      │
│  └──────────────────────────────────────────────────────────────────│
│            ↑                                                        │
│  [Auto-focus, cursor blinking, placeholder visible]                 │
└─────────────────────────────────────────────────────────────────────┘
```

#### Smart Input Detection

| Input | Detection | Action |
|-------|-----------|--------|
| `https://...` | URL pattern | Create link, fetch metadata |
| `http://...` | URL pattern | Create link, fetch metadata |
| `www.example.com` | Domain pattern | Normalize to https://, create link |
| Plain text | Not a URL | Create folder with that name |

#### Clipboard Integration

On focus, if clipboard contains URL:
1. Auto-detect URL in clipboard
2. Show "Paste from clipboard" suggestion
3. If user starts typing, dismiss suggestion

---

## Navigation Patterns

### Mode Switching

| From | To | Trigger | Animation |
|------|----|---------| ----------|
| Browser | Spaces | Click "Spaces" button | Fade transition |
| Spaces | Browser | Click "Browser" button | Fade transition |
| Any | Settings | Click settings icon | Slide from right |

### Space Selection

| Trigger | Action |
|---------|--------|
| Click Space icon | Switch active space, load tree |
| Click Space card | Switch active space, expand in sidebar |
| Keyboard 1-9 | Switch to Space 1-9 |

### Deep Navigation

In Spaces screen:

1. Click Space card → Space selected, tree shows in sidebar
2. Click folder → Folder expands, children visible
3. Click link → Opens in browser, sidebar switches view

### Back Navigation

| Context | Action |
|---------|--------|
| Browser | Navigate back in web history |
| Settings | Return to previous screen |
| Dialog open | Close dialog |
| Context menu | Close menu |

---

## Error States

### Input Validation Errors

```
┌─────────────────────────────────────────────────────────────────────┐
│  Space Name                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ⚠️ Space name is required                                         │
│     ↑ Error message in error color                                 │
└─────────────────────────────────────────────────────────────────────┘
```

| State | Border | Message |
|-------|--------|---------|
| Default | `borderDark` | None |
| Focus | `primary` | None |
| Error | `error` | Error message below |
| Error + Focus | `error` | Error message stays |

### Network Error States

#### Banner (Recoverable)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚠️  No internet connection. Check your network settings.   [Retry] │
└─────────────────────────────────────────────────────────────────────┘
```

#### Full Page (Critical)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                          [🚫 Error Icon]                            │
│                                                                     │
│                     Something went wrong                            │
│                                                                     │
│           We couldn't load this page. Please try again.            │
│                                                                     │
│                     [← Go Back]  [🔄 Retry]                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Loading States

| Context | Indicator | Placement |
|---------|-----------|-----------|
| Page load | Progress bar | Below URL bar |
| Data fetch | Skeleton shimmer | In place of content |
| Button action | Spinner replacing label | Button center |
| Async save | Toast notification | Bottom right |

---

## Accessibility

### Focus Management

| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous element |
| Enter/Space | Activate focused element |
| Arrow keys | Navigate within components |

### Screen Reader Support

| Element | Announcement |
|---------|--------------|
| Space Icon | "Space: [name], [number] of [total]" |
| Tree Item | "[type]: [name], level [depth]" |
| Folder | "Folder: [name], [count] items, [expanded/collapsed]" |
| Button | "[label] button" |

### Color Contrast

All text meets WCAG 2.1 AA requirements:

| Combination | Ratio |
|-------------|-------|
| textPrimary on backgroundDark | 12.7:1 |
| textSecondary on backgroundDark | 6.5:1 |
| textMuted on backgroundDark | 4.5:1 |
| primary on backgroundDark | 5.2:1 |

---

## Interaction Timing Summary

| Interaction | Delay/Duration |
|-------------|----------------|
| Hover feedback | 0ms (immediate) |
| Hover toolbar reveal | 150ms delay |
| Press → action | Immediate |
| Press scale animation | 100ms |
| Long press threshold | 500ms |
| Double-click threshold | 300ms |
| Drag start threshold | 100ms or 10px movement |
| Animation duration | 100-300ms (see Animations doc) |
| Debounce (search) | 300ms |
| Toast auto-dismiss | 3000ms |

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
