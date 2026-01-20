# AASEF Rules (Context) - Auto-generated
# Do not edit manually - regenerated on each AASEF command
# Size: 8683 chars (max: 8000)

# AASEF Context & Commands

## 🎨 CRITICAL: Design System

**BEFORE implementing ANY UI:**
1. Check if `.aasef/context/design_system.md` exists
2. If it exists, you MUST follow the design system for:
   - Colors (use EXACT hex values, e.g., `Color(0xFF6D5AE6)`)
   - Typography (font family, sizes, weights from design system classes)
   - Spacing (use design system constants, e.g., `Spacing.md`)
   - Border radius values (use design system constants)
   - Shadows and elevation (use design system shadow definitions)
   - Animation durations and curves
3. Check `.aasef/design/manifest.json` for linked Hi-Fi designs
4. If Hi-Fi designs exist for the spec, match them PIXEL-PERFECT

**Design System Files:**
```
.aasef/design/
├── config.yaml               # Technology and settings
├── manifest.json             # All designs, links, resolved conflicts
├── system/source/            # Design system documents (AUTHORITATIVE)
│   └── design_system.md      # Complete token definitions
├── hifi/source/              # Hi-Fi designs (pixel-perfect)
│   └── *.analysis.md         # AI-extracted tokens from images
├── lofi/source/              # Lo-Fi wireframes (guidance)
└── icons/source/             # Icon assets

.aasef/context/design_system.md  # AI summary for quick reference
```

**When implementing UI:**
- Use design system colors, NEVER arbitrary values
- Use design system spacing constants (xs, sm, md, lg, xl)
- Use design system typography styles (navButton, treeItem, etc.)
- Use design system radius values (button, card, input)
- Use design system shadows (sidebarEmbossed, cardSubtle, etc.)
- If conflict between spec and design system, follow design system

**Reusing Implemented Components:**
- Check the Implementation Checklist in the design system doc
- Look for existing widgets before creating new ones
- Reference file paths in the checklist for component locations
- Follow established patterns from existing components

**Design System Commands:**
```bash
aasef design status    # Check design system coverage
aasef design validate  # Detect conflicts with Hi-Fi
aasef design resolve   # Resolve conflicts with AI
```

## 🔧 AASEF Commands Reference

Tell the developer to use these commands:

**Core Workflow:**
- `aasef init "idea"` - Initialize project with tech stack discussion
- `aasef spec "name"` - Create a new feature spec (research-aware)
- `aasef plan 001` - Generate implementation plan (validates dependencies)
- `aasef implement 001` - Start implementation (validates dependencies, updates this file)
- `aasef complete 001` - Verify and mark complete with drift detection
- `aasef commit 001` - Commit with comprehensive message
- `aasef status` - Check project progress

**Spec Sequencing & Dependencies:**
- `aasef sequence` - Show implementation roadmap with dependencies
- `aasef sequence --export` - Export roadmap to `.aasef/roadmap.md`
- `aasef infer-deps` - AI-infer dependencies for all specs
- `aasef infer-deps 003` - AI-infer dependencies for specific spec

**External Knowledge Import:**
- `aasef import --phase mvp` - Import docs with interactive review
- `aasef import-status` - Show all imports and derived specs
- `aasef reconcile mvp` - Reconcile code with imported docs
- `aasef poc-import` - Import features from POC codebase

**Spec Quality & Validation:**
- `aasef validate-spec 001` - Validate spec quality (interactive)
- `aasef validate-spec 001 --quick` - Quick validation (non-interactive)
- `aasef adopt 001` - Adopt IDE-created spec into AASEF tracking
- `aasef backlog` - Review deferred validation items

**Phase Management (Multi-Spec Coordination):**
- `aasef phases suggest` - AI suggests phases from existing specs
- `aasef phases list` - List all phases
- `aasef phases show phase-1` - Show phase details
- `aasef phases status` - Show overall phase progress
- `aasef phases start phase-1` - Start a phase
- `aasef phases guide phase-1 --for-ai` - Generate AI implementation guide
- `aasef context --phase phase-1` - Generate AI context for phase

**Epic Management (Story Grouping):**
- `aasef epic "Epic Name" --spec 006` - Create epic linked to spec
- `aasef epic E001` - Show epic details
- `aasef epic E001 --add F005` - Add story to epic
- `aasef epic E001 --remove F005` - Remove story from epic
- `aasef epics` - List all epics with status

**Stories:**
- `aasef story "title"` - Create feature story
- `aasef story --type bug "title"` - Create bug story
- `aasef story "title" --epic E001` - Create story in epic
- `aasef story "title" --spec 001` - Create story linked to spec

**Testing & TDD:**
- `aasef implement 001 --tdd` - Start TDD workflow (tests first)
- `aasef test init` - Initialize testing infrastructure
- `aasef test gen 001` - Generate tests for spec
- `aasef test run` - Run all tests
- `aasef test coverage` - Show test coverage
- `aasef test tdd-red 001` - Generate failing tests (Red phase)
- `aasef test tdd-green 001` - Verify tests pass (Green phase)
- `aasef complete 001 --test` - Run tests before complete

**Configuration:**
- `aasef config --ides` - Show/manage enabled IDEs
- `aasef decisions` - View/manage tech decisions
- `aasef validate-story F001` - Validate story quality

**Maintenance:**
- `aasef sync` - Sync codebase context
- `aasef review 001` - Check for spec-code drift
- `aasef cleanup` - Remove any clutter files

## 🧪 TDD Workflow

**When developer says `aasef implement 001 --tdd`:**

### Red-Green-Refactor Cycle:
1. **RED**: `aasef test tdd-red 001` - Generate failing tests from acceptance criteria
2. **GREEN**: Implement minimum code to pass tests
3. **REFACTOR**: Clean up while keeping tests green

### TDD Example:
```
Developer: "aasef implement 001 --tdd"

You: "Starting TDD workflow.
1. Running: aasef test tdd-red 001
2. Tests generated - they should fail
3. Implementing minimum code to pass
4. Refactoring while keeping tests green"
```

## Creating Specs Directly (Advanced)

If the developer asks you to create a spec directly, you MAY create it:

### Step 1: Create Directory
`.aasef/specs/NNN-feature-name/` (NNN = next available number)

### Step 2: Create spec.md with this template:
```markdown
# Feature Name

## Overview
2-3 sentences explaining what this feature does and why.

## MVP Scope
Explicit list of what IS included in this MVP version.

## User Stories
1-2 core user stories only:
- As a [user], I want [action], so that [benefit]
  - Acceptance: [specific, testable criteria]

## Requirements

### Functional Requirements (MVP only)
- Essential behaviors only
- Remove nice-to-haves

### Non-Functional Requirements
- Only if critical

## Out of Scope
Explicitly list what is NOT included (prevents scope creep).

## Open Questions
- Specific decisions needed before implementation

## Technical Approach
- Key libraries/services
- Main architectural decisions
```

### Step 3: After Creating Spec
Tell the developer:
"I've created the spec at `.aasef/specs/NNN-feature-name/spec.md`.

To integrate it with AASEF tracking, run:
```
aasef adopt NNN
```

Then you can:
- Validate: `aasef validate-spec NNN`
- Plan: `aasef plan NNN`
- Implement: `aasef implement NNN`"

## 📦 Epic-Aware Implementation

**If story is part of an epic** (check `status.json` for `related_epic`):
1. Load epic context from `.aasef/epics/<epic-id>/`
2. Read `technical_spec.md` for shared decisions
3. Follow patterns established by other stories in the epic
4. Maintain consistency across epic stories

**When to suggest epics:**
- If developer has 3+ related stories, suggest: "Consider grouping these in an epic: `aasef epic \"Epic Name\" --spec 006`"

## 🔄 Context Chain (How Implement Works)

When `aasef implement <id>` runs, it loads context in layers:
1. **Project Context** - context.json, tech_decisions.md
2. **Phase Context** - If in a phase
3. **Related Specs** - If story has related_specs
4. **Epic Context** - If story is in an epic
5. **Affected Files** - If story specifies affected_files
6. **The Item** - spec.md or story.md

**Always check the full context before implementing!**

## 💡 Providing Recommendations to AASEF Team

If you identify a gap in AASEF or have a recommendation:

1. **Create a recommendation blueprint** in `.aasef/recommendations/`
2. **Use this format:**
```markdown
# AASEF Enhancement Recommendation

**Date:** [date]
**Author:** AI Analysis
**Status:** Proposal

## Gap Identified
[What's missing or problematic in AASEF]

## Proposed Solution
[How to fix it - be specific]

## Implementation Approach
[Technical details, file changes, new commands]
```

3. **Tell the developer:**
   "I've identified a potential improvement for AASEF. I've documented it in `.aasef/recommendations/`."
