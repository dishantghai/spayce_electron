# Spec 003: Spaces Feature

## Overview
Implement Space and SpaceItem data models, pinned links grid, space creation form, tree view, and drag & drop system.

## Requirements

### R1: Data Models (SurrealDB)
- Space: id, name, profileId, userId, accentColor, iconName, order, isExpanded, createdAt
- SpaceItem: id, name, path, type (link|folder|localFolder|localFile), isExpanded, children, faviconUrl, visitCount, lastVisited, isPinned, pinPosition, localPath, securityBookmark
- Graph relations: `has_item` (space→item), `contains` (item→item)

### R2: Pinned Links Grid
- 5 columns × 3 rows = 15 max pins
- Card size: 48×48px with 8px spacing
- Drop indicator at preview position
- Context menu: Open, Copy Link, Unpin, Delete
- Support both internal reorder and external drops
- Empty state: "Drop links here to pin"
- Animation: 150ms transitions

### R3: Space Creation Form
- 24 predefined theme colors
- Icon suggestions based on keywords (work→briefcase, dev→code, etc.)
- Name validation (whitespace-only rejected)
- Random color selection avoiding recent colors
- Maximum 5 suggested icons

### R4: Tree View
- Indent: 16px per level
- Expand animation: 200ms eased (CurvedAnimation)
- Hover actions: Add Link, Add Folder, More (context menu)
- Selected state: Accent color background with border
- Visit count badge for frequently visited links

### R5: Drag & Drop System
- DragData: item, items[], spaceId, parentId, sourceIndex
- DragOperation: items, sourceSpaceId, sourceParentId, source (sidebar|spaceCard), startTime
- isMultiDrag when items.length > 1
- Auto-expand folder after 500ms hover
- Flash moved item for 700ms
- Haptic feedback on drag start/drop (desktop equivalent: visual feedback)

## Acceptance Criteria
- [ ] CRUD operations work for Spaces and SpaceItems
- [ ] Pinned grid shows 5×3 layout with drop preview
- [ ] Context menu works on pinned items
- [ ] Space creation form validates and suggests icons
- [ ] Tree view expands/collapses with animation
- [ ] Drag & drop works for reorder and cross-space moves
- [ ] Multi-select drag works

## Dependencies
- 001-project-foundation
- 002-navigation-shell

## Reference Files
- Old Models: `spayce/frontend/lib/features/spaces/models/space_models.dart`
- Old Providers: `spayce/frontend/lib/features/spaces/providers/`
- Old Tests: `spayce/frontend/test/unit/spaces/`, `spayce/frontend/test/widget/spaces/`
