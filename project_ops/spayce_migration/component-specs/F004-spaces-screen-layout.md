# F004: Spaces Screen Layout

## Migration Context

| Property | Value |
|----------|-------|
| **Source Files** | `spaces_screen_hifi_v2.dart` |
| **Target File** | `src/renderer/components/spaces/SpacesScreen.tsx` |
| **Screenshot Reference** | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/Spaces Screen from Spaces Tab.png` |
| **Complexity** | Medium (layout, grid, responsive) |

---

## Component Description

Main content area showing all spaces as a grid of cards. Displays when "Spaces" tab is active in sidebar.

Layout:
- Header with title "Spaces"
- Grid of SpaceCards (responsive columns)
- Bottom action bar (when items selected)

---

## Design Tokens

```json
{
  "layout": {
    "padding": 24,
    "headerHeight": 56,
    "cardWidth": 288,
    "cardGap": 16
  },
  "colors": {
    "background": "#0F0B1A",
    "headerText": "#E5E7EB"
  },
  "grid": {
    "minColumns": 1,
    "maxColumns": 4,
    "breakpoints": {
      "sm": 1,
      "md": 2,
      "lg": 3,
      "xl": 4
    }
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

- [ ] Background and padding match design
- [ ] Header text styled correctly
- [ ] Grid responsive to screen width
- [ ] Cards maintain 288px width at all breakpoints
- [ ] Smooth transition when navigating to screen
- [ ] Empty state displays when no spaces exist
