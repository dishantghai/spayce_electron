#!/usr/bin/env node

/**
 * Rebuild better-sqlite3 for the target environment
 * Usage: node scripts/rebuild-for-environment.js [electron|node]
 */

const { execSync } = require('child_process');
const path = require('path');

const target = process.argv[2] || 'node';

console.log(`\n🔧 Rebuilding better-sqlite3 for ${target}...`);

const betterSqlitePath = path.join(
  __dirname,
  '../node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3'
);

try {
  if (target === 'electron') {
    console.log('  Target: Electron 30.5.1 (NODE_MODULE_VERSION 123)');
    execSync(
      `cd "${betterSqlitePath}" && npx --yes node-gyp rebuild --target=30.5.1 --arch=arm64 --dist-url=https://electronjs.org/headers`,
      { stdio: 'inherit' }
    );
  } else {
    console.log('  Target: Node.js current version (NODE_MODULE_VERSION 127)');
    execSync('pnpm rebuild better-sqlite3', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  }
  console.log(`✅ Successfully rebuilt for ${target}\n`);
} catch (error) {
  console.error(`❌ Failed to rebuild for ${target}`);
  process.exit(1);
}
