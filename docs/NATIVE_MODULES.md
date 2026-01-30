# Native Module Management

## Problem

The `better-sqlite3` native module must be compiled for different Node.js versions:
- **Tests**: Run with Node.js v22 (MODULE_VERSION 127)
- **Electron App**: Runs with Electron's Node.js v20.x (MODULE_VERSION 123)

The same binary cannot serve both environments.

## Solution

We use conditional rebuild scripts that automatically rebuild for the correct environment:

### Running Tests
```bash
npm run test
```
The `pretest` script automatically rebuilds for Node.js before running tests.

### Running the App
```bash
npm run dev
```
The `predev` script automatically rebuilds for Electron before starting the app.

### Manual Rebuild

If you need to manually rebuild:

```bash
# For tests (Node.js)
npm run rebuild:node

# For Electron app
npm run rebuild:electron
```

## How It Works

1. **Default state**: After `pnpm install`, better-sqlite3 is built for Node.js (for tests)
2. **Before dev**: The `predev` script rebuilds for Electron
3. **Before test**: The `pretest` script rebuilds for Node.js
4. **Helper script**: `scripts/rebuild-for-environment.js` handles the rebuild logic

## Troubleshooting

### Error: "MODULE_VERSION mismatch"

This means the module is built for the wrong environment.

- If running **tests**: `npm run rebuild:node`
- If running **app**: `npm run rebuild:electron`

### After Fresh Install

After a fresh `pnpm install`, run tests first to verify everything works:

```bash
npm run test       # Rebuilds for Node.js automatically
npm run dev        # Rebuilds for Electron automatically
```

## Why Not Use electron-rebuild?

We tried `electron-rebuild`, but it requires complex configuration. Our custom script is:
- Simpler and more explicit
- Integrated into npm scripts
- Automatically runs before dev/test
- Works reliably across platforms
