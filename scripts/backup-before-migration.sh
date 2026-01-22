#!/bin/bash
# Pre-Migration Backup Script
# Creates a backup of the current state before migration
# Usage: ./scripts/backup-before-migration.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/${TIMESTAMP}"
DB_PATH="resources/db/spaces.sqlite"
BRANCH_NAME="backup/pre-migration-${TIMESTAMP}"

echo "=== Spayce Pre-Migration Backup ==="
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# 1. Create git backup branch
echo "Creating git backup branch: ${BRANCH_NAME}"
git checkout -b "${BRANCH_NAME}"
git checkout -

# 2. Backup database file
if [ -f "${DB_PATH}" ]; then
    echo "Backing up database: ${DB_PATH}"
    cp "${DB_PATH}" "${BACKUP_DIR}/spaces.sqlite.backup"
else
    echo "Warning: Database file not found at ${DB_PATH}"
fi

# 3. Backup package.json files
echo "Backing up package.json files..."
cp package.json "${BACKUP_DIR}/package.json.backup"
cp pnpm-lock.yaml "${BACKUP_DIR}/pnpm-lock.yaml.backup" 2>/dev/null || true

# 4. Create backup manifest
GIT_COMMIT=$(git rev-parse HEAD)
GIT_BRANCH=$(git branch --show-current)

cat > "${BACKUP_DIR}/manifest.json" << EOF
{
    "timestamp": "${TIMESTAMP}",
    "gitBranch": "${GIT_BRANCH}",
    "gitCommit": "${GIT_COMMIT}",
    "backupBranch": "${BRANCH_NAME}",
    "databasePath": "${DB_PATH}",
    "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo "=== Backup Complete ==="
echo "Backup directory: ${BACKUP_DIR}"
echo "Backup branch: ${BRANCH_NAME}"
echo ""
echo "To rollback, run: ./scripts/rollback-migration.sh ${TIMESTAMP}"
