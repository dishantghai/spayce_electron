# Spayce — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2026-05-03  
**Status:** Active Development — Phase 1 MVP  

---

## 1. Product Overview

### 1.1 Vision

Spayce is a desktop AI OS — a unified environment where a knowledge worker does all of their browsing, learning, creating, and building, such that every artifact accumulates into a living, connected knowledge base that powers a highly capable AI agent.

### 1.2 Mission

Eliminate the context fragmentation tax paid by every knowledge worker every day, and replace it with a single environment where AI can see everything and help with anything.

### 1.3 Core Hypothesis

> If everything a person does in their knowledge work — browsing, note-taking, coding, meetings, files — is captured and organized in one place, an AI agent given access to that corpus will be orders of magnitude more useful than any general-purpose AI assistant.

---

## 2. Users & Use Cases

### 2.1 Primary User Segments

| Segment | Description | Pain Point |
|---|---|---|
| Indie founder / solo builder | 1–2 person team, full-stack knowledge work | Tooling fragmentation, AI without context |
| Student / researcher | Heavy reading, note-taking, synthesis | Knowledge scattered across browsers and docs |
| Knowledge worker | Writing, research, client work | App-switching overhead, no unified search |
| Enterprise employee | Structured, auditable, policy-governed work | Uncontrolled AI usage, no visibility |

### 2.2 Primary Use Cases

1. **Organized Research** — Browse web sources, save them into project folders, query across all saved content with AI
2. **Meeting Intelligence** — Record a call, get auto-transcript, save to project, ask AI to extract action items
3. **Connected Note-Taking** — Write notes that link to saved web pages, local files, transcripts, and code
4. **AI-Augmented Coding** — Write code with an AI agent that understands the related docs, notes, and meeting context
5. **Delegated Work** — Instruct the AI agent in natural language to draft emails, create documents, or search the knowledge base

---

## 3. Product Architecture

### 3.1 Layers

| Layer | Description |
|---|---|
| **Knowledge Base** | The core — hierarchical folder system (Spaces) holding all artifacts: links, notes, files, transcripts, code |
| **Capture Layer** | Browser, STT, file import, AI artifact creation — all feed into the knowledge base |
| **AI Agent Layer** | Operates over the full knowledge base; executes actions in natural language |
| **Interface Layer** | Electron desktop shell — sidebar navigation, tab browser, panels for each module |
| **Sync Layer** (Premium/Enterprise) | Cloud backup and sync of the knowledge base |

### 3.2 Module Architecture

```
SPAYCE
├── Browser Module       — Integrated Chromium browser, tabs, sessions
├── Spaces Module        — Hierarchical knowledge base (folders, items, links)
├── Notes Module         — Rich markdown notes, linked to knowledge base items
├── Workspace Module     — Local file system browser and viewer
├── AI Agent Module      — Context-aware AI that operates across all modules
├── STT Module           — In-app call recording, transcription, auto-save
├── IDE Module           — Monaco editor + terminal (Phase 3)
└── Sync Module          — Cloud knowledge base sync (Premium/Enterprise)
```

---

## 4. Feature Requirements

### 4.1 Phase 1 — MVP (Months 1–3)

#### Browser Module
| Feature | Priority | Status |
|---|---|---|
| Multi-tab browsing (Chromium BrowserView/WebContentsView) | P0 | ✅ Done |
| Tab bar with create/close/switch | P0 | ✅ Done |
| Navigation (back/forward/refresh) | P0 | ✅ Done |
| URL bar with validation | P0 | ✅ Done |
| Tab persistence across restarts | P0 | ✅ Done |
| Origin tracking (which Space opened this tab) | P0 | ✅ Done |
| Context menu (right-click on sidebar in browser mode) | P1 | ⚠️ Partial |
| Keyboard shortcuts (Cmd+T, Cmd+W, Cmd+L) | P1 | ❌ Pending |
| Find in page (Cmd+F) | P1 | ❌ Pending |
| Downloads management | P2 | ❌ Pending |
| "Save to Space" quick-capture from current page | P1 | ❌ Pending |

#### Spaces Module (Knowledge Base)
| Feature | Priority | Status |
|---|---|---|
| Create / rename / delete Spaces | P0 | ✅ Done |
| Hierarchical items (unlimited folder nesting) | P0 | ✅ Done |
| Add links with metadata extraction (title, favicon, description) | P0 | ✅ Done |
| Folder organization within Spaces | P0 | ✅ Done |
| Sidebar tree view | P0 | ✅ Done |
| Card grid view | P0 | ✅ Done |
| Drag-and-drop reordering | P1 | ⚠️ Partial |
| Search within Spaces | P1 | ❌ Pending |
| Quick-add from browser (send current tab to Space) | P1 | ❌ Pending |
| Multi-select and bulk operations | P1 | ⚠️ Partial |
| Inline rename | P1 | ⚠️ Partial |

#### Notes Module
| Feature | Priority | Status |
|---|---|---|
| Create / edit / delete notes | P0 | ❌ Pending |
| Markdown with live preview | P0 | ❌ Pending |
| Link notes to Space items | P1 | ❌ Pending |
| Auto-save | P0 | ❌ Pending |
| Basic formatting toolbar | P1 | ❌ Pending |
| Backlink tracking | P2 | ❌ Pending |

#### Workspace Module (Local Files)
| Feature | Priority | Status |
|---|---|---|
| File tree navigation | P0 | ✅ Done |
| File viewer | P0 | ✅ Done |
| Markdown preview | P0 | ✅ Done |
| Multiple workspace roots | P1 | ❌ Pending |
| Recent files | P2 | ❌ Pending |

#### Core / Shell
| Feature | Priority | Status |
|---|---|---|
| SQLite persistence | P0 | ✅ Done |
| Settings / preferences | P0 | ✅ Done |
| Global search (Cmd+K) | P1 | ❌ Pending |
| Keyboard navigation | P1 | ❌ Pending |
| Multiple profiles | P2 | ❌ Pending |

---

### 4.2 Phase 2 — AI Agent (Months 3–5)

| Feature | Priority | Notes |
|---|---|---|
| AI chat sidebar panel | P0 | Aware of current Space context |
| Context engine — aggregates all module context | P0 | Feeds AI with active tabs, notes, space items |
| Summarize current page | P0 | One-click from browser |
| Q&A over knowledge base | P0 | "What have I saved about X?" |
| AI-assisted note creation | P1 | Draft from selected sources |
| Smart suggestions — related content | P1 | Surface relevant saved items while browsing |
| AI artifact creation & save | P1 | Agent creates doc, saves to Space |
| Natural language actions (send email, create note) | P2 | Agent executes with confirmation |
| Multi-model support (Claude, GPT-4o, local Ollama) | P1 | Pluggable model layer |
| STT — in-app recording + transcription | P1 | Whisper-powered, auto-save to Space |
| Meeting transcript → action items (AI) | P2 | Post-processing after transcription |

---

### 4.3 Phase 3 — IDE & Advanced (Months 5–8)

| Feature | Priority | Notes |
|---|---|---|
| Monaco editor (VS Code engine) | P0 | Code editing with syntax highlighting |
| LSP integration (TypeScript, Python) | P1 | IntelliSense |
| Integrated terminal (xterm.js) | P0 | Run CLI tools from within Spayce |
| Git integration | P2 | Status, diff, commit from within app |
| AI understands code + notes + browser context | P0 | The full integration payoff |
| Sandboxed execution environment | P2 | Safe code running |

---

### 4.4 Phase 4 — Sync & Enterprise (Months 8–12)

| Feature | Tier | Notes |
|---|---|---|
| Cloud knowledge base sync | Premium | Encrypted, user-owned |
| Cloud storage for artifacts | Premium | Notes, transcripts, files |
| Team Spaces (shared) | Premium | Collaborate on knowledge base |
| Closed enterprise environment | Enterprise | Employees work only in Spayce |
| Audit logs | Enterprise | Every AI action logged |
| SSO / SAML | Enterprise | IT-managed auth |
| Self-hosted AI (Qwen, DeepSeek, local models) | Enterprise | Data never leaves org |
| Enterprise AI accounts (OpenAI, Anthropic) | Enterprise | Corporate API keys |

---

## 5. Non-Functional Requirements

### 5.1 Performance
- App startup: < 3 seconds cold, < 1.5 seconds warm
- Tab switch: < 100ms
- Search results: < 200ms for local knowledge base
- SQLite writes: synchronous, < 10ms for single operations

### 5.2 Privacy & Security
- All Free tier data stays on device — no telemetry without consent
- No page content sent to servers without explicit user action
- Premium cloud storage: end-to-end encrypted
- Enterprise: fully auditable, no data egress without policy approval
- AI actions always require confirmation for destructive/external operations

### 5.3 Platform
- **Phase 1:** macOS (primary), Windows (secondary)
- **Phase 3:** Linux
- **Phase 4:** Mobile companion app (iOS)

### 5.4 Offline
- Full functionality offline for all local content
- Cloud features gracefully degrade when offline
- Pending sync queue when reconnected

---

## 6. Monetization Model

| Tier | Price | Storage | AI | Target |
|---|---|---|---|---|
| **Free** | $0 | Local only | BYOK | Builders, students |
| **Premium** | ~$15/mo | Cloud (50GB) | Managed (Claude/GPT) | Power users |
| **Enterprise** | Custom | Private cloud / on-prem | Corporate/self-hosted AI | Teams |

**Free tier strategy:** Full-featured local experience. Users bring their own API keys for any AI model they want (Claude Code, Codex, Ollama, etc.). No artificial feature locks — just no cloud.

---

## 7. Success Metrics

### Phase 1 (MVP)
- 100 active beta users
- Daily active use > 30 min/session
- 5+ Spaces created per user
- NPS > 40

### Phase 2 (AI)
- AI queries per user per day > 10
- Knowledge base items per user > 500
- 30-day retention > 60%

### Phase 3 (Revenue)
- 1,000 paying users (Free → Premium conversion)
- MRR > $15,000
- Enterprise pilot: 3+ companies

---

## 8. Constraints & Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Desktop framework | Electron | Full Chromium, Node.js access, file system, proven for complex apps |
| Tab implementation | WebContentsView | Proper process isolation per tab, Arc-style architecture |
| Local database | SQLite (better-sqlite3) | Embedded, fast, offline-first, no server |
| UI | React + TypeScript | Best AI assistance, mature ecosystem |
| State | Zustand | Simple, scalable, persistent middleware |
| AI integration | Provider-agnostic | Support BYOK, Claude, GPT, Ollama — no lock-in |
| STT | Whisper (local) | Privacy-preserving, no audio to servers by default |
| Notes format | Markdown | Portable, future-proof, renderable anywhere |

---

## 9. Open Questions

1. **Knowledge graph vs. folder hierarchy**: Should Spayce add bi-directional linking and a graph view on top of the folder structure, or keep it strictly hierarchical?
2. **STT privacy model**: Should transcription run fully locally (Whisper), or offer cloud option for speed?
3. **Extension model**: Should Spayce support user-installable plugins/extensions? When?
4. **Mobile strategy**: Companion app (read-only + capture) or full mobile port?
5. **Pricing**: Is $15/mo right for Premium, or should there be a one-time purchase option?

---

*PRD Version 1.0 — Created 2026-05-03*
