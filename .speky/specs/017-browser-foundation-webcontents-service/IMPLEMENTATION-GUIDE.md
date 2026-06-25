# Implementation Guide: Spec 017

## How to Use This Spec During Implementation

This guide shows you exactly how to reference the spec and review documents while implementing.

---

## Step-by-Step Implementation Flow

### Phase 1: Setup (Day 1 Morning)

**Read in this order:**
1. ✅ `spec.md` - Overview, Requirements R1-R3
2. ✅ `plan.md` - Phase 1 tasks
3. ✅ `security-review.md` - Skim threat model

**Implement:**
```typescript
// From spec.md R1.1 + security-review.md CSR-1
const view = new WebContentsView({
  webPreferences: {
    nodeIntegration: false,        // CSR-1: MANDATORY
    contextIsolation: true,         // CSR-1: MANDATORY
    sandbox: true,                  // CSR-1: MANDATORY
    preload: undefined,             // CSR-1: No preload
    webSecurity: true,              // CSR-1: Enforce same-origin
    allowRunningInsecureContent: false,
  },
});
```

**Verify:**
- [ ] Check acceptance criteria in spec.md: "Secure web preferences applied"
- [ ] Check security-review.md: "CSR-1 compliance checklist"

---

### Phase 2: URL Validation (Day 1 Afternoon)

**Read:**
1. ✅ `spec.md` - R1.2 "Validate and normalize URL"
2. ✅ `security-review.md` - CSR-2 "URL Scheme Allowlist"

**Implement:**
```typescript
// From security-review.md CSR-2 (detailed implementation)
const ALLOWED_SCHEMES = new Set(['http:', 'https:']);
const BLOCKED_SCHEMES = new Set(['javascript:', 'vbscript:', 'data:']);

private validateAndNormalizeUrl(url: string): string | null {
  // From spec.md: "Block dangerous schemes"
  // From security-review.md CSR-2: Complete list
  try {
    const parsed = new URL(url);
    
    if (BLOCKED_SCHEMES.has(parsed.protocol)) {
      console.warn(`[SECURITY] Blocked: ${parsed.protocol}`);
      return null;
    }
    
    if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
      console.warn(`[SECURITY] Unknown scheme: ${parsed.protocol}`);
      return null;
    }
    
    return url;
  } catch {
    return null;
  }
}
```

**Verify:**
- [ ] Acceptance criteria: "Dangerous schemes blocked"
- [ ] Security review: All CSR-2 requirements met

---

### Phase 3: Performance Optimization (Day 2)

**Read:**
1. ✅ `spec.md` - NFR-3 "<100ms response for navigation"
2. ✅ `performance-review.md` - "Performance Targets" table

**Implement:**
```typescript
// From performance-review.md: "Bounds Update Optimization"
class BoundsThrottler {
  private readonly MIN_INTERVAL = 16; // 60fps from perf review
  
  update(bounds: ViewBounds): void {
    // Throttle to meet spec.md NFR: <16ms updates
    // See performance-review.md for complete implementation
  }
}
```

**Verify:**
- [ ] Acceptance criteria: "Bounds update within 16ms"
- [ ] Performance review: Run benchmark tests

---

### Phase 4: Testing (Day 3)

**Read:**
1. ✅ `spec.md` - Acceptance Criteria section
2. ✅ `security-review.md` - "Compliance Checklist"
3. ✅ `performance-review.md` - "Benchmarking" section

**Implement Tests:**
```typescript
// From security-review.md: Verification tests
describe('BrowserService Security', () => {
  it('should block javascript: URLs', () => {
    // CSR-2 verification
    expect(service.validateUrl('javascript:alert(1)')).toBeNull();
  });
  
  it('should have nodeIntegration disabled', () => {
    // CSR-1 verification
    const view = service.createView('test');
    expect(view.webContents.getWebPreferences().nodeIntegration).toBe(false);
  });
});

// From performance-review.md: Benchmark tests
describe('BrowserService Performance', () => {
  it('should create view within 50ms', async () => {
    const start = performance.now();
    service.createView('perf-test');
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50); // From perf review target
  });
});
```

---

## Quick Reference During Implementation

### When implementing security-sensitive code:

```typescript
// ❓ Question: How do I validate URLs?
// 📖 Answer: Check security-review.md CSR-2

// ❓ Question: What permissions should I allow?
// 📖 Answer: Check security-review.md "Permission Security Model"

// ❓ Question: How do I handle certificate errors?
// 📖 Answer: Check security-review.md CSR-5
```

### When implementing performance-critical code:

```typescript
// ❓ Question: What's the target for view creation?
// 📖 Answer: performance-review.md says <50ms

// ❓ Question: How do I optimize bounds updates?
// 📖 Answer: performance-review.md "Bounds Update Optimization"

// ❓ Question: How do I prevent memory leaks?
// 📖 Answer: performance-review.md "Memory Management"
```

### When implementing IPC handlers:

```typescript
// ❓ Question: How do I validate IPC inputs?
// 📖 Answer: security-review.md CSR-4

// ❓ Question: Should I batch IPC messages?
// 📖 Answer: performance-review.md "IPC Optimization"
```

---

## Checklist Before Marking Complete

### From spec.md Acceptance Criteria:

**Service Initialization**
- [ ] BrowserService initializes with main window
- [ ] Service prevents double initialization
- [ ] Service cleans up on window close

**Security** (from security-review.md)
- [ ] nodeIntegration: false verified
- [ ] contextIsolation: true verified
- [ ] sandbox: true verified
- [ ] URL scheme blocking works
- [ ] Certificate errors handled

**Performance** (from performance-review.md)
- [ ] View creation <50ms
- [ ] Navigation response <100ms
- [ ] No memory leaks

**All Other Criteria**
- [ ] [Complete list in spec.md]

---

## Common Implementation Patterns

### Pattern 1: Security-First Implementation

```typescript
// 1. Read spec.md requirement
// 2. Check security-review.md for threats
// 3. Implement with security in mind
// 4. Add security logging
// 5. Write security tests

function handleIpcMessage(data: unknown) {
  // From security-review.md CSR-4: Validate all inputs
  if (!isValidInput(data)) {
    console.warn('[SECURITY] Invalid IPC input');
    return { success: false, error: 'Invalid input' };
  }
  
  // Proceed with validated data
}
```

### Pattern 2: Performance-Aware Implementation

```typescript
// 1. Read spec.md NFR
// 2. Check performance-review.md for target
// 3. Implement with performance in mind
// 4. Add performance logging (dev only)
// 5. Write benchmark tests

function updateBounds(bounds: ViewBounds) {
  const start = performance.now();
  
  // Implementation
  
  if (process.env.NODE_ENV === 'development') {
    const duration = performance.now() - start;
    if (duration > 16) {
      console.warn(`[PERF] Bounds update slow: ${duration}ms`);
    }
  }
}
```

---

## When to Consult Each Document

| Document | Consult When... |
|----------|----------------|
| `spec.md` | Always - primary reference |
| `plan.md` | Starting each phase |
| `security-review.md` | Implementing URL handling, IPC, permissions |
| `performance-review.md` | Implementing real-time updates, memory management |
| `status.json` | Checking dependencies, understanding priority |

---

## Summary

**The Golden Rule**: 
- Spec.md tells you **WHAT** to implement
- Review docs tell you **HOW** to implement it correctly
- Acceptance criteria tell you **WHEN** you're done

**Implementation Flow**:
1. Read spec.md requirement
2. Consult relevant review doc for details
3. Implement with review guidance
4. Verify against acceptance criteria
5. Write tests from review examples
