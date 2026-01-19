# F004: Spaces Screen Layout

## Migration Context

| Property | Value |
|----------|-------|
| **Source Files** | `spaces_screen_hifi_v2.dart` (1108 lines) |
| **Target File** | `packages/shared/src/components/spaces/SpacesScreen.tsx` |
| **CSS Module** | `packages/shared/src/components/spaces/SpacesScreen.module.css` |
| **Screenshot Reference** | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/Spaces Screen from Spaces Tab.png` |
| **Complexity** | Medium (layout, horizontal scroll, keyboard navigation) |
| **Status** | ✅ IMPLEMENTED |

---

## Component Description

Main content area showing all spaces as horizontally scrolling cards. Displays when "Spaces" tab is active in sidebar (or from sidebar vertical tabs in fixed mode).

### Layout Structure:
1. **Cards Container**: Horizontally scrolling row of SpaceCard components
2. **Bottom Navigation Bar**: Space tabs with icons + names, drag-to-reorder, add button

### Key Flutter Implementation Details (from spaces_screen_hifi_v2.dart)

1. **Independent Focus Context**:
   - `spacesScreenActiveSpaceIndexProvider` - Separate from sidebar's `activeSpaceIndexProvider`
   - `keyboardFocusContextProvider` - Can be `sidebar` or `spacesScreen`
   - `spacesScreenFocusNodeProvider` - Focus node for keyboard events

2. **Keyboard Navigation**:
   - `[` / `]` - Previous/Next space card
   - `Tab` / `Shift+Tab` - Cycle through space cards  
   - `Arrow Up/Down` - Navigate items within active card
   - `Arrow Left/Right` - Collapse/Expand folders or navigate to parent/child
   - `Enter` - Open link or toggle folder
   - `Escape` - Clear selection
   - `Ctrl+C` / `Ctrl+V` - Copy/Paste items

3. **Auto-scroll Behavior**:
   - Cards scroll to center when selected via keyboard
   - Auto-scroll when dragging items near edges (60px edge zone)

---

## Design Tokens

```json
{
  "layout": {
    "padding": 24,
    "cardMinWidth": 288,
    "cardMaxWidth": 400,
    "cardGap": 20,
    "cardsToFit": 3
  },
  "colors": {
    "background": "#0F0B1A"
  },
  "bottomNav": {
    "padding": "12px 16px",
    "margin": 24,
    "background": "#131020",
    "borderRadius": 12,
    "border": "1px solid #1F2937"
  },
  "spaceTab": {
    "padding": "8px 16px",
    "borderRadius": 8,
    "gap": 8,
    "iconSize": 16,
    "fontSize": 13,
    "fontWeight": 500,
    "activeBackground": "{accentColor}20",
    "activeBorder": "1.5px solid {accentColor}"
  },
  "addButton": {
    "size": 32,
    "borderRadius": 8,
    "border": "1px solid #374151",
    "iconSize": 16
  },
  "scrollbar": {
    "height": 8,
    "thumbColor": "#374151",
    "thumbHoverColor": "#4B5563"
  }
}
```

---

## Flutter Source Reference

```dart
// From: spaces_screen_hifi_v2.dart (key sections)

// Screen container
Container(
  color: SpayceColors.backgroundDark,  // #0F0B1A
  padding: EdgeInsets.all(SpayceSpacing.p6),  // 24px
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      // Header
      Text('Spaces', style: SpayceTypography.headingLarge),
      SizedBox(height: 24),
      // Card grid
      Expanded(
        child: GridView.builder(
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: _calculateColumns(width),
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 288 / 400,  // card width / estimated height
          ),
          itemBuilder: (context, index) => SpaceCardHiFiV2(space: spaces[index]),
        ),
      ),
    ],
  ),
)
```

---

## Visual Requirements

- [ ] Background `#0F0B1A`
- [ ] Padding 24px on all sides
- [ ] Header: "Spaces" in headingLarge style (24px bold)
- [ ] Cards: 288px width, responsive columns
- [ ] Card gap: 16px horizontal and vertical
- [ ] Cards arranged in grid, wrap to next row

---

## Responsive Behavior

| Screen Width | Columns |
|--------------|---------|
| < 640px | 1 |
| 640-960px | 2 |
| 960-1280px | 3 |
| > 1280px | 4 |

---

## Animation Requirements

| Animation | Duration | Curve | Property |
|-----------|----------|-------|----------|
| Screen transition | 300ms | ease-in-out | opacity |
| Card appear (stagger) | 200ms | ease-out | opacity, transform: translateY |

---

## State Management

```typescript
// This screen reads from spaces store
interface SpacesScreenState {
  spaces: Space[];
  isLoading: boolean;
  error: Error | null;
}
```

---

## Acceptance Criteria

- [x] Background color #0F0B1A
- [x] Cards container with horizontal scroll and 24px padding
- [x] Cards dynamically sized to fit ~3 per screen (min 288px, max 400px)
- [x] 20px gap between cards
- [x] Bottom navigation bar with space tabs
- [x] Active tab shows accent color background and border
- [x] Add space button (+) at end of tabs
- [x] Loading state with spinner
- [x] Error state with message
- [x] Empty state with "Create your first space" button
- [x] Keyboard navigation between cards ([ ] Tab)
- [x] Keyboard navigation within cards (arrows, Enter)
- [x] Auto-scroll to center active card
- [ ] Drag-to-reorder spaces in bottom bar (partial - HTML5 drag)
