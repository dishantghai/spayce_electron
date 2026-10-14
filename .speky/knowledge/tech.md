# Tech

<!-- speky: always -->

- (2026-10-14) Full tech decisions (authoritative): .speky/context/tech_decisions.md
- (2026-10-14) Stack: desktop Electron 30+; ui React 18+; language TypeScript 5.x; build Vite 5+; state Zustand 4+; styling CSS Modules; database SQLite (better-sqlite3); icons Lucide React; testing Vitest + React Testing Library
- (2026-10-14) Decision: Use WebContentsView (not deprecated BrowserView) for tabs
- (2026-10-14) Decision: SQLite over SurrealDB for simpler embedded database
- (2026-10-14) Decision: CSS Modules over Tailwind for exact design control
- (2026-10-14) Decision: Focus management with independent sidebar/spacesScreen contexts
- (2026-10-14) Decision: Fixed and floating sidebar modes
- (2026-10-14) Decision: WebContentsView for Arc-style multi-tab browser
- (2026-10-14) Decision: pnpm workspaces monorepo structure
- (2026-10-14) Decision: Shared code in packages/shared, desktop app in packages/desktop
- (2026-10-14) Decision: CSS Modules for scoped component styling
- (2026-10-14) Decision: SQLite for reliable embedded persistence
