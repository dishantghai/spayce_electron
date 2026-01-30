# Implementation Workflow

## Overview

This workflow describes how to implement AASEF specifications using the IMPLEMENTATION-GUIDE.md file. The guide serves as the primary navigation document that directs the AI coding agent through all spec and review documents.

---

## Project Variables

Before starting, ensure you know your project root:

```bash
$PROJECT_ROOT = '[YOUR_PROJECT_PATH]'
# Example: /Users/username/projects/my-electron-app
```

All paths in this workflow are relative to `$PROJECT_ROOT`.

---

## The Implementation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IMPLEMENTATION WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      STEP 1: INITIATE                                │    │
│  │                                                                      │    │
│  │   $ aasef implement 017              # Standard mode                │    │
│  │   or                                                                 │    │
│  │   $ aasef implement 017 --tdd        # TDD mode (generates test task)│   │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   STEP 1.5: TDD MODE DETECTION                       │    │
│  │                                                                      │    │
│  │   Check if TDD test task exists:                                    │    │
│  │   $PROJECT_ROOT/.aasef/testing/tasks/T017-tdd/test_task.md          │    │
│  │                                                                      │    │
│  │   ┌─────────────┐                    ┌─────────────┐                │    │
│  │   │ FILE EXISTS │                    │FILE MISSING │                │    │
│  │   │             │                    │             │                │    │
│  │   │ TDD MODE    │                    │STANDARD MODE│                │    │
│  │   │ ACTIVE      │                    │             │                │    │
│  │   └──────┬──────┘                    └──────┬──────┘                │    │
│  │          │                                  │                        │    │
│  │          ▼                                  ▼                        │    │
│  │   Read test_task.md                  Skip to Step 2                 │    │
│  │   FIRST                                                              │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      STEP 2: PROMPT AI                               │    │
│  │                                                                      │    │
│  │   STANDARD MODE:                                                    │    │
│  │   @.aasef/specs/017-browser-foundation-webcontents-service/         │    │
│  │     IMPLEMENTATION-GUIDE.md                                         │    │
│  │                                                                      │    │
│  │   TDD MODE:                                                         │    │
│  │   @.aasef/testing/tasks/T017-tdd/test_task.md                       │    │
│  │   @.aasef/specs/017-browser-foundation-webcontents-service/         │    │
│  │     IMPLEMENTATION-GUIDE.md                                         │    │
│  │                                                                      │    │
│  │   Follow this guide to implement the spec.                          │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      STEP 3: AI FOLLOWS GUIDE                        │    │
│  │                                                                      │    │
│  │   ┌─────────────────────────────────────────────────────────────┐   │    │
│  │   │  IMPLEMENTATION-GUIDE.md (+ test_task.md if TDD)             │   │    │
│  │   │                                                              │   │    │
│  │   │  Phase 1: [Name]                                            │   │    │
│  │   │  ├─ Read First: spec.md R1.1, security-review.md CSR-1      │   │    │
│  │   │  ├─ [TDD] Write tests from test_task.md Phase 1             │   │    │
│  │   │  ├─ Implement: [code with references]                       │   │    │
│  │   │  └─ Verify: [checklist] + [TDD] tests pass                  │   │    │
│  │   │                                                              │   │    │
│  │   │  Phase 2: [Name]                                            │   │    │
│  │   │  ├─ Read First: ...                                         │   │    │
│  │   │  ├─ [TDD] Write tests from test_task.md Phase 2             │   │    │
│  │   │  ├─ Implement: ...                                          │   │    │
│  │   │  └─ Verify: ... + [TDD] tests pass                          │   │    │
│  │   │                                                              │   │    │
│  │   │  [... more phases ...]                                       │   │    │
│  │   │                                                              │   │    │
│  │   │  Final Checklist: [all criteria] + [TDD] all tests pass     │   │    │
│  │   └─────────────────────────────────────────────────────────────┘   │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      STEP 4: COMPLETE                                │    │
│  │                                                                      │    │
│  │   $ pnpm test                    # Verify ALL tests pass            │    │
│  │   $ aasef complete 017           # Mark as complete                 │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Steps

### Step 1: Initiate Implementation

```bash
# Standard implementation
aasef implement 017

# Test-driven development mode (generates test_task.md)
aasef implement 017 --tdd
```

This command:
- Marks the spec as "in_progress"
- Prepares the context for implementation
- **If --tdd flag**: Generates test task file at `$PROJECT_ROOT/.aasef/testing/tasks/T017-tdd/test_task.md`

### Step 1.5: TDD Mode Detection

**CRITICAL**: Before prompting the AI, check if TDD mode is active:

```bash
# Check if TDD test task file exists
ls $PROJECT_ROOT/.aasef/testing/tasks/T<SPEC_ID>-tdd/test_task.md

# Example for Spec 017:
ls $PROJECT_ROOT/.aasef/testing/tasks/T017-tdd/test_task.md
```

**TDD Task File Path Pattern:**
```
$PROJECT_ROOT/.aasef/testing/tasks/T<SPEC_ID>-tdd/test_task.md
```

| Spec ID | TDD Task Path |
|---------|---------------|
| 017 | `.aasef/testing/tasks/T017-tdd/test_task.md` |
| 018 | `.aasef/testing/tasks/T018-tdd/test_task.md` |
| 019 | `.aasef/testing/tasks/T019-tdd/test_task.md` |

### Step 2: Prompt the AI Coding Agent

#### Standard Mode (No TDD)

**Option A: Full Path Reference**
```
@$PROJECT_ROOT/.aasef/specs/017-browser-foundation-webcontents-service/IMPLEMENTATION-GUIDE.md

Follow this guide to implement the spec.
```

**Option B: Simple Reference (if AI has context)**
```
@IMPLEMENTATION-GUIDE.md - Implement Spec 017 following this guide.
```

**Option C: Detailed Prompt**
```
Implement Spec 017: Browser Foundation - WebContentsView Service

Read @.aasef/specs/017-browser-foundation-webcontents-service/IMPLEMENTATION-GUIDE.md 
and follow it step-by-step.

The IMPLEMENTATION-GUIDE.md will direct you to:
- Which sections of spec.md to read
- Which review documents to consult
- What to implement in each phase
- How to verify your implementation

Start with Phase 1.
```

#### TDD Mode (test_task.md exists)

**Option A: Full TDD Prompt**
```
Implement Spec 017: Browser Foundation - WebContentsView Service in TDD MODE

1. FIRST read the TDD test task:
   @$PROJECT_ROOT/.aasef/testing/tasks/T017-tdd/test_task.md

2. THEN read the implementation guide:
   @$PROJECT_ROOT/.aasef/specs/017-browser-foundation-webcontents-service/IMPLEMENTATION-GUIDE.md

TDD REQUIREMENTS:
- Write failing tests FIRST from test_task.md
- Implement code to make tests pass
- Refactor while keeping tests green
- Verify all tests pass before next phase

Start with Phase 1 tests.
```

**Option B: Simple TDD Reference**
```
@test_task.md + @IMPLEMENTATION-GUIDE.md

Implement Spec 017 in TDD mode. Tests first, then implementation.
```

### Step 3: AI Follows the Guide

The IMPLEMENTATION-GUIDE.md provides structured phases:

```
┌────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION GUIDE STRUCTURE                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 1: [Phase Name] (Day X)                                    │   │
│  │                                                                  │   │
│  │ ┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │   │
│  │ │  READ FIRST  │──▶│  IMPLEMENT   │──▶│   VERIFY     │         │   │
│  │ │              │   │              │   │              │         │   │
│  │ │ • spec.md    │   │ • Code with  │   │ • Checklist  │         │   │
│  │ │   section    │   │   comments   │   │   items from │         │   │
│  │ │ • review doc │   │   pointing   │   │   spec.md &  │         │   │
│  │ │   section    │   │   to sources │   │   reviews    │         │   │
│  │ └──────────────┘   └──────────────┘   └──────────────┘         │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 2: [Phase Name] (Day X)                                    │   │
│  │ [same structure...]                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│                              [...]                                      │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ FINAL CHECKLIST                                                  │   │
│  │                                                                  │   │
│  │ From spec.md Acceptance Criteria:                               │   │
│  │ - [ ] Criterion 1                                               │   │
│  │ - [ ] Criterion 2                                               │   │
│  │                                                                  │   │
│  │ From security-review.md (if applicable):                        │   │
│  │ - [ ] CSR-1 compliance                                          │   │
│  │ - [ ] CSR-2 compliance                                          │   │
│  │                                                                  │   │
│  │ From performance-review.md (if applicable):                     │   │
│  │ - [ ] Benchmark 1 met                                           │   │
│  │ - [ ] Benchmark 2 met                                           │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Step 4: Complete Implementation

```bash
# Run tests to verify implementation
pnpm test

# Mark spec as complete (runs validation)
aasef complete 017
```

---

## How the AI Uses Documents

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DOCUMENT NAVIGATION DURING IMPLEMENTATION                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         ┌────────────────────┐                              │
│                         │ IMPLEMENTATION-    │                              │
│                         │ GUIDE.md           │                              │
│                         │                    │                              │
│                         │ "Phase 1:          │                              │
│                         │  Read spec.md R1.1 │                              │
│                         │  Read security CSR1│                              │
│                         │  Implement [code]  │                              │
│                         │  Verify [list]"    │                              │
│                         └─────────┬──────────┘                              │
│                                   │                                          │
│               ┌───────────────────┼───────────────────┐                     │
│               │                   │                   │                     │
│               ▼                   ▼                   ▼                     │
│      ┌─────────────┐     ┌─────────────┐     ┌─────────────┐               │
│      │  spec.md    │     │ security-   │     │ performance │               │
│      │             │     │ review.md   │     │ -review.md  │               │
│      │ R1.1: Req   │     │             │     │             │               │
│      │ Details     │     │ CSR-1: Full │     │ Targets &   │               │
│      │             │     │ threat model│     │ benchmarks  │               │
│      └──────┬──────┘     └──────┬──────┘     └──────┬──────┘               │
│             │                   │                   │                       │
│             └───────────────────┴───────────────────┘                       │
│                                 │                                           │
│                                 ▼                                           │
│                    ┌────────────────────────┐                              │
│                    │    AI SYNTHESIZES      │                              │
│                    │                        │                              │
│                    │ Combines requirements  │                              │
│                    │ from all sources into  │                              │
│                    │ implementation code    │                              │
│                    └────────────────────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Example: Implementing Spec 017

### Prompt to AI

```
@.aasef/specs/017-browser-foundation-webcontents-service/IMPLEMENTATION-GUIDE.md

Follow this guide to implement the spec. Start with Phase 1.
```

### AI Processing

**Phase 1: Setup**

AI reads IMPLEMENTATION-GUIDE.md:
```markdown
## Phase 1: Setup (Day 1 Morning)

### Read First
1. spec.md - Section R1.1
2. security-review.md - CSR-1

### Implement
[code example]

### Verify
- [ ] Secure web preferences applied
```

AI then:
1. Reads `spec.md` R1.1 for WebContentsView requirements
2. Reads `security-review.md` CSR-1 for security hardening
3. Implements code with both sources combined:

```typescript
// From spec.md R1.1: Create WebContentsView
// From security-review.md CSR-1: Security settings
const view = new WebContentsView({
  webPreferences: {
    nodeIntegration: false,        // CSR-1: MANDATORY
    contextIsolation: true,         // CSR-1: MANDATORY
    sandbox: true,                  // CSR-1: MANDATORY
    webSecurity: true,              // CSR-1: Web security
  },
});
```

4. Verifies against checklist

### Continue Through Phases

AI continues with Phase 2, 3, etc., following the same pattern.

### Final Verification

AI uses final checklist:
```markdown
## Checklist Before Completion

### From spec.md Acceptance Criteria
- [x] BrowserService initializes with main window
- [x] Service prevents double initialization
- [x] Secure web preferences applied
...

### From security-review.md
- [x] nodeIntegration: false verified in tests
- [x] contextIsolation: true verified in tests
...
```

---

## Prompting Patterns

### Pattern 1: Single Phase Focus

When you want to focus on one phase:

```
Continue implementing Spec 017. 

I've completed Phase 1. Now move to Phase 2 as described in 
@IMPLEMENTATION-GUIDE.md

Follow the "Read First", "Implement", "Verify" pattern.
```

### Pattern 2: Review-Specific Focus

When implementing security-critical code:

```
Implement Phase 2 of Spec 017 with special attention to 
security-review.md CSR-2 (URL Scheme Allowlist).

Reference @IMPLEMENTATION-GUIDE.md Phase 2 section.
```

### Pattern 3: Testing Focus (Standard Mode)

When focusing on tests without full TDD:

```
Implement Spec 018 following @IMPLEMENTATION-GUIDE.md

For each phase, write tests FIRST based on testing-strategy.md,
then implement to make tests pass.
```

### Pattern 4: TDD Mode - Full Cycle

When using TDD mode with test_task.md:

```
Implement Phase 1 of Spec 017 in TDD MODE.

1. Read @.aasef/testing/tasks/T017-tdd/test_task.md Phase 1 section
2. Write ALL failing tests for Phase 1
3. Run tests (should fail)
4. Read @IMPLEMENTATION-GUIDE.md Phase 1 for implementation guidance
5. Implement code to make tests pass
6. Run tests (should pass)
7. Refactor if needed while keeping tests green

Show me the tests first before implementation.
```

### Pattern 5: TDD Mode - Red-Green-Refactor

Explicit Red-Green-Refactor cycle:

```
TDD Cycle for Spec 017 Phase 2:

RED PHASE:
- Read test_task.md Phase 2 requirements
- Write failing tests
- Confirm tests fail

GREEN PHASE:
- Read IMPLEMENTATION-GUIDE.md Phase 2
- Write minimal code to pass tests
- Confirm tests pass

REFACTOR PHASE:
- Improve code quality
- Keep tests passing
- Apply patterns from review docs

Execute this cycle now.
```

### Pattern 6: Verification Focus

When nearing completion:

```
Review Spec 017 implementation against the "Checklist Before Completion"
in @IMPLEMENTATION-GUIDE.md

Verify all items and report any gaps.
```

### Pattern 7: TDD Verification

When verifying TDD completion:

```
Verify TDD completion for Spec 017:

1. All tests from test_task.md are implemented
2. All tests are passing
3. Test coverage meets requirements from test_task.md
4. No skipped or pending tests
5. IMPLEMENTATION-GUIDE.md TDD verification checklist complete

Run full test suite and report status.
```

---

## Handling Multi-Spec Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPENDENCY IMPLEMENTATION ORDER                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Spec 017: Browser Service        Spec 018: Domain Layer                   │
│   ┌─────────────────────┐          ┌─────────────────────┐                  │
│   │ No dependencies     │          │ Depends on 007-009  │                  │
│   │ (just 001, 007-009) │          │ (entity patterns)   │                  │
│   └──────────┬──────────┘          └──────────┬──────────┘                  │
│              │                                │                              │
│              │  Can implement in parallel     │                              │
│              │◀───────────────────────────────▶                              │
│              │                                │                              │
│              └────────────────┬───────────────┘                              │
│                               │                                              │
│                               ▼                                              │
│                  ┌─────────────────────┐                                    │
│                  │ Spec 019: MVP       │                                    │
│                  │                     │                                    │
│                  │ Depends on 017, 018 │                                    │
│                  │ (MUST complete both │                                    │
│                  │  before starting)   │                                    │
│                  └─────────────────────┘                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Prompt for dependency-aware implementation:**

```
Implement Spec 019: Single Tab Browser MVP

Prerequisites verified:
- Spec 017: ✅ Complete
- Spec 018: ✅ Complete

Follow @.aasef/specs/019-single-tab-browser-mvp/IMPLEMENTATION-GUIDE.md
```

---

## Troubleshooting

### Issue: AI Not Following Guide

**Symptom**: AI implements without referencing review documents

**Solution**: Be explicit:
```
You MUST follow IMPLEMENTATION-GUIDE.md exactly.

For each phase:
1. First read the "Read First" documents listed
2. Then implement using code examples as reference
3. Verify against the checklist before proceeding

Do not skip any read steps.
```

### Issue: Missing Implementation Details

**Symptom**: AI stuck on how to implement something

**Solution**: Direct to specific section:
```
For URL validation implementation, check:
1. spec.md R1.2 for requirements
2. security-review.md CSR-2 for detailed implementation code
3. IMPLEMENTATION-GUIDE.md Phase 2 for synthesis
```

### Issue: Verification Failures

**Symptom**: Tests failing after implementation

**Solution**: Verify against all sources:
```
Implementation of [feature] is failing tests.

Check against:
1. spec.md acceptance criteria for [feature]
2. testing-strategy.md for expected behavior
3. IMPLEMENTATION-GUIDE.md verify checklist

Report any discrepancies.
```

---

## TDD Mode Reference

### TDD Task File Location

```
$PROJECT_ROOT/.aasef/testing/tasks/T<SPEC_ID>-tdd/test_task.md
```

### TDD Mode Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TDD MODE FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  For Each Phase:                                                            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         1. RED PHASE                                 │    │
│  │                                                                      │    │
│  │   Read test_task.md Phase N ──▶ Write Failing Tests ──▶ Run Tests   │    │
│  │                                                          (FAIL ✗)   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        2. GREEN PHASE                                │    │
│  │                                                                      │    │
│  │   Read IMPL-GUIDE Phase N ──▶ Implement Code ──▶ Run Tests          │    │
│  │   + Review Docs                                  (PASS ✓)           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       3. REFACTOR PHASE                              │    │
│  │                                                                      │    │
│  │   Improve Code Quality ──▶ Apply Patterns ──▶ Run Tests             │    │
│  │   (Keep Tests Green)       from Reviews       (PASS ✓)              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│                              Next Phase or Done                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### TDD vs Standard Mode Comparison

| Aspect | Standard Mode | TDD Mode |
|--------|---------------|----------|
| **Test Task File** | Not present | Present at `T<ID>-tdd/test_task.md` |
| **Test Writing** | After implementation | BEFORE implementation |
| **Primary Guide** | IMPLEMENTATION-GUIDE.md | test_task.md + IMPLEMENTATION-GUIDE.md |
| **Phase Order** | Read → Implement → Verify | Read → Tests → Implement → Verify |
| **Verification** | Checklist + optional tests | All tests MUST pass |

---

## Completion Checklist

Before running `aasef complete`:

### Standard Mode Checklist

- [ ] All phases in IMPLEMENTATION-GUIDE.md completed
- [ ] All acceptance criteria in spec.md met
- [ ] All security requirements verified (if applicable)
- [ ] All performance benchmarks met (if applicable)
- [ ] All accessibility requirements verified (if applicable)
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Build succeeds

### TDD Mode Additional Checklist

- [ ] All tests from test_task.md implemented
- [ ] All tests passing (no skipped/pending)
- [ ] Test coverage meets requirements from test_task.md
- [ ] IMPLEMENTATION-GUIDE.md TDD verification checklist complete
- [ ] Red-Green-Refactor cycle documented (if required)

```bash
# Final verification
pnpm build
pnpm test
pnpm lint

# Check test coverage (TDD mode)
pnpm test -- --coverage

# Mark complete
aasef complete 017
```
