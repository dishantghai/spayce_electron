# Spec 005: Create Space Flow

## Overview
Implement the Create Space flow with icon picker, color selector, and space naming form.

## Requirements

### R1: CreateSpaceView Component
- Full-height inline view within sidebar
- Header with back button and title
- Name input field with validation
- Icon picker grid (24 Lucide icons)
- Color picker grid (24 SpaceThemes colors)
- Create/Save button

### R2: Icon Picker
- Grid of 24 commonly used Lucide icons
- Selected icon highlighted with border
- Icons: rocket, code, book, briefcase, brain, coffee, etc.

### R3: Color Picker
- Grid of 24 SpaceThemes colors
- Selected color highlighted with check mark or border
- Applies as accent color for space

### R4: Form Validation
- Name required (non-empty)
- Default icon and color if none selected
- Smooth transitions between normal and create mode

### R5: Edit Mode
- Same view for editing existing space
- Pre-populate with current space values
- Update instead of create on save

## Implemented Components

| Component | File | Status |
|-----------|------|--------|
| CreateSpaceView | `components/CreateSpaceView.tsx` | ✅ Complete |
| CreateSpaceView.module.css | `components/CreateSpaceView.module.css` | ✅ Complete |
| getIconComponent | `components/CreateSpaceView.tsx` | ✅ Complete |
| CreateSpaceModal | `components/CreateSpaceModal.tsx` | ✅ Complete |

## Icon Set

```typescript
const SPACE_ICONS = [
  'rocket', 'code', 'book', 'briefcase', 'brain', 'coffee',
  'compass', 'cpu', 'database', 'flask', 'gamepad', 'globe',
  'guitar', 'hammer', 'heart', 'layers', 'lightbulb', 'music',
  'palette', 'plane', 'puzzle', 'star', 'target', 'zap',
];
```

## Acceptance Criteria
- [x] CreateSpaceView shows within sidebar
- [x] Name input accepts text with validation
- [x] Icon grid displays 24 icons
- [x] Color grid displays 24 accent colors
- [x] Selected icon and color are highlighted
- [x] Create button triggers onCreateSpace callback
- [x] Edit mode pre-populates existing values

## Dependencies
- 001-project-foundation
- 002-sidebar-navigation

## Reference Files
- `project_ops/spayce_migration/component-specs/F003-create-space-flow.md`
