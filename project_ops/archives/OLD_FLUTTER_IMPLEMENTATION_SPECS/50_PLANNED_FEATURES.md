# Spayce - Planned Features

> **Document Purpose**: Features from specs that are not yet implemented, for future development.

---

## Table of Contents

1. [Feature Roadmap](#feature-roadmap)
2. [Notes System (Spec 039)](#notes-system-spec-039)
3. [AI Copilot (Spec 016)](#ai-copilot-spec-016)
4. [Reader Mode (Spec 009)](#reader-mode-spec-009)
5. [Cross-Device Sync (Spec 037)](#cross-device-sync-spec-037)
6. [Browser Enhancements](#browser-enhancements)
7. [IDE Features (Spec 044)](#ide-features-spec-044)

---

## Feature Roadmap

### Priority Levels

| Priority | Meaning | Target |
|----------|---------|--------|
| P1 | MVP Critical | Current |
| P2 | MVP Nice-to-have | Next Release |
| P3 | Post-MVP | V2 |
| P4 | Future | Later |

### Planned Features Overview

| Feature | Priority | Spec | Status |
|---------|----------|------|--------|
| Notes System | P2 | 039 | 📋 Planned |
| AI Copilot | P3 | 016 | 📋 Planned |
| Reader Mode | P2 | 009 | 📋 Planned |
| Cross-Device Sync | P4 | 037 | 📋 Planned |
| IDE Features | P4 | 044 | 📋 Planned |
| Browser Profiles | P3 | 023 | 📋 Planned |
| Password Manager | P3 | 027 | 📋 Planned |
| History & Bookmarks | P2 | 010 | 📋 Planned |

---

## Notes System (Spec 039)

### Overview

A comprehensive note-taking system extending the Workspace feature, combining:
- **Notion**: Block-based editing, slash commands
- **Obsidian**: Local Markdown files, bidirectional linking, graph view
- **Remio.ai**: AI-powered summarization, smart search

### Phase 1: Core Editing (MVP)

| Feature | Description |
|---------|-------------|
| Block-based editor | Rich text with paragraphs, headings, lists, code blocks |
| Markdown source mode | Toggle between WYSIWYG and source |
| Local Markdown storage | Notes stored as `.md` files in workspace |
| Tab integration | Notes open as `TabType.note` |
| Auto-save | 5-second debounce, save on blur |
| Formatting toolbar | Bold, italic, headings, lists, code blocks |

### Phase 2: Knowledge Management

| Feature | Description |
|---------|-------------|
| Wiki-style linking | `[[link to another note]]` syntax |
| Backlinks panel | Show all notes linking to current note |
| Graph view | Interactive visualization of note connections |
| Daily notes | Automatic date-based note creation |
| Slash commands | `/heading`, `/list`, `/code`, etc. |
| AI summarization | Auto-generate summaries |

### Phase 3: Advanced

| Feature | Description |
|---------|-------------|
| Canvas/Whiteboard | Visual note arrangement |
| Databases/Tables | Properties, filtering, views |
| Block references | Transclusion |
| Knowledge blending | AI-suggested connections |

### Technical Approach

```
frontend/lib/features/notes/
├── data/note_service.dart       # Extends FileSystemService
├── domain/note_model.dart       # Note, NoteMeta, WikiLink
└── presentation/
    ├── note_editor_screen.dart  # Block editor
    └── widgets/
        ├── block_editor.dart    # Rich text blocks
        ├── wiki_link_autocomplete.dart
        └── graph_view.dart      # Note graph
```

---

## AI Copilot (Spec 016)

### Overview

Inline AI assistant for contextual help while browsing and learning.

### MVP Scope

| Feature | Description |
|---------|-------------|
| Chat interface | Floating button/sidebar |
| Context-aware responses | Uses current page content |
| Quick Q&A | Learning assistance |
| Page context | Extracts visible text for context |

### User Stories

1. **Quick Learning Assistance**: Ask questions about current page content
2. **Content Explanation**: Highlight text for simplified explanations

### Technical Approach

```
Frontend: Floating widget in browser view
Backend: POST /ai/chat with page context + query
AI: OpenAI API with prompt engineering
Context: JavaScript bridge extracts page content
```

### Performance Requirements

- AI responses within 3 seconds
- Chat interface ≤30% of browser content

---

## Reader Mode (Spec 009)

### Overview

Clean, distraction-free reading interface for web articles.

### MVP Scope

| Feature | Description |
|---------|-------------|
| Content extraction | Title, body text, images |
| Clean typography | Focused reading experience |
| View toggle | Switch between reader and original |
| Format preservation | Headings, paragraphs, lists |

### Technical Approach

- Inject Readability.js into WebView
- Pass extracted content via JavaScript bridge
- Render in Flutter Text widgets
- In-memory content storage during session

### Performance Requirements

- Content extraction within 3 seconds
- Responsive across desktop and mobile

---

## Cross-Device Sync (Spec 037)

### Overview

Sync browser data across devices using cloud backend.

### MVP Scope

| Feature | Description |
|---------|-------------|
| Profile sync | Browser profiles across devices |
| Bookmark sync | Shared saved pages |
| History sync | Browsing history |
| Password sync | End-to-end encrypted |
| Settings sync | Browser preferences |

### Sync Architecture

```
SyncManager
├── scheduleSync()
├── syncNow()
└── resolveConflicts()

Providers
├── BookmarkSyncProvider
├── HistorySyncProvider
├── PasswordSyncProvider
└── SettingsSyncProvider
```

### Backend API

| Endpoint | Purpose |
|----------|---------|
| `POST /sync/push` | Push local changes |
| `GET /sync/pull` | Pull remote changes |
| `POST /sync/devices` | Register device |

### Security

- End-to-end encryption for passwords
- TLS for all sync communications
- Device authentication

---

## Browser Enhancements

### History & Bookmarks (Spec 010)

| Feature | Description |
|---------|-------------|
| History UI | Browse, search, filter history |
| Bookmark manager | Folders, tags, search |
| Import/Export | Standard formats |

### Browser Profiles (Spec 023)

| Feature | Description |
|---------|-------------|
| Multiple profiles | Separate browsing contexts |
| Profile isolation | Cookies, history, bookmarks per profile |
| Profile switching | Quick switch UI |

### Password Manager (Spec 027)

| Feature | Description |
|---------|-------------|
| Save credentials | Prompt on login forms |
| Auto-fill | Username/password fields |
| Password generator | Strong password creation |
| Secure storage | Encrypted vault |

### Form Autofill (Spec 028)

| Feature | Description |
|---------|-------------|
| Address forms | Auto-fill shipping/billing |
| Credit cards | Secure card storage |
| Custom fields | User-defined autofill data |

### Advanced Tabs (Spec 032)

| Feature | Description |
|---------|-------------|
| Tab groups | Visual organization |
| Tab pinning | Persistent tabs |
| Tab search | Find open tabs |
| Tab sleeping | Memory optimization |

### Incognito Mode (Spec 031)

| Feature | Description |
|---------|-------------|
| Private browsing | No history/cookies saved |
| Visual indicator | Clear incognito state |
| Session isolation | Separate from main session |

---

## IDE Features (Spec 044)

### Overview

Full-fledged IDE capabilities building on Workspace.

### Planned Features

| Feature | Description |
|---------|-------------|
| Code editing | Syntax highlighting, line numbers |
| LSP integration | IntelliSense, go-to-definition |
| Terminal | Integrated terminal emulator |
| Debugging | Breakpoints, call stack |
| Git integration | Source control UI |
| Extension API | Plugin system |

### Dependencies

- Extends Spec 042 (Workspace)
- Extends Spec 040 (Local Files)
- Extends Spec 043 (Git Integration)

---

## Additional Planned Features

### Reading List (Spec 033)

Save articles for later reading with offline support.

### Picture-in-Picture (Spec 034)

Floating video player while browsing.

### Developer Tools (Spec 038)

Built-in web inspector and console.

### Notifications (Spec 041)

System notifications for background events.

### Gmail Integration (Spec 015)

Email inbox integration with learning content.

---

## Implementation Priority

### Next Release (P2)

1. Notes System Phase 1 (Core Editing)
2. Reader Mode
3. History & Bookmarks UI

### V2 Release (P3)

1. AI Copilot
2. Notes System Phase 2 (Knowledge Management)
3. Browser Profiles
4. Password Manager

### Future (P4)

1. Cross-Device Sync
2. IDE Features
3. Notes System Phase 3 (Advanced)

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
