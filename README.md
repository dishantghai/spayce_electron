# Spayce

**Your space. Your context. Your AI.**

Spayce is a desktop AI OS — a single application where you browse the web, organize your knowledge, take notes, write code, record meetings, and work with an AI agent that knows everything you've saved. No more switching between 8 apps. No more AI that starts every conversation from zero.

> Everything you do in Spayce accumulates into a connected knowledge base. The AI agent queries that knowledge base. The more you use it, the more useful it gets.

---

## What Spayce Does

**Integrated Browser** — Browse the web inside the app using a full Chromium engine. Tabs persist across restarts. Pages you visit can be saved into your knowledge base with one click.

**Spaces (Knowledge Base)** — Organize everything into a hierarchical folder system. Create Spaces for projects, topics, or contexts. Add links, notes, files, and transcripts. Everything is connected, searchable, and accessible to the AI.

**Notes** — Write markdown notes that live inside your Spaces, linked to the web pages and files that informed them. No more notes floating disconnected from their sources.

**Local Workspace** — Browse and view your local files from within the app. Markdown files render with preview. Your local work becomes part of the same unified environment.

**AI Agent** _(coming)_ — An AI that can see everything in your knowledge base. Ask it questions, generate artifacts, send emails, create notes — all from natural language.

**Meeting Transcription** _(coming)_ — Record calls directly in the app. Transcripts are generated locally and saved into the relevant project Space.

**IDE + Terminal** _(coming)_ — Write and run code inside the same workspace where you're reading docs, taking notes, and talking to your AI.

---

## Why It Exists

Knowledge workers today run 8–12 apps simultaneously and pay a hidden tax in context reconstruction — re-explaining what they're working on, copy-pasting between tools, losing threads across browser tabs. AI tools are powerful but blind: they have no view of your actual work.

Spayce is the environment that changes this. Everything you do accumulates into a context layer that the AI agent can see and act on. The knowledge base compounds over time. Your AI gets smarter as your Spayce gets richer.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop runtime | Electron 30 |
| Browser engine | Chromium via WebContentsView |
| UI | React + TypeScript |
| Build | Vite + electron-vite |
| State | Zustand + TanStack Query |
| Database | SQLite via better-sqlite3 |
| Package manager | pnpm (workspaces) |
| Auth | Firebase Auth |

---

## Project Structure

```
spayce_electron/
├── packages/
│   ├── shared/           # Shared React Native Web code
│   │   └── src/
│   │       ├── theme/    # Design system tokens
│   │       └── types/    # TypeScript interfaces
│   │
│   └── desktop/          # Electron app
│       └── src/
│           ├── main/     # Electron main process
│           ├── renderer/ # React UI
│           └── preload/  # Preload scripts (context bridge)
│
├── scripts/              # Build, migration, and native module scripts
├── .aasef/               # Architectural specs and implementation stories
└── project_ops/          # Product documentation
```

---

## Getting Started

### Prerequisites

**Node.js on Apple Silicon (M1/M2/M3/M4) Macs:**

Spayce uses native Node.js modules (`better-sqlite3`) that must match your system architecture. You must use arm64 Node.js on Apple Silicon Macs.

```bash
# Verify your Node.js architecture
node -p "process.arch"   # Must output "arm64" on Apple Silicon
```

**If it shows "x64", fix it:**
```bash
# Remove the wrong version
nvm uninstall $(nvm current)

# Install the arm64 version
arch -arm64 nvm install --lts

# Verify
node -p "process.arch"   # Should now show "arm64"
```

**Required tools:**
- Node.js 22 LTS (arm64 on Apple Silicon)
- pnpm (`npm install -g pnpm`)
- nvm (recommended)

The project runs an automatic architecture check on `pnpm install`. If there's a mismatch, the install will fail with instructions on how to fix it.

---

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd spayce_electron

# Install dependencies (architecture check runs automatically)
pnpm install

# Start development
./scripts/dev.sh

# Or manually (use the exact Node version the project requires)
source ~/.nvm/nvm.sh && nvm use v22.17.1 && pnpm run dev
```

---

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:core       # Core domain layer tests
pnpm test:infra      # Infrastructure layer tests
pnpm test:desktop    # Desktop-specific tests

# Watch mode
pnpm test:watch
```

---

## Native Module Rebuilds (better-sqlite3)

`better-sqlite3` is a native C++ addon. It requires a different binary depending on whether it's running in Electron or Node.js:

| Runtime | ABI | Used by |
|---|---|---|
| Electron 30 | NODE_MODULE_VERSION 123 | `pnpm dev` |
| Node.js 22 | NODE_MODULE_VERSION 127 | `pnpm test` |

**This is handled automatically.** Both `pnpm dev` and `pnpm test` have pre-hooks that check the binary and rebuild only if there's a mismatch (~40ms if already correct).

**Manual rebuild** (rarely needed):
```bash
node scripts/ensure-native-modules.cjs electron   # for development
node scripts/ensure-native-modules.cjs node        # for tests
```

**If you see `ERR_DLOPEN_FAILED` or `NODE_MODULE_VERSION` mismatch errors:** just re-run `pnpm dev` or `pnpm test`. The hook will fix it.

---

## Troubleshooting

### App won't start

1. Check Node.js architecture: `node -p "process.arch"` (must be `arm64` on Apple Silicon)
2. Run `pnpm install` again — the architecture check may catch a mismatch
3. Try rebuilding native modules: `node scripts/ensure-native-modules.cjs electron`
4. Check `packages/desktop/` for any local build errors

### SQLite / database errors

```bash
# Rebuild the native module for your current environment
node scripts/ensure-native-modules.cjs electron
```

### Stale build artifacts

```bash
pnpm run build
pnpm dev
```

### Migration and rollback

```bash
# Create a backup before any migration
./scripts/backup-before-migration.sh

# Rollback to a previous backup
./scripts/rollback-migration.sh <timestamp>
```

### Health check

```bash
pnpm check-health
```

---

## Design System

Design tokens live in `packages/shared/src/theme/`:

| Token set | Contents |
|---|---|
| `SpayceColors` | Primary palette + 24 Space accent colors |
| `SpayceSpacing` | Layout constants |
| `SpayceRadius` | Border radius values |
| `SpayceAnimations` | Duration and easing curves |
| `SpayceShadows` | Box shadow definitions |
| `SpayceTypography` | Font families and size scale |

---

## Implementation Specs (AASEF)

The `.aasef/` directory contains architectural specification documents for each implemented feature:

| Spec | Feature | Status |
|---|---|---|
| 001 | Project Foundation | In Progress |
| 002 | Sidebar Navigation | Done |
| 003 | Spaces Module | Done |
| 004 | Context Menu | Done |
| 005 | Create Space Flow | Done |
| 006 | Keyboard Navigation | Done |
| 007–009 | Core Domain + Infrastructure + Application Layers | Done |
| 010 | React UI Integration | Done |
| 011 | Migration Feature Parity | Done |
| 012–016 | State Management (inline input, multi-select, drag-drop, rename, clipboard) | Done |
| 017–020 | Browser Foundation + Domain + MVP + Sidebar Overlay | In Progress |

---

## Current Status

The following modules are functional in the current build:

- **Browser** — Multi-tab browsing, navigation, tab persistence, origin tracking
- **Spaces** — Hierarchical knowledge base, link saving, tree + card views
- **Workspace** — Local file tree, file viewer, markdown preview
- **Core** — SQLite persistence, session restore, settings

In active development: context menus, drag-and-drop polish, global search.  
Coming next: Notes editor, AI agent, STT, cloud sync.

---

## License

MIT
