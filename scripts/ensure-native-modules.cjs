#!/usr/bin/env node

/**
 * Smart native module rebuild — only rebuilds when needed.
 *
 * Usage: node scripts/ensure-native-modules.cjs [electron|node]
 *
 * For "node" target:
 *   Tries to require('better-sqlite3'). If it loads, skip rebuild.
 *   If ERR_DLOPEN_FAILED (wrong ABI), rebuild for Node.
 *
 * For "electron" target:
 *   Checks a marker file (.native-module-target in node_modules) that records
 *   the last build target. If it says "electron", skip. Otherwise rebuild and
 *   write the marker.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const target = process.argv[2] || 'node';
const rootDir = path.resolve(__dirname, '..');
const markerPath = path.join(rootDir, 'node_modules', '.native-module-target');

// Resolve better-sqlite3 from the desktop package (where it's a direct dep).
// pnpm doesn't hoist it to root node_modules, so bare require() won't work.
const desktopDir = path.join(rootDir, 'packages', 'desktop');

function resolveBetterSqlite3() {
  return require.resolve('better-sqlite3', { paths: [desktopDir] });
}

function rebuild() {
  console.log(`\n🔧 Native modules don't match "${target}" target — rebuilding...`);
  execSync(`node "${path.join(__dirname, 'rebuild-for-environment.cjs')}" ${target}`, {
    stdio: 'inherit',
    cwd: rootDir,
  });
  // Write marker so we know what target the binary is built for
  try {
    fs.writeFileSync(markerPath, target, 'utf8');
  } catch (_) {
    // Non-fatal — marker is an optimisation, not a requirement
  }
}

function readMarker() {
  try {
    return fs.readFileSync(markerPath, 'utf8').trim();
  } catch (_) {
    return null;
  }
}

// ── Electron target ─────────────────────────────────────────────────────────
// We can't load an Electron-built native module from plain Node, so we rely on
// a marker file that records the last build target.
if (target === 'electron') {
  if (readMarker() === 'electron') {
    // Already built for Electron — nothing to do
    process.exit(0);
  }
  rebuild();
  process.exit(0);
}

// ── Node target ─────────────────────────────────────────────────────────────
// Try to actually load the module. If it works, we're good.
if (target === 'node') {
  try {
    // Resolve from desktop package where better-sqlite3 is a direct dependency
    const modulePath = resolveBetterSqlite3();
    require(modulePath);
    // Loaded successfully — binary matches current Node
    // Update marker so electron→node switch is tracked
    try { fs.writeFileSync(markerPath, 'node', 'utf8'); } catch (_) {}
    process.exit(0);
  } catch (err) {
    if (
      err.code === 'ERR_DLOPEN_FAILED' ||
      (err.message && err.message.includes('NODE_MODULE_VERSION'))
    ) {
      // ABI mismatch — need to rebuild
      rebuild();
      process.exit(0);
    }
    // Some other error (e.g. module not installed at all) — try rebuild anyway
    rebuild();
    process.exit(0);
  }
}

// Unknown target — fall through to rebuild
console.error(`⚠️  Unknown target "${target}", expected "electron" or "node"`);
process.exit(1);
