# Spayce Electron

Personal Learning Management System with integrated browser.

## Tech Stack

- **Desktop**: Electron 30+ (WebContentsView for Arc-style tabs)
- **UI**: React Native Web
- **Build**: Vite
- **Database**: SurrealDB (embedded)
- **State**: Zustand + TanStack Query
- **Auth**: Firebase Auth

## Project Structure

```
spayce_electron/
├── packages/
│   ├── shared/           # React Native Web shared code
│   │   └── src/
│   │       ├── theme/    # Design system tokens
│   │       └── types/    # TypeScript interfaces
│   │
│   └── desktop/          # Electron app
│       └── src/
│           ├── main/     # Electron main process
│           ├── renderer/ # React UI
│           └── preload/  # Preload scripts
│
├── .aasef/               # AASEF specs and context
└── project_ops/          # Reference materials
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test
```

## AASEF Specs

| Spec | Name | Status | Priority |
|------|------|--------|----------|
| 001 | Project Foundation | In Progress | Critical |
| 002 | Navigation Shell | Pending | Critical |
| 003 | Spaces Feature | Pending | High |
| 004 | Browser Feature | Pending | High |
| 005 | Workspace Feature | Pending | Medium |
| 006 | Authentication | Pending | Medium |

## Design System

Design tokens are defined in `packages/shared/src/theme/`:

- **Colors**: SpayceColors, SpaceThemes (24 accent colors)
- **Spacing**: SpayceSpacing (layout constants)
- **Radius**: SpayceRadius (border radius values)
- **Animations**: SpayceAnimations (durations & curves)
- **Shadows**: SpayceShadows (box shadows)
- **Typography**: SpayceTypography (fonts & sizes)

## Reference

- Old Flutter codebase: `/Users/Shared/ALL WORKSPACE/projects/spayce`
- Implementation plan: See `.aasef/` directory
