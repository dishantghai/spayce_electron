# Comprehensive SPEKY Spec Generation Prompt

## Usage

Copy the prompt below and set the required variables for your project.

---

## REQUIRED VARIABLES

Before using this prompt, set these variables for your project:

```bash
# REQUIRED - Must be set for every project
$PROJECT_ROOT = '[ABSOLUTE_PATH_TO_PROJECT]'
# Example: '/Users/username/projects/my-electron-app'

$CURRENT_PLAN = '[PATH_TO_IMPLEMENTATION_PLAN.md]'
# Example: '$PROJECT_ROOT/IMPLEMENTATION_PLAN/phase1.md'

# OPTIONAL - Set if applicable to your project
$FLUTTER_REF_PATH = '[PATH_TO_FLUTTER_PROJECT]'  # If porting from Flutter
# Example: '/Users/username/projects/my-flutter-app'

$HIFI_DESIGNS_PATH = '[RELATIVE_PATH_TO_DESIGNS]'  # If HiFi designs exist
# Example: 'project_ops/HIFI_UI_DESIGN_SCREENS'
```

### Variable Reference Table

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `$PROJECT_ROOT` | ✅ Yes | Absolute path to project root | `/Users/dev/myproject` |
| `$CURRENT_PLAN` | ✅ Yes | Path to implementation plan | `$PROJECT_ROOT/plans/phase1.md` |
| `$FLUTTER_REF_PATH` | ❌ No | Flutter project for reference | `/Users/dev/flutter-app` |
| `$HIFI_DESIGNS_PATH` | ❌ No | HiFi design screens folder | `project_ops/HIFI_DESIGNS` |

---

## THE PROMPT

```
## PROJECT VARIABLES (SET THESE FIRST)

$PROJECT_ROOT = '/Users/Shared/ALL WORKSPACE/projects/spayce_electron'
$CURRENT_PLAN = '/Users/Shared/ALL WORKSPACE/projects/spayce_electron/BROWSER_INTEGRATION_PLAN/02-PHASE1-FOUNDATION.md'
$FLUTTER_REF_PATH = '/Users/Shared/ALL WORKSPACE/projects/spayce'  # Optional: Set if porting from Flutter
$HIFI_DESIGNS_PATH = '/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS' # Optional: Set if HiFi designs exist

## Task: Generate Comprehensive SPEKY Specs

Analyze $CURRENT_PLAN and create **production-grade SPEKY specifications** for each SPEC_ID identified in the plan.

---

### PHASE 1: Analysis & Context Gathering

1. Read $CURRENT_PLAN to identify all SPEC_IDs
2. Read `$PROJECT_ROOT/.speky/context/tech_decisions.md` for technology constraints
3. Read `$PROJECT_ROOT/.speky/context/architecture.md` for architectural patterns
4. Read existing specs in `$PROJECT_ROOT/.speky/specs/` to understand conventions
5. If $HIFI_DESIGNS_PATH is set, check `$PROJECT_ROOT/$HIFI_DESIGNS_PATH/` for design references
6. If $FLUTTER_REF_PATH is set, check that path for reference implementation

---

### PHASE 2: For Each SPEC_ID, Generate These Files

#### A. Core SPEKY Files (REQUIRED)

1. **spec.md** - Complete specification
   - Overview with dependencies
   - User stories with acceptance criteria
   - MVP scope definition
   - Detailed requirements with code examples
   - Non-functional requirements
   - File structure
   - Acceptance criteria checklist
   - **CRITICAL**: Include "Related Documents" section linking all generated files

2. **plan.md** - Implementation plan
   - Phased breakdown (e.g., Day 1 Morning, Day 1 Afternoon)
   - Specific tasks per phase
   - Verification checkpoints
   - Estimated duration

3. **status.json** - Metadata
   - id, title, status ("pending")
   - priority, dependencies, blocks
   - estimated_duration, complexity, risk_level
   - tags, references (HiFi designs, Flutter code)

#### B. Review Documents (GENERATE BASED ON CONTEXT)

Analyze the spec requirements and generate APPLICABLE review documents:

4. **security-review.md** (if spec involves):
   - User input handling
   - External content loading
   - IPC communication
   - File system access
   - Network requests
   - Authentication/authorization
   
   Contents:
   - Threat model with attack surface analysis
   - Critical Security Requirements (CSR-1, CSR-2, etc.)
   - Input validation requirements
   - Permission security model
   - Rate limiting requirements
   - Compliance checklist

5. **performance-review.md** (if spec involves):
   - Real-time updates
   - Large data sets
   - Animations/transitions
   - Frequent operations
   - Memory-intensive operations
   
   Contents:
   - Performance targets table (metric, target, acceptable, critical)
   - Memory management strategies
   - Optimization techniques (throttling, batching, caching)
   - Benchmarking test examples
   - Monitoring implementation

6. **testing-strategy.md** (if spec involves):
   - Complex business logic
   - Multiple edge cases
   - Integration with other systems
   
   Contents:
   - Coverage requirements table
   - Unit test examples with code
   - Integration test patterns
   - Edge case documentation
   - Test utilities/factories
   - Mock patterns

7. **accessibility-review.md** (if spec involves):
   - UI components
   - User interactions
   - Visual elements
   
   Contents:
   - WCAG 2.1 compliance targets
   - ARIA requirements per component
   - Keyboard navigation requirements
   - Screen reader testing scenarios
   - Color contrast requirements
   - Reduced motion support
   - High contrast mode support

#### C. Implementation Guide (ALWAYS GENERATE)

8. **IMPLEMENTATION-GUIDE.md** - Step-by-step implementation instructions
   
   Contents:
   - Phase-by-phase implementation flow
   - For each phase:
     - "Read in this order" list (which files to read)
     - "Implement" section with code examples
     - "Verify" section with checklist items
   - Quick reference table (when to consult each document)
   - Common implementation patterns
   - Checklist before marking complete

---

### PHASE 3: Multi-Perspective Critique

For each spec, critique from these perspectives and ENHANCE the spec:

#### Technical Architect
- Clean Architecture adherence
- Separation of concerns
- Dependency injection patterns
- Interface design
- Scalability considerations

#### CTO
- Implementation feasibility
- Resource estimation accuracy
- Risk assessment
- Dependency management
- Future extensibility

#### Tester/QA
- Testability of requirements
- Edge case coverage
- Test data requirements
- Integration test scenarios
- Regression prevention

#### Security Consultant
- Threat modeling completeness
- Input validation coverage
- Permission management
- Data protection
- Audit logging

---

### PHASE 4: Spec.md Structure Template

Use this structure for every spec.md:

```markdown
# Spec [NUMBER]: [Title]

## Overview
[Description]

### Dependencies
- Spec XXX: [Name] - [Why needed]

### Related Documents
- [plan.md](./plan.md) - Implementation phases
- [status.json](./status.json) - Metadata and tracking
- [security-review.md](./security-review.md) - Security requirements (if applicable)
- [performance-review.md](./performance-review.md) - Performance targets (if applicable)
- [testing-strategy.md](./testing-strategy.md) - Test patterns (if applicable)
- [accessibility-review.md](./accessibility-review.md) - A11y requirements (if applicable)
- [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) - Step-by-step guide

### TDD Test Task (if --tdd mode)
> **Note**: If `speky implement <spec-id> --tdd` was run, check for:
> `$PROJECT_ROOT/.speky/testing/tasks/T<SPEC_ID>-tdd/test_task.md`
> 
> If this file exists, follow TDD approach: Write tests FIRST, then implement.

### References
- HiFi Design: `$PROJECT_ROOT/$HIFI_DESIGNS_PATH/[file].png` (if $HIFI_DESIGNS_PATH set)
- Flutter Reference: `$FLUTTER_REF_PATH/[path/to/file.dart]` (if $FLUTTER_REF_PATH set)

## User Stories
[Stories with acceptance criteria]

## MVP Scope
### In Scope
### Out of Scope
### Future Considerations

## Requirements

### R1: [Requirement Group]
[Detailed requirements with code examples]

### Security Requirements
> See [security-review.md](./security-review.md) for complete threat model

**Critical Requirements (from security review):**
- [ ] CSR-1: [Brief description]
- [ ] CSR-2: [Brief description]

### Performance Requirements
> See [performance-review.md](./performance-review.md) for optimization strategies

**Targets:**
| Metric | Target | Acceptable |
|--------|--------|------------|
| [metric] | <Xms | <Yms |

### Accessibility Requirements (if UI)
> See [accessibility-review.md](./accessibility-review.md) for WCAG guidelines

**Requirements:**
- [ ] ARIA attributes for [components]
- [ ] Keyboard navigation for [interactions]

## Non-Functional Requirements
[NFR-1, NFR-2, etc.]

## File Structure
[Tree structure of files to create]

## Acceptance Criteria

### Functionality
- [ ] [Criterion 1]

### Security (from security-review.md)
- [ ] [Security criterion 1]

### Performance (from performance-review.md)
- [ ] [Performance criterion 1]

### Accessibility (from accessibility-review.md)
- [ ] [A11y criterion 1]

### Testing (from testing-strategy.md)
- [ ] [Coverage criterion 1]

## Testing Strategy
> See [testing-strategy.md](./testing-strategy.md) for detailed test examples

[Summary of testing approach]

## Tech Decisions Update
[What to add to tech_decisions.md after completion]
```

---

### PHASE 5: IMPLEMENTATION-GUIDE.md Template

Use this structure for every IMPLEMENTATION-GUIDE.md:

```markdown
# Implementation Guide: Spec [NUMBER]

## How to Use This Guide

This guide provides step-by-step instructions for implementing this spec.
The AI coding agent should read this file first, then follow the phases.

---

## TDD Mode Detection

> **IMPORTANT**: Before starting implementation, check if TDD mode is active:
>
> ```
> TDD_TASK_PATH = $PROJECT_ROOT/.speky/testing/tasks/T[SPEC_ID]-tdd/test_task.md
> ```
>
> **If this file EXISTS:**
> - TDD mode is ACTIVE
> - Read test_task.md FIRST before each phase
> - Write tests BEFORE implementation code
> - Follow Red-Green-Refactor cycle
>
> **If this file does NOT exist:**
> - Standard implementation mode
> - Follow phases as documented below

---

## Quick Reference

| Document | Consult When... |
|----------|----------------|
| spec.md | Always - primary requirements |
| plan.md | Starting each phase |
| test_task.md | TDD mode - test requirements (if exists) |
| security-review.md | [specific scenarios] |
| performance-review.md | [specific scenarios] |
| testing-strategy.md | Writing tests |
| accessibility-review.md | Building UI components |

---

## Phase 1: [Name] (Day X)

### Read First
1. spec.md - Section [X]
2. [review-doc].md - Section [Y]
3. **IF TDD MODE**: test_task.md - Phase 1 test requirements

### Implement (Standard Mode)
```typescript
// Code example showing synthesis of spec + review requirements
// Include comments pointing to source: "From spec.md R1.1", "From CSR-2"
```

### Implement (TDD Mode)
```typescript
// 1. FIRST: Write failing tests from test_task.md
// 2. THEN: Implement code to make tests pass
// 3. FINALLY: Refactor while keeping tests green
```

### Verify
- [ ] [Acceptance criterion from spec.md]
- [ ] [Requirement from review doc]
- [ ] **IF TDD MODE**: All tests from test_task.md Phase 1 passing

---

## Phase 2: [Name] (Day X)
[Repeat pattern with TDD checks]

---

## Checklist Before Completion

### From spec.md Acceptance Criteria
- [ ] [All items]

### From security-review.md (if applicable)
- [ ] [Compliance items]

### From performance-review.md (if applicable)
- [ ] [Benchmark items]

### From accessibility-review.md (if applicable)
- [ ] [WCAG items]

### From testing-strategy.md
- [ ] [Coverage items]

### TDD Mode Verification (if test_task.md exists)
- [ ] All tests from test_task.md are passing
- [ ] Test coverage meets requirements
- [ ] No skipped or pending tests

---

## Common Patterns

### Pattern 1: [Name]
[Code example with explanation]

### Pattern 2: [Name]
[Code example with explanation]

### TDD Pattern: Red-Green-Refactor
```typescript
// 1. RED: Write a failing test
it('should [expected behavior]', () => {
  // Test code that will fail
});

// 2. GREEN: Write minimal code to pass
function implementation() {
  // Minimal implementation
}

// 3. REFACTOR: Improve while keeping tests green
function improvedImplementation() {
  // Cleaner, optimized code
}
```
```

---

### PHASE 6: Output Checklist

For each SPEC_ID, confirm these files are generated:

- [ ] `$PROJECT_ROOT/.speky/specs/[id]-[name]/spec.md`
- [ ] `$PROJECT_ROOT/.speky/specs/[id]-[name]/plan.md`
- [ ] `$PROJECT_ROOT/.speky/specs/[id]-[name]/status.json`
- [ ] `$PROJECT_ROOT/.speky/specs/[id]-[name]/IMPLEMENTATION-GUIDE.md`
- [ ] `$PROJECT_ROOT/.speky/specs/[id]-[name]/security-review.md` (if applicable)
- [ ] `$PROJECT_ROOT/.speky/specs/[id]-[name]/performance-review.md` (if applicable)
- [ ] `$PROJECT_ROOT/.speky/specs/[id]-[name]/testing-strategy.md` (if applicable)
- [ ] `$PROJECT_ROOT/.speky/specs/[id]-[name]/accessibility-review.md` (if applicable)

Confirm spec.md has "Related Documents" section linking all files.
Confirm IMPLEMENTATION-GUIDE.md has TDD Mode Detection section.

---

### Execution Instructions

1. This is a LONG-RUNNING DEEP WORK task
2. Do NOT stop until ALL specs are complete with ALL required files
3. Do NOT skip review documents - analyze each spec's context
4. Do NOT create empty/placeholder review docs - each must be comprehensive
5. Synthesize requirements from $CURRENT_PLAN, tech_decisions.md, and reference implementations
6. Apply multi-perspective critique to ENHANCE specs, not just document
7. Use $PROJECT_ROOT variable for all absolute paths
8. IMPLEMENTATION-GUIDE.md MUST include TDD Mode Detection section
```

---

## After Spec Generation: Implementation Prompt

Once specs are generated, use this prompt for implementation:

### Standard Implementation Mode

```
Implement Spec [NUMBER]: [Name]

Read @$PROJECT_ROOT/.speky/specs/[id]-[name]/IMPLEMENTATION-GUIDE.md and follow it step-by-step.

The IMPLEMENTATION-GUIDE.md will direct you to:
- Which sections of spec.md to read
- Which review documents to consult
- What to implement in each phase
- How to verify your implementation

Start with Phase 1.
```

### TDD Implementation Mode

After running `speky implement [SPEC_ID] --tdd`:

```
Implement Spec [NUMBER]: [Name] in TDD MODE

1. FIRST check for TDD test task:
   @$PROJECT_ROOT/.speky/testing/tasks/T[SPEC_ID]-tdd/test_task.md

2. THEN read implementation guide:
   @$PROJECT_ROOT/.speky/specs/[id]-[name]/IMPLEMENTATION-GUIDE.md

TDD MODE REQUIREMENTS:
- Read test_task.md BEFORE each phase
- Write failing tests FIRST
- Implement code to make tests pass
- Refactor while keeping tests green
- Verify all tests pass before moving to next phase

Start with Phase 1 tests from test_task.md.
```

### Simple Reference (if AI has context)

```
@IMPLEMENTATION-GUIDE.md - Follow this guide to implement the spec.
```

### TDD Simple Reference

```
@IMPLEMENTATION-GUIDE.md + @test_task.md - Implement in TDD mode, tests first.
```

---

## TDD Task File Structure

When `speky implement <spec-id> --tdd` is run, a test task file is generated at:

```
$PROJECT_ROOT/.speky/testing/tasks/T<SPEC_ID>-tdd/test_task.md
```

This file contains:
- Test requirements for each implementation phase
- Expected test coverage targets
- Test file locations and naming conventions
- Specific test cases to implement

The IMPLEMENTATION-GUIDE.md automatically detects this file and adjusts the workflow accordingly.
