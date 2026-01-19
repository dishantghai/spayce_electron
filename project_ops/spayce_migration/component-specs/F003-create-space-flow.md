# F003: Create New Space Flow

## Migration Context

| Property | Value |
|----------|-------|
| **Source Files** | `space_form_view.dart`, `theme_picker_dialog.dart` |
| **Target File** | `src/renderer/components/spaces/CreateSpaceDialog.tsx` |
| **Screenshot Reference** | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/Create New Space Choose Space Icon.png` |
| **Complexity** | Medium (form, icon picker, color picker) |

---

## Component Description

Modal dialog for creating a new space with:
- Space name input
- Icon picker grid (emoji or icon selection)
- Color/theme picker for accent color
- Create/Cancel buttons

---

## Design Tokens

```json
{
  "modal": {
    "width": 400,
    "padding": 24,
    "borderRadius": 16,
    "background": "#1A1628",
    "backdropColor": "rgba(0, 0, 0, 0.5)"
  },
  "input": {
    "height": 48,
    "borderRadius": 8,
    "background": "#0F0B1A",
    "border": "#374151",
    "focusBorder": "#6D5AE6"
  },
  "iconPicker": {
    "gridColumns": 6,
    "iconSize": 32,
    "iconGap": 8,
    "selectedBorder": "#6D5AE6"
  },
  "colorPicker": {
    "swatchSize": 28,
    "swatchGap": 8
  }
}
```

---

## Flutter Source Reference

```dart
// From: space_form_view.dart (key sections)

// Modal container
Container(
  width: 400,
  padding: EdgeInsets.all(SpayceSpacing.p6),  // 24px
  decoration: BoxDecoration(
    color: SpayceColors.surfaceDark,
    borderRadius: BorderRadius.circular(SpayceRadius.xl),  // 16px
  ),
)

// Input field
TextField(
  decoration: InputDecoration(
    filled: true,
    fillColor: SpayceColors.backgroundDark,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(SpayceRadius.input),
      borderSide: BorderSide(color: SpayceColors.borderDark),
    ),
  ),
)

// Icon grid
GridView.builder(
  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 6,
    mainAxisSpacing: 8,
    crossAxisSpacing: 8,
  ),
)

// Color swatches (8 colors)
// Uses SpaceColors.extended palette
```

---

## Visual Requirements

- [ ] Modal width 400px, centered with backdrop
- [ ] Backdrop color: semi-transparent black
- [ ] Modal background `#1A1628` with 16px border radius
- [ ] Input: 48px height, `#0F0B1A` background
- [ ] Input focus: purple border `#6D5AE6`
- [ ] Icon grid: 6 columns, 32px icons
- [ ] Selected icon: purple border ring
- [ ] Color swatches: 8 colors from palette, 28px circles
- [ ] Selected color: checkmark overlay or ring

---

## Animation Requirements

| Animation | Duration | Curve | Property |
|-----------|----------|-------|----------|
| Modal appear | 200ms | ease-out | opacity, transform: scale |
| Modal dismiss | 150ms | ease-in | opacity, transform: scale |
| Icon hover | 100ms | ease | transform: scale(1.1) |
| Color select | 150ms | ease | border-width |

---

## Form State

```typescript
interface CreateSpaceForm {
  name: string;
  icon: string;  // emoji or icon name
  accentColor: string;  // hex color
}

// Validation
// - Name: required, 1-50 chars
// - Icon: required
// - Color: defaults to first in palette
```

---

## Acceptance Criteria

- [ ] Modal appears/dismisses with animation
- [ ] Form validates before submit
- [ ] Icon picker shows selection state
- [ ] Color picker shows all 8 palette colors
- [ ] Create button creates space and closes modal
- [ ] Cancel/backdrop click closes modal
- [ ] Keyboard: Escape closes, Enter submits (if valid)
