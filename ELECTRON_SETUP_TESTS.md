# Spayce Desktop Test Harness

All these Tests for Desktop should be run from - /packages/desktop

**A robust test suite designed to prevent the painful setup issues we faced**

This test harness ensures that the Electron app setup never breaks again by testing:

- Build system (esbuild compilation)
- Native modules (better-sqlite3 architecture)
- Database paths (dev/prod resolution)
- IPC contracts (main/renderer communication)
- Configuration (package.json, TypeScript)

---

## Quick Start

```bash
# Run all desktop tests
pnpm test:desktop

# Run specific test suites
pnpm test:desktop:preflight  # Quick checks before dev
pnpm test:desktop:smoke      # Basic functionality
pnpm test:desktop:all        # Everything with verbose output

# Health check (runs before dev automatically)
pnpm check-health
```

---

## Test Suite Summary

| Suite           | Tests         | Purpose                              |
| --------------- | ------------- | ------------------------------------ |
| Pre-flight      | 28            | Quick validation before dev          |
| Build System    | 22            | Verify esbuild compilation           |
| Native Modules  | 21            | Catch architecture mismatches        |
| Path Resolution | 20            | Ensure correct file paths            |
| IPC Contract    | 30            | Validate main/renderer communication |
| Database        | 22            | Test SQLite operations               |
| Smoke Tests     | 15            | Quick functionality verification     |
| **Total** | **158** |                                      |

---

## Test Suites

### 1. Pre-flight Checks (`__tests__/preflight/`)

**Purpose:** Quick validation before starting development

**What it catches:**

- Missing Node.js or pnpm
- Missing dependencies
- Wrong native module architecture (arm64 vs x64)
- Missing database file
- Invalid package.json configuration

**When to run:** Before `pnpm dev` (runs automatically via `predev` hook)

### 2. Build System Tests (`__tests__/build/`)

**Purpose:** Verify esbuild compilation works correctly

**What it catches:**

- Missing build scripts
- ESM/CJS module conflicts
- Incorrect output format
- Missing source files
- Failed workspace dependency bundling

**When to run:** After modifying build configuration

### 3. Native Module Tests (`__tests__/native-modules/`)

**Purpose:** Ensure better-sqlite3 loads correctly

**What it catches:**

- Architecture mismatch (the "incompatible architecture" error)
- Missing native binaries
- Incorrect Electron headers
- Module resolution issues

**When to run:** After `pnpm install` or changing dependencies

### 4. Path Resolution Tests (`__tests__/paths/`)

**Purpose:** Verify file paths resolve correctly

**What it catches:**

- Database path errors (looking in wrong location)
- Preload script path errors
- Development vs production path mismatches

**When to run:** After modifying main process code

### 5. IPC Contract Tests (`__tests__/ipc/`)

**Purpose:** Ensure main/renderer communication works

**What it catches:**

- Missing IPC handlers
- Preload API mismatches
- Service registration failures
- Type mismatches

**When to run:** After modifying IPC handlers or preload script

### 6. Database Tests (`__tests__/database/`)

**Purpose:** Verify database operations work end-to-end

**What it catches:**

- Schema initialization failures
- CRUD operation errors
- Seeded data issues

**When to run:** After database changes

### 7. Smoke Tests (`__tests__/smoke/`)

**Purpose:** Quick verification that everything works together

**What it catches:**

- Service initialization failures
- Database connection errors
- Build output issues

**When to run:** After any significant change

---

## Health Check Script

The health check script (`scripts/check-health.js`) provides a visual report of the system state:

```bash
pnpm check-health
```

Output:

```
╔═══════════════════════════════════════════════════╗
║      SPAYCE ELECTRON HEALTH CHECK                 ║
╚═══════════════════════════════════════════════════╝

━━━ Environment ━━━

✓ Node.js v20.10.0
✓ pnpm 8.15.0
ℹ Platform: darwin (arm64)

━━━ Dependencies ━━━

✓ Workspace node_modules installed
✓ Electron installed
✓ better-sqlite3 installed
✓ esbuild installed

━━━ Native Modules ━━━

✓ better-sqlite3 native module (arm64)
✓ better-sqlite3 loads successfully

━━━ Database ━━━

✓ Development database exists
✓ Valid SQLite database
✓ Database has 5 seeded spaces

━━━ Build Outputs ━━━

✓ dist/main.cjs exists
✓ dist/preload.cjs exists
✓ main.cjs is valid CommonJS
✓ preload.cjs is valid CommonJS

━━━ Summary ━━━

✓ All health checks passed!
ℹ Ready to run: pnpm dev
```

---

## Pre-commit Checks

Run before committing to catch issues early:

```bash
pnpm pre-commit
```

This runs:

1. TypeScript type check
2. Build verification
3. Preflight tests
4. Core tests
5. Infrastructure tests

To install as git hook:

```bash
cp scripts/pre-commit-checks.js .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## Common Issues and Fixes

### "ERR_UNKNOWN_FILE_EXTENSION" for .ts files

**Cause:** Electron trying to load TypeScript directly

**Fix:** Run `pnpm build:main` before starting Electron

**Prevention:** Build system tests verify output exists

### "incompatible architecture (have 'x86_64', need 'arm64')"

**Cause:** better-sqlite3 built for wrong architecture

**Fix:**

```bash
npx electron-rebuild -f -w better-sqlite3
```

**Prevention:** Native module tests verify architecture

### Database not found

**Cause:** Incorrect path resolution

**Fix:** Ensure `resources/db/spaces.sqlite` exists

**Prevention:** Path resolution tests verify paths

### IPC handler not found

**Cause:** Handler not registered or name mismatch

**Fix:** Check `src/main/ipc/handlers.ts` and `src/preload/index.ts`

**Prevention:** IPC contract tests verify consistency

---

## Test File Structure

```
packages/desktop/
├── __tests__/
│   ├── setup/
│   │   └── test-utils.ts       # Shared test utilities
│   ├── build/
│   │   └── build-system.test.ts
│   ├── native-modules/
│   │   └── native-module-integrity.test.ts
│   ├── paths/
│   │   └── path-resolution.test.ts
│   ├── ipc/
│   │   └── ipc-contract.test.ts
│   ├── database/
│   │   └── database-integration.test.ts
│   ├── preflight/
│   │   └── preflight-checks.test.ts
│   └── smoke/
│       └── smoke-tests.test.ts
├── scripts/
│   ├── build-main.js           # esbuild build script
│   └── check-health.js         # Health check script
└── vitest.config.ts            # Test configuration
```

---

## Adding New Tests

1. Create test file in appropriate directory
2. Import utilities from `../setup/test-utils`
3. Use descriptive test names that explain what's being tested
4. Add comments explaining what issues the test catches

Example:

```typescript
/**
 * Tests for [feature]
 * 
 * CRITICAL: These tests catch [specific issues]
 */

import { describe, it, expect } from 'vitest';
import { WORKSPACE_ROOT } from '../setup/test-utils';

describe('[Feature]', () => {
    it('should [expected behavior]', () => {
        // Test implementation
    });
});
```

---

## CI/CD Integration

For GitHub Actions or similar:

```yaml
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
    
      - run: pnpm install
      - run: pnpm check-health
      - run: pnpm test:all
```

---

## Architecture Mismatch Handling

Some tests require loading native modules (better-sqlite3). When running tests under Node.js on Apple Silicon via Rosetta (x64 Node.js), but the native module is built for arm64, these tests will **skip gracefully** rather than fail.

This is expected behavior:

- The tests verify the native module is built for the **correct architecture** (arm64 for Apple Silicon)
- Tests that require actually loading the module skip when architecture mismatch is detected
- Electron will load the arm64 module correctly at runtime

You'll see output like:

```
Skipping: Node.js is x64, native module is arm64
This is expected - Electron will load the arm64 module correctly
```

---

## Philosophy

This test harness was created after painful debugging of:

1. **TypeScript loading errors** - Electron can't load .ts files directly
2. **Architecture mismatches** - Native modules built for wrong CPU
3. **Path resolution bugs** - Database looked for in wrong location
4. **IPC mismatches** - Handler names didn't match preload API

Each test category exists to catch a specific class of problems **before** they cause runtime failures. The goal is to never face dependency hell again.

**When in doubt, run the tests!**
