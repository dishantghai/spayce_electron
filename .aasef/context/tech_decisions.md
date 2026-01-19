# Tech Decisions - AUTHORITATIVE

> **CRITICAL**: All implementations MUST use ONLY the packages and technologies listed here.
> Do NOT suggest alternatives to decided technologies.

## Core Stack

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| **Desktop Framework** | Electron | 30+ | WebContentsView for multi-tab browser |
| **UI Framework** | React | 18+ | Mature ecosystem, AI-friendly |
| **Build Tool** | Vite | 5+ | Fast dev experience |
| **Language** | TypeScript | 5.x | Strict type safety |
| **Package Manager** | pnpm | 8+ | Efficient workspace management |
| **Monorepo** | pnpm workspaces | - | Native workspace support |

## Database

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Embedded Database** | SQLite | Reliable, proven, offline-first |
| **Node Driver** | better-sqlite3 | Synchronous API, fast |
| **Location** | `{userData}/spayce.db` | User data directory |

## State Management

| Component | Technology | Usage |
|-----------|------------|-------|
| **Global State** | Zustand | UI state, navigation, spaces |
| **Persistence** | zustand/persist | Local storage persistence |
| **Form State** | React useState | Simple component state |

## Styling

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **CSS Strategy** | CSS Modules | Scoped styles, design token integration |
| **Variables** | CSS Custom Properties | Theme tokens as CSS vars |
| **Animations** | CSS Transitions | Native, performant |

## UI Components

| Component | Technology |
|-----------|------------|
| **Icons** | Lucide React |
| **Fonts** | Inter (UI), JetBrains Mono (code) |

## Browser Integration

| Component | Technology |
|-----------|------------|
| **Tab Views** | WebContentsView (Electron 30+) |
| **Ad Blocking** | @cliqz/adblocker-electron (planned) |

## Testing

| Component | Technology |
|-----------|------------|
| **Unit Tests** | Vitest |
| **Component Tests** | React Testing Library |
| **E2E Tests** | Playwright (planned) |

## Project Structure

```
spayce_electron/
├── packages/
│   ├── shared/                 # Shared React components & utilities
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   │   ├── TreeView.tsx
│   │   │   │   ├── TreeItem.tsx
│   │   │   │   ├── TreeItemIcon.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── ContextMenu.tsx
│   │   │   │   ├── CreateSpaceView.tsx
│   │   │   │   ├── SpaceHeader.tsx
│   │   │   │   ├── BottomBar.tsx
│   │   │   │   ├── PinnedLinksGrid.tsx
│   │   │   │   ├── SidebarTabs.tsx
│   │   │   │   └── spaces/
│   │   │   │       ├── SpacesScreen.tsx
│   │   │   │       ├── SpaceCard.tsx
│   │   │   │       └── SpacesBottomBar.tsx
│   │   │   ├── stores/         # Zustand state stores
│   │   │   │   ├── navigation.ts
│   │   │   │   └── spaces.ts
│   │   │   ├── models/         # Data models
│   │   │   ├── theme/          # Design system tokens
│   │   │   │   ├── colors.ts
│   │   │   │   ├── spacing.ts
│   │   │   │   ├── radius.ts
│   │   │   │   ├── animations.ts
│   │   │   │   ├── shadows.ts
│   │   │   │   └── typography.ts
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   └── index.ts        # Barrel exports
│   │   ├── __tests__/          # Unit tests
│   │   └── package.json
│   │
│   └── desktop/                # Electron application
│       ├── src/
│       │   ├── main/           # Electron main process
│       │   │   ├── index.ts
│       │   │   └── services/
│       │   ├── renderer/       # React UI entry
│       │   │   ├── App.tsx
│       │   │   └── main.tsx
│       │   └── preload/        # Context bridge
│       └── package.json
│
├── project_ops/                # Project documentation
│   ├── spayce_migration/       # Migration specs
│   │   ├── component-specs/    # F001-F008 component specs
│   │   ├── design-tokens/      # JSON design tokens
│   │   └── docs/               # Reference docs
│   └── REBUILD_PLAN/           # Architecture docs
│
├── .aasef/                     # AASEF framework
│   ├── context/                # Project context files
│   └── specs/                  # Implementation specs
│
├── package.json                # Root monorepo config
├── pnpm-workspace.yaml
├── tsconfig.json
└── vitest.config.ts
```

## Architecture Decisions

### 1. Electron with WebContentsView
- Modern API for multi-tab browsing (not deprecated BrowserView)
- Full Chromium integration
- Native OS access for file system operations

### 2. SQLite over SurrealDB
- **Decision**: Use SQLite (better-sqlite3) instead of SurrealDB
- **Rationale**: More mature, simpler setup, proven reliability
- **Schema**: Standard relational tables for spaces, items, tabs

### 3. CSS Modules over Tailwind
- **Decision**: Use CSS Modules with CSS custom properties
- **Rationale**: Exact design token control, scoped styles, smaller bundle
- **Pattern**: `Component.module.css` alongside `Component.tsx`

### 4. Focus Context Management
- **Decision**: Independent focus contexts for sidebar and spaces screen
- **Implementation**: `KeyboardNavigationProvider` with context state
- **Rules**: Click on sidebar → sidebar focus; click on spaces → spaces focus

### 5. Sidebar Modes
- **Decision**: Support both fixed and floating sidebar modes
- **Fixed**: Sidebar always visible, takes layout space
- **Floating**: Sidebar overlays content, can be toggled
