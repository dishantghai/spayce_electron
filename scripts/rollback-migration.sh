#!/bin/bash
# Rollback Migration Script
# Restores the system to a previous backup state
# Usage: ./scripts/rollback-migration.sh <timestamp>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/rollback-migration.sh <timestamp>"
    echo ""
    echo "Available backups:"
    ls -la backups/ 2>/dev/null || echo "No backups found"
    exit 1
fi

TIMESTAMP="$1"
BACKUP_DIR="backups/${TIMESTAMP}"
DB_PATH="resources/db/spaces.sqlite"

echo "=== Spayce Migration Rollback ==="
echo "Restoring from backup: ${TIMESTAMP}"
echo ""

# Check backup exists
if [ ! -d "${BACKUP_DIR}" ]; then
    echo "Error: Backup directory not found: ${BACKUP_DIR}"
    exit 1
fi

# Read manifest
if [ -f "${BACKUP_DIR}/manifest.json" ]; then
    echo "Backup manifest:"
    cat "${BACKUP_DIR}/manifest.json"
    echo ""
fi

# 1. Restore database
if [ -f "${BACKUP_DIR}/spaces.sqlite.backup" ]; then
    echo "Restoring database..."
    cp "${BACKUP_DIR}/spaces.sqlite.backup" "${DB_PATH}"
    echo "Database restored"
else
    echo "Warning: No database backup found"
fi

# 2. Reset git to backup state
BACKUP_BRANCH=$(cat "${BACKUP_DIR}/manifest.json" | grep -o '"backupBranch": "[^"]*"' | cut -d'"' -f4)
BACKUP_COMMIT=$(cat "${BACKUP_DIR}/manifest.json" | grep -o '"gitCommit": "[^"]*"' | cut -d'"' -f4)

if [ -n "${BACKUP_COMMIT}" ]; then
    echo ""
    echo "Git backup commit: ${BACKUP_COMMIT}"
    echo "To fully restore git state, run:"
    echo "  git reset --hard ${BACKUP_COMMIT}"
    echo ""
    read -p "Reset git to backup commit? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git reset --hard "${BACKUP_COMMIT}"
        echo "Git reset complete"
    fi
fi

# 3. Reinstall dependencies
echo ""
echo "Reinstalling dependencies..."
pnpm install

# 4. Run tests to verify
echo ""
echo "Running tests to verify rollback..."
pnpm test -- --run || echo "Some tests failed - please review"

echo ""
echo "=== Rollback Complete ==="
echo "System restored to backup: ${TIMESTAMP}"
