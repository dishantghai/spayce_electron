# Tech Decisions - AUTHORITATIVE

> **CRITICAL**: All implementations MUST use ONLY the packages and technologies listed here.
> Do NOT suggest alternatives to decided technologies.

## Core Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Desktop Framework** | Electron | 30+ (for WebContentsView) |
| **UI Layer** | React Native Web | Latest |
| **Build Tool** | Vite | Latest |
| **Language** | TypeScript | 5.x |
| **Package Manager** | pnpm | 8+ |
| **Monorepo** | pnpm workspaces | - |

## Database

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Edge Database** | SurrealDB (embedded) | Multi-model, graph relations, real-time |
| **Connection** | surrealkv:// | File-based embedded mode |

## State Management

| Component | Technology |
|-----------|------------|
| **Global State** | Zustand |
| **Server State** | TanStack Query (React Query) |
| **Form State** | React Hook Form |

## Authentication

| Component | Technology |
|-----------|------------|
| **Auth Provider** | Firebase Auth |
| **OAuth** | Google OAuth 2.0 |
| **Project** | spayce-app (existing) |

## UI Components

| Component | Technology |
|-----------|------------|
| **Icons** | Lucide React |
| **Styling** | Tailwind CSS + StyleSheet (RN Web) |
| **Animations** | Reanimated / CSS transitions |

## Browser Integration

| Component | Technology |
|-----------|------------|
| **Tab Views** | WebContentsView (Electron 30+) |
| **Ad Blocking** | @cliqz/adblocker-electron |

## Testing

| Component | Technology |
|-----------|------------|
| **Unit Tests** | Vitest |
| **Component Tests** | React Testing Library |
| **E2E Tests** | Playwright |

## Project Structure

```
spayce_electron/
├── packages/
│   ├── shared/           # React Native Web shared code
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   ├── theme/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   └── desktop/          # Electron app
│       ├── src/
│       │   ├── main/     # Electron main process
│       │   ├── renderer/ # React Native Web UI
│       │   └── preload/  # Preload scripts
│       └── package.json
│
├── package.json          # Root monorepo config
└── pnpm-workspace.yaml
```
