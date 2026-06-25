# Spayce — Vizuara Residency Application Guide

> This document is a step-by-step guide for applying to the Vizuara Residency Cohort 01 with the Spayce product idea.

---

## Before You Apply: Know Your Status

### What Spayce Is

Spayce is a desktop AI OS — a single Electron application that combines an integrated browser, a hierarchical knowledge base (Spaces), note-taking, local file browsing, STT/meeting transcription, an IDE, and a built-in AI agent. Everything a knowledge worker does in a day happens inside Spayce, and every artifact is automatically organized into a connected knowledge graph that the AI agent can query and act on.

### Current Project Status

**Prototype: Functional ✅ — Early stage, actively in development.**

| Module | Status | Details |
|---|---|---|
| Browser (Multi-tab) | ✅ Working | WebContentsView-based tabs, navigation, persistence, origin tracking |
| Spaces (Knowledge Base) | ✅ Working | Hierarchical folders, link saving with metadata, tree + card views |
| Sidebar Navigation | ✅ Working | Full tree navigation, overlay mode in browser |
| Local Workspace (Files) | ✅ Working | File tree, viewer, markdown preview |
| Core Persistence | ✅ Working | SQLite database, settings, session restore |
| Context Menu & Interactions | ⚠️ Partial | Right-click menus, inline rename — partially implemented |
| Drag & Drop | ⚠️ Partial | Architecture in place, some edge cases pending |
| Global Search (Cmd+K) | ❌ Pending | Designed, not yet built |
| Notes Module | ❌ Pending | Architecture designed, implementation not started |
| AI Agent | ❌ Pending | Architecture designed (Phase 2) |
| STT / Meeting Transcription | ❌ Pending | Planned for Phase 2 |
| IDE + Terminal | ❌ Pending | Planned for Phase 3 |

**Overall completion: ~35% of full vision, ~60% of Phase 1 MVP.**

**Tech stack:** Electron 30, React, TypeScript, Zustand, SQLite (better-sqlite3), WebContentsView for Arc-style browser tabs.

**Codebase size:** 20 SPEKY specs written, 28 test files (800+ tests), multiple working modules.

The app runs. A reviewer can install it, launch it, create Spaces, save links, browse the web in integrated tabs, and navigate their local filesystem — all within Spayce.

---

## Application — Field by Field

Below is every field in the Vizuara Residency application, with guidance on what to write for Spayce.

---

### Personal Information

**Full Name:** [Your full name]

**Email:** [Your email]

**Phone:** [Your phone with country code]

**Age:** [Your age]

**Current City:** [Your city] — note that you are willing to relocate to Pune for 4 months

---

### Current Occupation

Write something like:

> Independent developer and founder. I've been building Spayce, a desktop AI OS, as my primary focus for the past [X months]. Previously [brief prior background — student/engineer/etc.].

---

### Online Profile Links

Include:
- GitHub profile (show the spayce_electron repo or a pinned version)
- LinkedIn (if relevant)
- Twitter/X (if you post about building)
- Any demo video or Loom walkthrough of Spayce

**Critical:** Make sure your GitHub shows recent, consistent commits on spayce_electron. This is evidence of unprompted shipping.

---

### The Idea

This is your most important answer. Write it in full:

---

**What I'm building:**

> Spayce is a desktop AI OS for knowledge workers — a single Electron application that replaces the fragmented stack of browser + Notion + Obsidian + VS Code + Slack + AI chat windows with one unified, context-aware environment.
>
> At its core is a hierarchical knowledge base called Spaces: every website you browse, note you write, file you open, meeting you record, and code artifact you create is organized into a structured folder system inside the app. This accumulates over time into a living, connected knowledge graph — your personal context layer for AI.
>
> On top of this knowledge base sits a powerful AI agent that can see everything in your workspace and act on it. Ask it to summarize a meeting transcript, draft an email from a set of notes, search across everything you've ever saved, or write code with full awareness of related documentation. Because the AI's context is your actual work — not a blank slate — it's orders of magnitude more useful than a generic chatbot.
>
> The app also includes: an integrated Chromium browser (pages you visit get captured automatically), rich markdown notes linked to knowledge base items, local file browsing, in-app STT for meeting transcription, and an IDE with terminal for code — all inside one sandboxed environment.

**How I'll monetize:**

> Three tiers:
> - **Free:** Full local experience. Users bring their own AI API keys (Claude, GPT-4o, Ollama). All data stays on device. This tier builds the user base and habit.
> - **Premium (~$15/mo):** Cloud sync for the knowledge base, cloud storage for artifacts, managed AI (no BYOK needed), and advanced features like team Spaces.
> - **Enterprise (custom):** A fully closed, auditable, policy-controlled environment where employees work exclusively within Spayce. Powered by corporate AI accounts (Anthropic, OpenAI) or self-hosted models (Qwen, DeepSeek). Every AI action logged. This is where the real revenue is — the enterprise AI bottleneck play.

---

### Working Prototype

**Answer: Yes.**

The app is functional. Here's what a reviewer can do right now:

1. Install and launch Spayce on macOS
2. Create Spaces (project folders) in the sidebar
3. Add links to Spaces — metadata (title, favicon, description) auto-extracted
4. Browse the web using the integrated tab browser — just like a regular browser, inside the app
5. Open local files and folders in the Workspace module with markdown preview
6. Navigate a deep folder hierarchy in the Spaces sidebar
7. Session state persists across app restarts

**What's not yet live but designed:**
- Notes editor, AI agent, STT, global search, IDE/terminal

---

### Live Link to Prototype

Since this is a desktop Electron app, there's no live URL — but provide:

1. **GitHub repo link** (spayce_electron) — reviewers can clone and run
2. **Loom/video walkthrough** (record one specifically for the application)
3. **Screenshot gallery** showing the working UI

For the Loom: show a complete session — create a Space, add links, browse a page in the integrated browser, navigate the sidebar hierarchy, open a local file. Keep it under 4 minutes. Don't over-explain — let the product speak.

---

### Prototype Walkthrough

Write a concise walkthrough for the application form:

> Spayce is a working Electron desktop application on macOS. Here's what exists today:
>
> **Browser Module:** Full multi-tab web browsing inside the app using Chromium WebContentsView. Each tab tracks which Space opened it. Sessions persist across restarts.
>
> **Spaces Module:** Hierarchical knowledge base with unlimited folder nesting. You can create Spaces (e.g., "Startup Research", "ML Reading", "Client Project X"), add sub-folders, and save links with auto-extracted metadata (title, favicon, description). Items display in a sidebar tree view and a card grid view.
>
> **Workspace Module:** Navigate your local file system from within the app. Markdown files render with preview. Works alongside the browser — same app, seamless switching.
>
> **Core:** All data persists in SQLite. Settings are stored. App restores previous session on launch.
>
> **In progress:** Context menu polish, drag-and-drop, global search.
>
> **Designed but not yet built:** Notes editor, AI agent, STT/transcription, IDE/terminal, cloud sync.
>
> The codebase has 20 specification documents (SPEKY specs), 800+ unit and integration tests, and a clean TypeScript/React architecture designed specifically to support the AI agent layer coming in Phase 2.

---

### Evidence of Unprompted Shipping

This is critical. The application asks for proof that you build without being asked.

**What to link / show:**

- **GitHub commit history on spayce_electron:** Show consistent, self-directed commits over weeks/months — not bursts before an application deadline
- **SPEKY spec documents:** 20 specs written and executed, showing you plan and ship systematically without external direction
- **800+ tests:** Written proactively as part of development, not required by anyone
- **Migration work:** You migrated from a Flutter prototype to an Electron app — a major proactive technical decision
- **Session summaries:** The HANDOFF and SESSION_FINAL_STATUS docs show deep, systematic debugging at the architectural level — not "wait for help" energy

Write in the application:

> I've been building Spayce autonomously for [X months]. Evidence of unprompted shipping: [GitHub link showing consistent commits]. I wrote 20 architectural specification documents before building each module. I migrated the entire app from a prior Flutter prototype to Electron, driven entirely by my own conviction about the right technical choice. I've written 800+ tests proactively — no one asked for them. When I hit a hard bug (like the WebContentsView context menu z-index issue across Chromium compositor layers), I spent multiple sessions diagnosing root causes and documenting them rather than shipping a hack.

---

### Personal Passion Statement

> I've been a knowledge worker my whole life — studying, researching, building. And I've always hit the same wall: my tools don't talk to each other. I have 30 browser tabs I'm scared to close, notes scattered across three apps, code in VS Code, docs in Notion, and AI chats that have no idea what I've been working on for the past month.
>
> The worst part isn't the switching. It's that every AI tool I use is blind to my actual context. I'm rebuilding context from scratch every time I open a new chat window. Meanwhile, the most useful thing an AI could do — read everything I've accumulated and help me make sense of it — is technically trivial. We just don't have the environment for it.
>
> Spayce is that environment. I'm building it because I want to use it myself, every day. And I think there are millions of people who feel the same friction I do.

---

### Envisioned World Value

> If Spayce works, knowledge workers stop losing hours to context reconstruction. A researcher's entire body of reading, notes, and synthesis becomes instantly queryable. A founder's product thinking, customer conversations, code, and market research live in one place — and their AI agent knows all of it. An enterprise employee's work is auditable and safe, and their AI assistance is grounded in actual company knowledge, not hallucinated generalities.
>
> The bigger vision: Spayce becomes a Portable AI OS. Not cloud-dependent, not locked to one provider, not a thin wrapper on ChatGPT. A desktop environment that a person owns, that learns from them over years, and that makes them genuinely more capable as a result. The one-person lab that Vizuara talks about becomes real for every knowledge worker, not just engineers who can wire it together themselves.

---

### In-Person Commitment Confirmation

**Answer: Yes.**

Write:

> I confirm I can commit to 4 months in-person at the Pune office for Cohort 01. I understand this is a requirement and I have structured my life to make this possible.

---

## Application Checklist

Before submitting, verify:

- [ ] GitHub repo is clean, public (or shared), and shows recent commits
- [ ] Loom walkthrough recorded — complete flow, < 4 minutes
- [ ] Screenshots ready — sidebar, browser tab, spaces grid
- [ ] All form fields filled completely — no empty optional fields
- [ ] Prototype link is a working GitHub repo with clear install instructions
- [ ] You've NOT linked unrelated past projects — everything points to Spayce
- [ ] Response deadline noted: 7 days after submission

---

## Tips for Standing Out

1. **Show the architecture vision, not just current features.** Vizuara mentors are PhD researchers — they'll appreciate that you have a coherent technical plan for Phase 2 (AI agent) and Phase 3 (IDE), not just a demo.

2. **Reference Andrej Karpathy's knowledge OS concept.** It aligns almost perfectly with what Spayce is building, and the mentors are deep in AI research. Showing you think at that level signals intellectual alignment.

3. **Lead with the enterprise angle in monetization.** The $15/mo consumer tier is obvious. The enterprise bottleneck play — where Spayce becomes the mandatory, auditable, AI work environment — is the genuinely surprising insight. That's where the real business is.

4. **Be specific about what's broken in the current prototype.** Don't oversell. Say "context menus across the WebContentsView compositor boundary are partially fixed, here's the root cause I diagnosed." That kind of honesty + technical depth is exactly what proactive builders show.

5. **The 16-week target:** By Vizuara's Demo Day, you should have: Notes module complete, AI agent v1 (queries over knowledge base + basic actions), STT transcription, and at least one paying user. Make this your explicit goal in the application. Show you've thought about what "revenue by week 12" means for Spayce.

---

*Application guide created: 2026-05-03*  
*Program: Vizuara Residency Cohort 01 — https://vizuara-residency.vercel.app*
