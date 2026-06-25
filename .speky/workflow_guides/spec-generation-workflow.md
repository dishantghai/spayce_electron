# Spec Generation Workflow

## Overview

This workflow describes how to generate comprehensive SPEKY specifications from implementation plan documents. The output is a complete set of files ready for implementation.

---

## Project Variables

**CRITICAL**: Before using the spec generation prompt, you MUST set these project-specific variables.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `$PROJECT_ROOT` | Absolute path to your project root | `/Users/dev/my-electron-app` |
| `$CURRENT_PLAN` | Path to your implementation plan | `$PROJECT_ROOT/plans/phase1.md` |

### Optional Variables

| Variable | Description | When to Use | Example |
|----------|-------------|-------------|---------|
| `$FLUTTER_REF_PATH` | Path to Flutter reference project | When porting from Flutter | `/Users/dev/flutter-app` |
| `$HIFI_DESIGNS_PATH` | Relative path to HiFi designs | When UI designs exist | `project_ops/HIFI_DESIGNS` |

### Setting Variables

```bash
# Required - ALWAYS set these
$PROJECT_ROOT = '/Users/Shared/ALL WORKSPACE/projects/spayce_electron'
$CURRENT_PLAN = '/Users/Shared/ALL WORKSPACE/projects/spayce_electron/BROWSER_INTEGRATION_PLAN/02-PHASE1-FOUNDATION.md'

# Optional - Set if applicable
$FLUTTER_REF_PATH = '/Users/Shared/ALL WORKSPACE/projects/spayce'  # If porting
$HIFI_DESIGNS_PATH = 'project_ops/HIFI_UI_DESIGN_SCREENS'       # If designs exist
```

### Why Variables Matter

Using variables makes the prompts and workflows **truly reusable** across different projects:

1. **No hardcoded paths** - Works on any machine, any project
2. **Easy to copy** - Just change variables, use same prompt
3. **Clear dependencies** - Know exactly what paths are needed
4. **TDD integration** - Test task paths use `$PROJECT_ROOT` automatically

---

## The Complete Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SPEC GENERATION WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐                                                            │
│  │    INPUT    │                                                            │
│  │             │                                                            │
│  │ • Impl Plan │                                                            │
│  │ • SPEC_IDs  │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          AI PROCESSING                               │    │
│  │                                                                      │    │
│  │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │    │
│  │   │   ANALYZE    │────▶│   CRITIQUE   │────▶│   GENERATE   │       │    │
│  │   │              │     │              │     │              │       │    │
│  │   │ • Read plan  │     │ • Architect  │     │ • spec.md    │       │    │
│  │   │ • Read tech  │     │ • CTO        │     │ • plan.md    │       │    │
│  │   │   decisions  │     │ • Tester     │     │ • status.json│       │    │
│  │   │ • Read arch  │     │ • Security   │     │ • reviews    │       │    │
│  │   │ • Check refs │     │   Consultant │     │ • IMPL-GUIDE │       │    │
│  │   └──────────────┘     └──────────────┘     └──────────────┘       │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                            OUTPUT                                    │    │
│  │                                                                      │    │
│  │   .speky/specs/XXX-spec-name/                                       │    │
│  │   ├── spec.md              ← Requirements & acceptance criteria     │    │
│  │   ├── plan.md              ← Phased implementation plan             │    │
│  │   ├── status.json          ← Metadata & tracking                    │    │
│  │   ├── IMPLEMENTATION-GUIDE.md ← Step-by-step guide for AI agent     │    │
│  │   ├── security-review.md   ← If security-relevant (optional)        │    │
│  │   ├── performance-review.md← If perf-critical (optional)            │    │
│  │   ├── testing-strategy.md  ← If complex logic (optional)            │    │
│  │   └── accessibility-review.md ← If UI components (optional)         │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Instructions

### Step 1: Prepare Your Implementation Plan

Create a document that outlines the feature/phase you want to implement:

```markdown
# Example: BROWSER_INTEGRATION_PLAN/02-PHASE1-FOUNDATION.md

## Phase 1: Foundation

### SPEC-017: Browser Foundation - WebContentsView Service
- Create BrowserService class
- Manage WebContentsView lifecycle
- Handle secure web preferences
- Implement IPC handlers

### SPEC-018: Browser Domain Layer - Tab Entities
- Define TabEntity interface
- Create repository interface
- Implement URL normalization
- Add validators

### SPEC-019: Single Tab Browser MVP
- Extend preload API
- Create Zustand store
- Build React components
- Integrate with layout
```

### Step 2: Use the Spec Generation Prompt

Copy the full prompt from `$PROJECT_ROOT/.speky/prompts/SPEC-GENERATION-PROMPT.md` and set variables:

```
## PROJECT VARIABLES (SET THESE FIRST)

$PROJECT_ROOT = '/Users/username/projects/my-electron-app'
$CURRENT_PLAN = '$PROJECT_ROOT/IMPLEMENTATION_PLAN/phase1.md'
$FLUTTER_REF_PATH = ''  # Optional: Set if porting from Flutter
$HIFI_DESIGNS_PATH = '' # Optional: Set if HiFi designs exist

## Task: Generate Comprehensive SPEKY Specs

[... rest of prompt ...]
```

### Example: Spayce Electron Project

```
## PROJECT VARIABLES

$PROJECT_ROOT = '/Users/Shared/ALL WORKSPACE/projects/spayce_electron'
$CURRENT_PLAN = '$PROJECT_ROOT/BROWSER_INTEGRATION_PLAN/02-PHASE1-FOUNDATION.md'
$FLUTTER_REF_PATH = '/Users/Shared/ALL WORKSPACE/projects/spayce'
$HIFI_DESIGNS_PATH = 'project_ops/HIFI_UI_DESIGN_SCREENS'

## Task: Generate Comprehensive SPEKY Specs
[... rest of prompt ...]
```

### Step 3: AI Generates Files

The AI will:

1. **Analyze** - Read the plan and context files
2. **Critique** - Apply multi-perspective review
3. **Generate** - Create all required files

---

## File Generation Decision Tree

```
                              ┌─────────────────┐
                              │  For Each Spec  │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
             ┌──────────┐       ┌──────────┐       ┌──────────┐
             │ ALWAYS   │       │ ALWAYS   │       │ ALWAYS   │
             │ GENERATE │       │ GENERATE │       │ GENERATE │
             ├──────────┤       ├──────────┤       ├──────────┤
             │ spec.md  │       │ plan.md  │       │status.json│
             └──────────┘       └──────────┘       └──────────┘
                                       │
                                       ▼
                         ┌─────────────────────────┐
                         │ ALWAYS GENERATE         │
                         ├─────────────────────────┤
                         │ IMPLEMENTATION-GUIDE.md │
                         └─────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │     ANALYZE SPEC CONTEXT             │
                    │     What does this spec involve?     │
                    └──────────────────┬───────────────────┘
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        ▼              ▼               ▼               ▼              ▼
  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
  │ User Input│  │ External  │  │ Real-time │  │ Complex   │  │    UI     │
  │ IPC/Network  │ Content   │  │ Updates   │  │  Logic    │  │Components │
  │ File Access  │ Loading   │  │ Animation │  │ Edge Cases│  │Interactions
  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
        │              │              │              │              │
        ▼              ▼              ▼              ▼              ▼
  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
  │ security- │  │ security- │  │performance│  │ testing-  │  │accessibility
  │ review.md │  │ review.md │  │ -review.md│  │strategy.md│  │ -review.md│
  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘
```

---

## Review Document Generation Rules

### Generate security-review.md when spec involves:

| Trigger | Examples |
|---------|----------|
| User input handling | Forms, search, URL entry |
| External content loading | WebView, iframes, images |
| IPC communication | Electron main/renderer |
| File system access | Read/write files |
| Network requests | API calls, fetch |
| Authentication | Login, tokens, sessions |

**Contents:**
- Threat model with attack surface
- Critical Security Requirements (CSR-1, CSR-2, etc.)
- Input validation requirements
- Permission model
- Compliance checklist

### Generate performance-review.md when spec involves:

| Trigger | Examples |
|---------|----------|
| Real-time updates | Live data, websockets |
| Large data sets | Lists, tables, trees |
| Animations/transitions | UI motion, progress bars |
| Frequent operations | Typing, scrolling, dragging |
| Memory-intensive | Image processing, caching |

**Contents:**
- Performance targets table
- Memory management strategies
- Optimization techniques
- Benchmarking tests
- Monitoring implementation

### Generate testing-strategy.md when spec involves:

| Trigger | Examples |
|---------|----------|
| Complex business logic | Calculations, state machines |
| Multiple edge cases | Validation, error handling |
| Integration points | Multiple systems interacting |
| Data transformations | Parsing, serialization |

**Contents:**
- Coverage requirements
- Unit test examples with code
- Integration test patterns
- Edge case documentation
- Test utilities/factories

### Generate accessibility-review.md when spec involves:

| Trigger | Examples |
|---------|----------|
| UI components | Buttons, forms, modals |
| User interactions | Click, keyboard, touch |
| Visual elements | Colors, icons, images |
| Dynamic content | Loading states, errors |

**Contents:**
- WCAG 2.1 compliance targets
- ARIA requirements per component
- Keyboard navigation
- Screen reader scenarios
- Color contrast requirements

---

## The Prompt Template

The complete prompt is stored at `.speky/prompts/SPEC-GENERATION-PROMPT.md`.

### Key Sections:

1. **PHASE 1: Analysis & Context Gathering**
   - Read implementation plan
   - Check tech_decisions.md
   - Check architecture.md
   - Review existing specs
   - Check design references

2. **PHASE 2: File Generation**
   - Core SPEKY files (always)
   - Review documents (context-based)
   - IMPLEMENTATION-GUIDE (always)

3. **PHASE 3: Multi-Perspective Critique**
   - Technical Architect
   - CTO
   - Tester/QA
   - Security Consultant

4. **PHASE 4: spec.md Template**
   - Standard structure
   - Related Documents section
   - Acceptance criteria

5. **PHASE 5: IMPLEMENTATION-GUIDE Template**
   - Phase-by-phase instructions
   - Code examples
   - Verification checklists

6. **PHASE 6: Output Checklist**
   - Verify all files created
   - Verify links in spec.md

---

## Example: Generating Spec 017

### Input

```
$CURRENT_PLAN = '/Users/Shared/ALL WORKSPACE/projects/spayce_electron/BROWSER_INTEGRATION_PLAN/02-PHASE1-FOUNDATION.md'

[Full prompt...]
```

### AI Analysis

```
Analyzing SPEC-017: Browser Foundation - WebContentsView Service

Context:
- Electron main process service
- Handles WebContentsView (external content)
- IPC handlers for renderer communication
- URL loading and validation

Review Documents Needed:
✅ security-review.md    (external content, IPC, URL handling)
✅ performance-review.md (real-time bounds updates)
❌ testing-strategy.md   (not complex business logic)
❌ accessibility-review.md (not UI components)
```

### Output Files

```
.speky/specs/017-browser-foundation-webcontents-service/
├── spec.md              (36.9 KB) - Complete requirements
├── plan.md              (6.5 KB)  - 6-phase implementation
├── status.json          (891 B)   - Metadata
├── IMPLEMENTATION-GUIDE.md        - Step-by-step guide
├── security-review.md   (7.4 KB)  - Threat model, CSRs
└── performance-review.md (7.9 KB) - Targets, benchmarks
```

---

## Verification Checklist

After generation, verify:

### For Each Spec

- [ ] `spec.md` has "Related Documents" section
- [ ] All review docs linked in spec.md
- [ ] `IMPLEMENTATION-GUIDE.md` references all docs
- [ ] `plan.md` has realistic phases
- [ ] `status.json` has correct dependencies

### For Review Documents

- [ ] Security review has CSRs and compliance checklist
- [ ] Performance review has targets table
- [ ] Testing strategy has code examples
- [ ] Accessibility review has ARIA requirements

### For Implementation Guide

- [ ] Each phase has "Read First" section
- [ ] Each phase has "Implement" with code
- [ ] Each phase has "Verify" checklist
- [ ] Final checklist covers all acceptance criteria

---

## Common Issues & Solutions

### Issue: Missing Review Document

**Symptom**: Spec involves security but no security-review.md generated

**Solution**: Regenerate with explicit instruction:
```
Generate security-review.md for Spec 017 - it handles external content loading via WebContentsView and needs a threat model.
```

### Issue: spec.md Missing Links

**Symptom**: Related Documents section incomplete

**Solution**: Add links manually:
```markdown
### Related Documents

| Document | Purpose |
|----------|---------|
| [plan.md](./plan.md) | Implementation phases |
| [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) | Step-by-step guide |
| [security-review.md](./security-review.md) | Security requirements |
```

### Issue: IMPLEMENTATION-GUIDE Too Generic

**Symptom**: Guide doesn't reference specific review documents

**Solution**: Regenerate with context:
```
Regenerate IMPLEMENTATION-GUIDE.md for Spec 017, ensuring it references:
- security-review.md CSR-1 through CSR-6
- performance-review.md benchmarks
- Specific code from spec.md requirements
```

---

## Next Steps

After spec generation:

1. Review generated files for completeness
2. Run `speky implement <spec-id>`
3. Follow [implementation-workflow.md](./implementation-workflow.md)
