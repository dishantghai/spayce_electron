# Spayce Migration - Session Context

> **Purpose**: Load this file at the start of any migration session to get full context.

## Project Overview

**Migration**: Flutter → Electron/React  
**Goal**: 100% UI/UX/Animation fidelity  

| Project | Path |
|---------|------|
| Source (Flutter) | `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend` |
| Target (Electron) | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron` |
| Hi-Fi Screenshots | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS` |
| Migration Artifacts | `/Users/Shared/ALL WORKSPACE/projects/AASEF/project_ops/spayce_migration/` |

---

## Batch 1 Components (Ready for Implementation)

| ID | Component | Spec Path | Status |
|----|-----------|-----------|--------|
| F001 | Sidebar Navigation Tree | `component-specs/F001-sidebar-nav-tree.md` | Ready |
| F002 | Sidebar Bottom Bar | `component-specs/F002-sidebar-bottom-bar.md` | Ready |
| F003 | Create New Space Flow | `component-specs/F003-create-space-flow.md` | Ready |
| F004 | Spaces Screen Layout | `component-specs/F004-spaces-screen-layout.md` | Ready |
| F005 | Space Card | `component-specs/F005-space-card.md` | Ready |
| F006 | Context Menu | `component-specs/F006-context-menu.md` | Ready |
| F007 | Spaces Screen Bottom Bar | `component-specs/F007-spaces-bottom-bar.md` | Ready |
| F008 | Folder Tree Structure | `component-specs/F008-folder-tree-structure.md` | Ready |

**Recommended order**: F008 → F006 → F001 → F002 → F004 → F005 → F007 → F003

---

## Key Resources (Absolute Paths)

### Design Tokens
```
/Users/Shared/ALL WORKSPACE/projects/AASEF/project_ops/spayce_migration/design-tokens/
├── colors.json        # All color values + CSS variables
├── spacing.json       # Spacing scale + layout constants
├── animations.json    # Durations, curves, Flutter-to-CSS mappings
├── radius.json        # Border radius values
├── shadows.json       # Box shadows
├── typography.json    # Font styles + CSS classes
└── icons.json         # Icon sizes (use lucide-react)
```

### Documentation
```
/Users/Shared/ALL WORKSPACE/projects/AASEF/project_ops/spayce_migration/docs/
├── DESIGN_SYSTEM_REFERENCE.md   # Human-readable design system
├── MIGRATION_PROGRESS.md        # Progress tracker
└── COMPONENT_MIGRATION_GUIDE.md # Flutter→React patterns
```

### Flutter Theme Files
```
/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/core/theme/
├── spayce_colors.dart
├── spayce_spacing.dart
├── spayce_animations.dart
├── spayce_radius.dart
├── spayce_shadows.dart
├── spayce_typography.dart
└── spayce_icons.dart
```

---

## Implementation Session Prompt

Copy this to start an implementation session:

```
I'm implementing the Spayce Flutter → Electron migration.

**Project**: /Users/Shared/ALL WORKSPACE/projects/spayce_electron
**Component**: F00X (e.g., F008)

Please:
1. Read: /Users/Shared/ALL WORKSPACE/projects/AASEF/project_ops/spayce_migration/component-specs/F00X-*.md
2. View the screenshot referenced in the spec
3. Load design tokens from design-tokens/*.json
4. Implement in React with CSS modules
5. Match visual appearance and animations exactly
```

---

## Future Batches (Not Yet Specced)

| Batch | Module | Components to Spec |
|-------|--------|-------------------|
| 2 | Browser | Tab bar, WebView, Navigation bar, Address bar |
| 3 | Workspace | File viewer, Editor panel, Split panes |
| 4 | Settings | Settings screen, Theme picker, Profile management |

---

## Tech Stack (Target)

- **Framework**: Electron + React + TypeScript
- **Styling**: CSS Modules with CSS variables
- **State**: Zustand
- **Icons**: lucide-react
- **Database**: SQLite (better-sqlite3)
