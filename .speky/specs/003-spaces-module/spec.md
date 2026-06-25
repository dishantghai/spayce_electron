# Spec 003: Spaces Module

## Overview
Implement the Spaces screen showing all spaces in a horizontal scroll layout with space cards, pinned links, and item trees.

## Requirements

### R1: SpacesScreen Layout
- Full-screen container with horizontal scrolling
- Multiple space cards side by side
- Active space card highlighting
- Independent keyboard navigation from sidebar
- Bottom bar with Add Space button

### R2: SpaceCard Component
- Card showing space header with icon and accent color
- Pinned links grid (5 columns)
- TreeView of space items
- Context menu integration on items
- Hover states and visual feedback

### R3: SpacesBottomBar
- Add Space button with icon
- Space pill indicators (optional)
- Consistent styling with sidebar bottom bar

### R4: Space Data Model
- Space interface with id, name, iconName, accentColor, rootItems
- SpaceItem interface with hierarchical children
- SpaceItemType enum (folder, link, file, localFolder, localFile)

## Implemented Components

| Component | File | Status |
|-----------|------|--------|
| SpacesScreen | `components/spaces/SpacesScreen.tsx` | ✅ Complete |
| SpacesScreen.module.css | `components/spaces/SpacesScreen.module.css` | ✅ Complete |
| SpaceCard | `components/spaces/SpaceCard.tsx` | ✅ Complete |
| SpaceCard.module.css | `components/spaces/SpaceCard.module.css` | ✅ Complete |
| SpacesBottomBar | `components/spaces/SpacesBottomBar.tsx` | ✅ Complete |
| Space types | `types/index.ts` | ✅ Complete |
| spaces store | `stores/spaces.ts` | ✅ Complete |

## Acceptance Criteria
- [x] SpacesScreen displays multiple space cards horizontally
- [x] Each SpaceCard shows header, pinned links, and tree
- [x] Cards have accent color theming
- [x] Items support context menu (right-click)
- [x] Active space is visually highlighted
- [x] Independent focus context from sidebar

## Dependencies
- 001-project-foundation
- 002-sidebar-navigation

## Reference Files
- `project_ops/spayce_migration/component-specs/F004-spaces-screen-layout.md`
- `project_ops/spayce_migration/component-specs/F005-space-card.md`
- `project_ops/spayce_migration/component-specs/F007-spaces-bottom-bar.md`
