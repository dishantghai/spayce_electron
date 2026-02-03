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

### Prerequisites

**Important for Apple Silicon (M1/M2/M3) Macs:**

This project uses native Node.js modules (`better-sqlite3`) that must match your system architecture. You **must** use arm64 Node.js on Apple Silicon Macs.

**Verify your Node.js architecture:**
```bash
node -p "process.arch"  # Should output "arm64" on Apple Silicon
```

**If it shows "x64", fix it:**
```bash
# Uninstall the wrong version
nvm uninstall $(nvm current)

# Install arm64 version
arch -arm64 nvm install --lts

# Verify
node -p "process.arch"  # Should now show "arm64"
```

The project includes automatic architecture validation. If there's a mismatch, `pnpm install` will fail with helpful instructions.

### Installation

```bash
# Install dependencies (runs architecture check automatically)
pnpm install

# Start development (use the convenience script)
./scripts/dev.sh

# Or manually with correct Node.js version
source ~/.nvm/nvm.sh && nvm use v22.17.1 && pnpm run dev

# Run tests
pnpm test
```

### Native Module Rebuilds (better-sqlite3)

`better-sqlite3` is a native C++ addon that requires a different binary depending on the runtime:

| Runtime | ABI | Used by |
|---------|-----|---------|
| Electron 30 | NODE_MODULE_VERSION 123 | `pnpm dev` |
| Node.js 22 | NODE_MODULE_VERSION 127 | `pnpm test` |

**This is handled automatically.** Both `pnpm dev` and `pnpm test` have `predev`/`pretest` hooks that check if the binary matches and rebuild only when there's a mismatch. This works from both the project root and `packages/desktop/`.

- When the binary already matches, the check completes in ~40ms (no rebuild).
- When switching between dev and test, the rebuild happens automatically before the command runs.

**Manual rebuild** (rarely needed):
```bash
node scripts/ensure-native-modules.cjs electron   # rebuild for Electron (dev)
node scripts/ensure-native-modules.cjs node        # rebuild for Node.js (tests)
```

**If you see `ERR_DLOPEN_FAILED` or `NODE_MODULE_VERSION` mismatch errors**, just re-run `pnpm dev` or `pnpm test` — the hook will fix it automatically.

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

## Migration & Rollback

### Pre-Migration Backup
```bash
./scripts/backup-before-migration.sh
```
Creates a git backup branch and database backup before migration.

### Rollback Procedure
```bash
./scripts/rollback-migration.sh <timestamp>
```
Restores the system to a previous backup state. Recovery time: < 2 hours.

### Migration Scripts
- `scripts/migrate-db.ts` - Database schema migration
- `scripts/migrate-imports.sh` - Import path migration
- `scripts/copy-flutter-db.sh` - Copy Flutter database
- `scripts/verify-features.ts` - Verify feature parity
- `scripts/verify-e2e-integration.sh` - E2E verification

## Reference

- Old Flutter codebase: `/Users/Shared/ALL WORKSPACE/projects/spayce`
- Implementation plan: See `.aasef/` directory
