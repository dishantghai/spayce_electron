# Spayce Electron - Implementation Plan Overview

> **Document Version:** 2.0  
> **Created:** January 24, 2026  
> **Purpose:** Comprehensive feature implementation plan for Flutter → Electron migration  
> **Scope:** All Spaces-related features (excluding Browser and Workspace)

---

## Document Structure

This implementation plan is organized into multiple files for manageability:

| File | Contents |
|------|----------|
| `00-OVERVIEW.md` | This file - overview and navigation |
| `01-CURRENT-STATE.md` | Current state analysis, completed specs, gap analysis |
| `02-FOUNDATIONAL-SPECS.md` | Required foundational specs (SPEC-012 to SPEC-016) |
| `03-PHASE1-CORE-ITEM-MANAGEMENT.md` | US-001 to US-004: Inline creation, rename, hover actions |
| `04-PHASE2-CONTEXT-MENUS.md` | US-005 to US-006: Enhanced context menus |
| `05-PHASE3-COPY-PASTE.md` | US-007 to US-010: Copy/paste operations |
| `06-PHASE4-DRAG-DROP.md` | US-011 to US-016: Drag and drop within space |
| `07-PHASE5-MULTISELECT.md` | US-017 to US-020: Multi-selection |
| `08-PHASE6-ADVANCED-DRAG.md` | US-021 to US-025: Cross-space drag, pins grid |
| `09-PHASE7-SPACE-CARDS.md` | US-026 to US-030: Space cards features |
| `10-FLUTTER-FILE-MAP.md` | Complete Flutter source file reference |
| `11-TESTING-CHECKLIST.md` | Manual testing checklist per feature |

---

## Executive Summary

This plan provides a complete, story-by-story implementation guide to achieve full feature parity between the Flutter Spayce app and the new Electron app. 

### Key Principles

1. **Incremental Delivery**: Each story delivers a testable feature
2. **User-Centric**: Stories organized from user perspective (most essential → least essential)
3. **Manual Testing**: Each feature can be tested by user before moving to next
4. **Code Reference Preservation**: Every story includes Flutter file mappings

### Implementation Order

```
PHASE 1: Core Item Management (Essential)
├── US-001: Create Folder via Inline Input
├── US-002: Create Link via Inline Input
├── US-003: Inline Rename Items
└── US-004: Folder Hover Actions

PHASE 2: Context Menu Enhancement
├── US-005: Enhanced Folder Context Menu
└── US-006: Enhanced Link Context Menu

PHASE 3: Copy/Paste Operations
├── US-007: Copy Single Item
├── US-008: Paste Items
├── US-009: Paste from System Clipboard
└── US-010: Keyboard Shortcuts (Copy/Paste)

PHASE 4: Drag and Drop (Within Space)
├── US-011: Drag Tree Items
├── US-012: Drop Indicators
├── US-013: Drop Target Hit Zones
├── US-014: Drop Validation
├── US-015: Auto-Expand Folders on Drag Hover
└── US-016: Flash Animation on Drop

PHASE 5: Multi-Selection
├── US-017: Ctrl+Click Toggle Selection
├── US-018: Shift+Click Range Selection
├── US-019: Multi-Selection Visual Feedback
└── US-020: Multi-Select Drag

PHASE 6: Advanced Drag Operations
├── US-021: Cross-Space Drag via Bottom Bar
├── US-022: Drag to Pins Grid
├── US-023: Reorder Pins in Grid
├── US-024: Pinned Link Context Menu
└── US-025: Smart Drag Preview (Square for Pins)

PHASE 7: Space Cards Features
├── US-026: Inline Creation in Space Cards
├── US-027: Inline Rename in Space Cards
├── US-028: Context Menus in Space Cards
├── US-029: Drag Within Space Card
└── US-030: Drag Across Space Cards
```

### Priority Legend

| Priority | Meaning |
|----------|---------|
| P0 | Critical - Must have for basic functionality |
| P1 | High - Important for good UX |
| P2 | Medium - Nice to have |

---

## Foundational Specs Required

Before feature stories can proceed, these specs must be implemented:

> **Implementation Order**: Specs are ordered for incremental development. Implement in sequence (012 → 016).

| Spec ID | Name | Priority | Est. Hours | Dependencies |
|---------|------|----------|------------|--------------|
| SPEC-012 | Inline Input State Management | P0 | 2 | SPEC-010 (Foundation) |
| SPEC-013 | Multi-Selection State Management | P1 | 3 | SPEC-010 |
| SPEC-014 | Enhanced Drag-Drop State Management | P0 | 4 | SPEC-010, SPEC-007 |
| SPEC-015 | Inline Rename State Management | P0 | 1 | SPEC-012 |
| SPEC-016 | Clipboard State Management | P0 | 4 | SPEC-007, SPEC-010, SPEC-012, SPEC-013, SPEC-014 |

---

## Total Estimated Effort

| Phase | Stories | Est. Hours |
|-------|---------|------------|
| Foundational Specs | 5 specs | 14 |
| Phase 1 | 4 stories | 17 |
| Phase 2 | 2 stories | 6 |
| Phase 3 | 4 stories | 12 |
| Phase 4 | 6 stories | 27 |
| Phase 5 | 4 stories | 13 |
| Phase 6 | 5 stories | 20 |
| Phase 7 | 5 stories | 15 |
| **Total** | **35 stories** | **~124 hours** |

---

## Flutter Source Projects

All code references point to:
- **Flutter Source**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/`
- **Electron Target**: `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/packages/`

---

## How to Use This Plan

1. **Start with Foundational Specs** (02-FOUNDATIONAL-SPECS.md)
2. **Implement Phase by Phase** - each phase builds on previous
3. **Test after each story** - use the testing checklist
4. **Reference Flutter code** - use file mappings in each story
5. **Fix bugs before moving on** - ensure stability at each step

---

## Quick Links to Key Flutter Files

| Feature Area | Flutter File |
|--------------|--------------|
| Main Sidebar | `lib/features/navigation/presentation/main_layout_final.dart` |
| Space Models | `lib/features/spaces/models/space_models.dart` |
| Drag-Drop Provider | `lib/features/spaces/providers/drag_drop_provider.dart` |
| Spaces Provider | `lib/features/spaces/providers/spaces_provider.dart` |
| Draggable Tree Item | `lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart` |
| Drag Preview | `lib/features/spaces/presentation/widgets/drag_drop/drag_preview_widget.dart` |
| Pinned Links Grid | `lib/features/spaces/presentation/widgets/pinned_links_grid.dart` |
| Space Card | `lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart` |
| Context Menu | `lib/features/spaces/presentation/widgets/space_context_menu.dart` |
