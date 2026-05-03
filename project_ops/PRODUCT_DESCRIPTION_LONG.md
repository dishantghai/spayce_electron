# Spayce — Long-Form Product Description

## The Problem We're Solving

Every knowledge worker in 2025 lives inside a fragmented stack they didn't choose to build and can't escape:

- A browser with 30+ tabs they're afraid to close, because closing means losing the context
- Notion or Obsidian for notes — but notes never connect to what they were browsing when they wrote them
- VS Code or another IDE for code — completely isolated from the docs, research, and meetings that informed it
- 3–4 different AI chat windows, each starting with zero knowledge of who this person is or what they've been working on
- Google Drive for files, Jira for tasks, Slack for communication, Loom for video — each a silo

This is not a software failure. It's an architectural failure. We built productivity tools as isolated vertical applications, and now AI arrives to "help" — but AI has no view of the actual workspace. Every session starts from scratch. Every chat window is amnesiac. The AI is powerful but blind.

The result is a tax paid by every knowledge worker every day: hours of context reconstruction, copy-pasting between apps, re-explaining what you're working on to tools that should already know.

---

## The Insight

Andrej Karpathy recently wrote about a pattern he calls the **LLM Wiki**: instead of retrieving from raw documents on every AI query, an LLM incrementally builds and maintains a structured, persistent wiki — markdown files with summaries, entity pages, and cross-references — that sits between the person and their raw sources. The wiki is a compounding artifact. Knowledge accumulates. Cross-references exist permanently. The AI queries the wiki, not the raw sources, and gets dramatically more useful answers.

This is exactly right. But it's describing a component, not a system.

The missing piece is: **where does the wiki live? How does it get built? What captures the raw sources? And who acts on it?**

Spayce is the answer to all four questions.

---

## What Spayce Is

**Spayce is a desktop AI OS** — a single Electron application that serves as the primary environment for all of a knowledge worker's browsing, learning, creating, and building, such that every artifact automatically accumulates into a connected, AI-queryable knowledge base.

It is not a browser. It is not a note-taking app. It is not an AI chat interface. It is the environment that makes all three work together — and makes the AI genuinely useful because it has real context.

### The Knowledge Base: Spaces

The architectural core of Spayce is **Spaces** — a hierarchical folder system that lives inside the app and holds every artifact a user creates or captures:

- Web pages and links (saved from the integrated browser)
- Notes and documents (written in the in-app editor)
- Local files (synced from the filesystem)
- Meeting transcripts (from in-app STT recording)
- Code artifacts (created by the IDE or AI agent)
- AI-generated outputs (saved as first-class items)

Every item in a Space is tagged with metadata: source URL, creation timestamp, linked notes, related items, visit history. Over time, this Spaces knowledge base becomes the user's personal knowledge graph — structured, persistent, and ever-growing. This is Karpathy's wiki, built automatically as you work.

### The Integrated Browser

Spayce includes a full Chromium browser built on Electron's WebContentsView — the same architecture used by Arc. Every page you browse is a potential capture into your knowledge base. One click saves the current page into the relevant Space, with title, favicon, and description extracted automatically. Sessions persist across restarts. Tabs track which Space they originated from.

The browser isn't just a feature — it's the primary capture channel. Browsing inside Spayce means your research, your sources, and your web activity are all in one place, available to search, link, and query.

### Notes — Connected to Everything

The notes module in Spayce is not a standalone app. Notes are first-class items inside Spaces, linked to the web pages, files, and other items that informed them. Write a note about a paper you just read — the paper is already saved in the same Space. Write a code note next to the documentation you were reading when you wrote it.

This is the link that Notion and Obsidian never made: your notes live in the same context as the sources that created them.

### STT & Meeting Intelligence

Record calls directly in Spayce. Transcripts are generated (via Whisper, running locally) and auto-saved as items in the relevant project Space. No audio leaves the device by default. From the transcript, the AI agent can extract action items, summarize decisions, draft follow-up emails — all with one natural language instruction.

This closes the loop on one of the biggest context gaps in knowledge work: what was actually said in the meeting, connected to the project it belongs to.

### The IDE and Terminal

For builders, Spayce includes a Monaco-based code editor (the same engine as VS Code) and an integrated terminal. Write code in the same environment where you're reading the documentation, taking notes about the architecture, and recording design decisions. The AI agent understands your code, your notes, your browser history, and your meeting transcripts — together. This is the context density that makes AI coding assistance genuinely powerful.

### The AI Agent

The AI agent in Spayce is not a chatbot. It is a context-aware operator with full access to the knowledge base.

It can:
- Answer questions over your entire accumulated knowledge base ("What have I saved about transformer architectures?")
- Summarize any item — a webpage, a transcript, a document, a code file
- Draft artifacts — write a document from a set of notes, draft an email from a meeting transcript
- Execute actions — send an email, create a new note, move items between Spaces — all from natural language
- Surface relevant context proactively — while browsing, suggest related items from your Spaces
- Run as a coding assistant with awareness of your documentation, specs, and prior decisions

The model is pluggable: users can bring their own API keys for Claude, GPT-4o, or run a local model via Ollama. Enterprise deployments can use corporate API accounts or fully self-hosted models (Qwen, DeepSeek, etc.).

---

## The Sandbox Architecture

Spayce is a sandboxed environment. Everything the user does and everything the AI does happens inside the Spayce container. This has three distinct benefits:

**For individual users:** AI agent actions are scoped and reversible. The agent can't accidentally modify files outside the Spayce workspace. Actions that affect the outside world (sending email, pushing to git) require explicit confirmation.

**For security:** System vulnerabilities can't reach the Spayce knowledge base. The user's accumulated work and context is isolated from the broader attack surface of their OS.

**For enterprises:** This is the killer feature. Spayce becomes the mandatory, auditable work environment. Employees work exclusively inside Spayce. Every AI action is logged. Every knowledge artifact is company-owned. The enterprise pays for corporate AI accounts, gets full visibility, and never worries about employees copy-pasting sensitive data into consumer ChatGPT. Spayce is the bottleneck through which all AI-augmented work flows.

---

## The Positioning

### Versus existing tools

| Tool | What it does well | What it can't do |
|---|---|---|
| **Arc Browser** | Beautiful browser UX, spaces concept | Not a knowledge base, no AI agent, not a full workspace |
| **Notion** | Rich docs and databases | No browser, no AI over your actual browsing context, no code, no STT |
| **Obsidian** | Excellent PKM, graph view, markdown | No browser, no AI agent, no STT, local-first but isolated |
| **Cursor / VS Code** | Excellent AI coding | No browser, no knowledge base, no meeting context, siloed |
| **Rewind.ai** | Passive capture of everything | Passive only — no organization system, no active AI agent |
| **Raycast** | Excellent launcher/search | No knowledge base, no browser, no persistence of context |

**Spayce's unique position:** It is the only product that combines active capture (browser, notes, STT, files, code), structured organization (hierarchical Spaces), and an AI agent with access to the full accumulated context — in a single sandboxed desktop environment.

### The market

Knowledge worker software is a $50B+ market growing at 12–15% annually. PKM tools (Obsidian, Notion, Roam) are growing at 30%+ driven by the AI productivity wave. The AI assistant market is exploding but fragmented — the dominant tool hasn't emerged yet. The enterprise AI governance market (ensuring compliant, auditable AI use) is an emerging requirement at every company with > 100 employees.

Spayce sits at the intersection of all three.

---

## The Roadmap

### Phase 1 — MVP (Months 1–3): The Organized Browser
Working: browser, Spaces, local files, session persistence. Complete: notes editor, global search, keyboard shortcuts, drag-and-drop polish.

**Revenue target:** Early adopters on the Free tier. First 100 active users.

### Phase 2 — AI Agent (Months 3–5): Context Becomes Power
Add: AI agent with knowledge base access, STT + transcription, natural language actions, proactive context surfacing.

**Revenue target:** Launch Premium tier. 1,000 paying users.

### Phase 3 — Builder's OS (Months 5–8): The Full Stack
Add: Monaco IDE, integrated terminal, Git integration, AI coding with full context awareness.

**Revenue target:** 5,000 paying users. First enterprise pilot.

### Phase 4 — Enterprise (Months 8–12): The Bottleneck Play
Add: Cloud sync, team Spaces, SSO/SAML, audit logging, self-hosted AI, enterprise deployment.

**Revenue target:** 3+ enterprise customers. $100K ARR.

---

## Why the Timing Is Right

Three things converged in 2024–2025 that make Spayce possible and necessary:

1. **AI agents can actually execute.** Claude Code, GPT-4o with tools, local models via Ollama — agents can now do real work given real context. The capability is there. The context environment isn't.

2. **Electron matured.** Arc proved that you can build a world-class browser in Electron. WebContentsView gives proper process isolation. The architectural primitives exist.

3. **Context fragmentation is acute.** The proliferation of AI tools made the fragmentation problem worse, not better. Every new AI chat window is another context silo. Users are suffering from this right now.

The one-person lab is possible. Spayce is the environment it runs in.

---

## Why Spayce

We're not building a better browser. We're not building a better notes app. We're building the environment that makes the AI agent actually useful — the place where everything a knowledge worker does becomes context, and that context becomes compounding value over time.

The goal isn't a feature. The goal is a new category: the Personal AI OS. The desktop environment that knows you, knows your work, and helps you do more of it.

---

*Spayce — Your Space. Your Context. Your AI.*
