# Review Integration Workflow

## Overview

This document explains how security, performance, accessibility, and testing review documents integrate with AASEF specifications and are used during implementation.

---

## The Review Document System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REVIEW DOCUMENT ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────────┐                                │
│                              │   spec.md   │                                │
│                              │             │                                │
│                              │ WHAT to     │                                │
│                              │ implement   │                                │
│                              │             │                                │
│                              │ • Require-  │                                │
│                              │   ments     │                                │
│                              │ • Accept-   │                                │
│                              │   ance      │                                │
│                              │   criteria  │                                │
│                              └──────┬──────┘                                │
│                                     │                                        │
│                                     │ Links to                               │
│                                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        REVIEW DOCUMENTS                               │   │
│  │                        HOW to implement correctly                     │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  security-  │  │ performance │  │  testing-   │  │accessibility│  │   │
│  │  │  review.md  │  │ -review.md  │  │ strategy.md │  │ -review.md  │  │   │
│  │  │             │  │             │  │             │  │             │  │   │
│  │  │ • Threat    │  │ • Targets   │  │ • Coverage  │  │ • WCAG      │  │   │
│  │  │   model     │  │ • Optimize  │  │ • Examples  │  │ • ARIA      │  │   │
│  │  │ • CSRs      │  │ • Benchmark │  │ • Patterns  │  │ • Keyboard  │  │   │
│  │  │ • Checklist │  │ • Monitor   │  │ • Factories │  │ • Screen    │  │   │
│  │  │             │  │             │  │             │  │   reader    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                                       │   │
│  └───────────────────────────────┬───────────────────────────────────────┘   │
│                                  │                                           │
│                                  │ Referenced by                             │
│                                  ▼                                           │
│                       ┌─────────────────────┐                               │
│                       │ IMPLEMENTATION-     │                               │
│                       │ GUIDE.md            │                               │
│                       │                     │                               │
│                       │ WHEN to use each    │                               │
│                       │ document during     │                               │
│                       │ implementation      │                               │
│                       └─────────────────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Document Roles

### spec.md - The Contract

**Purpose**: Defines WHAT to build

**Contains**:
- Requirements (R1, R2, R3...)
- Acceptance criteria
- Non-functional requirements
- Summary of security/performance/a11y requirements

**Example from spec.md**:
```markdown
### R1.2: Security Requirements (CRITICAL)
- nodeIntegration: false (MANDATORY)
- contextIsolation: true (MANDATORY)
- sandbox: true (MANDATORY)
> See security-review.md CSR-1 for complete threat model
```

### Review Documents - The Implementation Guide

**Purpose**: Defines HOW to build correctly

| Document | Focus | Key Sections |
|----------|-------|--------------|
| security-review.md | Threat mitigation | Threat model, CSRs, compliance checklist |
| performance-review.md | Speed & efficiency | Targets, optimization, benchmarks |
| testing-strategy.md | Test coverage | Examples, patterns, factories |
| accessibility-review.md | Inclusivity | WCAG, ARIA, keyboard nav |

### IMPLEMENTATION-GUIDE.md - The Navigator

**Purpose**: Defines WHEN to use each document

**Contains**:
- Phase-by-phase instructions
- "Read First" directives pointing to specific sections
- Code examples synthesizing multiple sources
- Verification checklists

---

## Integration Points

### 1. Spec.md → Review Documents

spec.md references review documents in key sections:

```markdown
# In spec.md

### Security Requirements
> See [security-review.md](./security-review.md) for complete threat model

**Critical Requirements:**
- [ ] CSR-1: WebContentsView isolation
- [ ] CSR-2: URL scheme allowlist

### Performance Requirements  
> See [performance-review.md](./performance-review.md) for optimization strategies

**Targets:**
| Metric | Target |
|--------|--------|
| View creation | <50ms |

### Acceptance Criteria

#### Security (from security-review.md)
- [ ] nodeIntegration: false verified
- [ ] URL scheme blocking works

#### Performance (from performance-review.md)
- [ ] View creation <50ms benchmark passes
```

### 2. Review Documents → Spec.md

Review documents reference spec requirements:

```markdown
# In security-review.md

## CSR-1: WebContentsView Isolation

**Spec Reference**: spec.md R1.1, R1.2

**Threat**: Malicious web content could access Node.js APIs

**Implementation** (implements spec.md R1.2):
```typescript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
}
```
```

### 3. IMPLEMENTATION-GUIDE.md → All Documents

The guide orchestrates all documents:

```markdown
# In IMPLEMENTATION-GUIDE.md

## Phase 1: Setup

### Read First
1. **spec.md** - Section R1.1 (WebContentsView creation)
2. **security-review.md** - CSR-1 (Security hardening)

### Implement
```typescript
// From spec.md R1.1: Create WebContentsView
// From security-review.md CSR-1: Secure settings
const view = new WebContentsView({
  webPreferences: {
    // CSR-1: MANDATORY settings
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
  },
});
```

### Verify
- [ ] From spec.md: "Secure web preferences applied"
- [ ] From security-review.md: "CSR-1 compliance checklist passed"
```

---

## How AI Uses Review Documents

### Document Navigation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI DOCUMENT NAVIGATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   AI receives prompt: "@IMPLEMENTATION-GUIDE.md - Implement Spec 017"        │
│                                                                              │
│                                  │                                           │
│                                  ▼                                           │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │ 1. AI READS IMPLEMENTATION-GUIDE.md                                 │    │
│   │                                                                     │    │
│   │    Finds: "Phase 1: Read spec.md R1.1, security-review.md CSR-1"   │    │
│   └─────────────────────────────────┬───────────────────────────────────┘    │
│                                     │                                        │
│                    ┌────────────────┴────────────────┐                      │
│                    ▼                                 ▼                      │
│   ┌────────────────────────────┐    ┌────────────────────────────┐         │
│   │ 2. AI READS spec.md R1.1   │    │ 3. AI READS security CSR-1 │         │
│   │                            │    │                            │         │
│   │ Learns: Create view with   │    │ Learns: Must use these     │         │
│   │ secure preferences         │    │ exact security settings    │         │
│   └────────────────┬───────────┘    └─────────────┬──────────────┘         │
│                    │                              │                         │
│                    └──────────────┬───────────────┘                         │
│                                   │                                         │
│                                   ▼                                         │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │ 4. AI SYNTHESIZES & IMPLEMENTS                                      │    │
│   │                                                                     │    │
│   │    Combines spec requirement + security requirement into code       │    │
│   │    Adds comments referencing sources: "From CSR-1", "From R1.1"    │    │
│   └─────────────────────────────────┬───────────────────────────────────┘    │
│                                     │                                        │
│                                     ▼                                        │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │ 5. AI VERIFIES                                                      │    │
│   │                                                                     │    │
│   │    Checks against IMPLEMENTATION-GUIDE.md verify checklist          │    │
│   │    Confirms spec.md acceptance criteria                             │    │
│   │    Confirms security-review.md compliance checklist                 │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Code Synthesis Example

**Input from spec.md R1.1:**
```markdown
Create a WebContentsView with secure defaults for loading web content.
```

**Input from security-review.md CSR-1:**
```markdown
**Required Mitigations:**
- nodeIntegration: false
- contextIsolation: true
- sandbox: true
- preload: undefined (no preload for browser views)
- webSecurity: true
```

**Synthesized Output:**
```typescript
// BrowserService.ts

// From spec.md R1.1: Create WebContentsView
// From security-review.md CSR-1: Security hardening
createView(id: string, url?: string): string {
  const view = new WebContentsView({
    webPreferences: {
      // CSR-1: CRITICAL - Must remain these values
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      contextIsolation: true,
      sandbox: true,
      
      // CSR-1: No preload for browser views
      preload: undefined,
      
      // CSR-1: Web security enforcement
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });
  
  // Store and return (spec.md R1.1)
  this.views.set(id, view);
  return id;
}
```

---

## Review Document Templates

### security-review.md Structure

```markdown
# Security Review: Spec XXX

## Executive Summary
Brief overview of security concerns.

## Threat Model

### Attack Surface Analysis
| Surface | Risk | Threats |
|---------|------|---------|
| [surface] | HIGH/MED/LOW | [threats] |

## Critical Security Requirements

### CSR-1: [Name] (MANDATORY)

**Threat**: [What could go wrong]

**Required Implementation**:
```typescript
// Implementation code
```

**Verification**: [How to test this]

### CSR-2: [Name]
[...]

## Compliance Checklist

- [ ] CSR-1 implemented
- [ ] CSR-2 implemented
- [ ] Security tests passing
```

### performance-review.md Structure

```markdown
# Performance Review: Spec XXX

## Performance Targets

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| [metric] | <Xms | <Yms | >Zms = bug |

## Optimization Strategies

### [Strategy Name]

**Why**: [Rationale]

**Implementation**:
```typescript
// Optimization code
```

## Benchmarking

### Test Suite
```typescript
describe('Performance', () => {
  it('should [metric] within target', () => {
    // Benchmark test
  });
});
```

## Checklist

- [ ] Targets defined
- [ ] Optimization implemented
- [ ] Benchmarks passing
```

### testing-strategy.md Structure

```markdown
# Testing Strategy: Spec XXX

## Coverage Requirements

| Component | Min Coverage | Target |
|-----------|--------------|--------|
| [component] | X% | Y% |

## Unit Tests

### [Component] Tests
```typescript
describe('[Component]', () => {
  it('should [behavior]', () => {
    // Test code
  });
});
```

## Test Utilities

### Factories
```typescript
export function createMock[Entity](): [Entity] {
  return { /* mock data */ };
}
```

## Checklist

- [ ] Unit tests complete
- [ ] Integration tests complete
- [ ] Coverage targets met
```

### accessibility-review.md Structure

```markdown
# Accessibility Review: Spec XXX

## WCAG 2.1 Compliance

| Level | Status |
|-------|--------|
| Level A | Required |
| Level AA | Required |
| Level AAA | Nice to have |

## Component Requirements

### [Component Name]

**ARIA Attributes**:
```tsx
<div
  role="[role]"
  aria-label="[label]"
  aria-[attr]="[value]"
/>
```

**Keyboard Navigation**:
| Key | Action |
|-----|--------|
| Tab | [action] |
| Enter | [action] |

## Screen Reader Testing

1. [Test scenario 1]
2. [Test scenario 2]

## Checklist

- [ ] ARIA attributes applied
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast verified
```

---

## Best Practices

### For Spec Authors

1. **Extract Critical Items**: Pull mandatory requirements from reviews into spec.md acceptance criteria
2. **Link Clearly**: Use markdown links to review documents
3. **Summarize**: Include brief summary in spec.md, full detail in review doc
4. **Keep Synchronized**: Update review docs when spec changes

### For Implementers

1. **Follow the Guide**: Use IMPLEMENTATION-GUIDE.md as primary navigation
2. **Don't Skip Reviews**: Always read referenced review sections
3. **Document Sources**: Add comments indicating where requirements came from
4. **Verify Comprehensively**: Check against all relevant checklists

### For AI Agents

1. **Read IMPLEMENTATION-GUIDE.md First**: It tells you what else to read
2. **Synthesize Sources**: Combine requirements from multiple documents
3. **Comment Code**: Reference sources in implementation comments
4. **Complete Checklists**: Verify against all listed criteria

---

## Integration Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  COMPLETE DOCUMENT INTEGRATION MAP                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   GENERATION PHASE                    IMPLEMENTATION PHASE                   │
│   ═══════════════                     ════════════════════                   │
│                                                                              │
│   ┌───────────┐                       ┌───────────────────┐                 │
│   │   Impl    │                       │   AI Coding       │                 │
│   │   Plan    │                       │   Agent           │                 │
│   └─────┬─────┘                       └─────────┬─────────┘                 │
│         │                                       │                           │
│         │ generates                             │ reads                     │
│         ▼                                       ▼                           │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                      │   │
│   │   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐      │   │
│   │   │spec.md  │◀───▶│plan.md  │     │status.  │     │IMPL-    │      │   │
│   │   │         │     │         │     │json     │     │GUIDE.md │      │   │
│   │   │ WHAT    │     │ WHEN    │     │ META    │     │ HOW     │      │   │
│   │   └────┬────┘     └─────────┘     └─────────┘     └────┬────┘      │   │
│   │        │                                               │           │   │
│   │        │ references                          references│           │   │
│   │        ▼                                               ▼           │   │
│   │   ┌────────────────────────────────────────────────────────────┐   │   │
│   │   │                     REVIEW DOCUMENTS                        │   │   │
│   │   │                                                             │   │   │
│   │   │  security-    performance-   testing-      accessibility-  │   │   │
│   │   │  review.md    review.md      strategy.md   review.md       │   │   │
│   │   │                                                             │   │   │
│   │   │  PROTECT      OPTIMIZE       VERIFY        INCLUDE         │   │   │
│   │   └────────────────────────────────────────────────────────────┘   │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│                              .aasef/specs/XXX-name/                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: When to Consult Each Review

| You're Implementing... | Consult |
|------------------------|---------|
| URL handling, input validation | security-review.md |
| IPC handlers, external content | security-review.md |
| Real-time updates, animations | performance-review.md |
| Memory management, caching | performance-review.md |
| Complex business logic | testing-strategy.md |
| Data transformations | testing-strategy.md |
| UI components, forms | accessibility-review.md |
| Interactive elements | accessibility-review.md |

---

## Summary

**The Three-Layer System:**

1. **spec.md** = WHAT (contract/requirements)
2. **Review docs** = HOW (implementation details)
3. **IMPLEMENTATION-GUIDE.md** = WHEN (navigation/orchestration)

**The Golden Rule:**
> Review documents provide the depth, IMPLEMENTATION-GUIDE.md provides the direction, spec.md provides the destination.
