#!/bin/bash
# Copy Flutter Database Script
# Copies the SQLite database from the Flutter app to the Electron app
# Usage: ./scripts/copy-flutter-db.sh [source_path]

set -e

# Default Flutter database location (macOS)
DEFAULT_FLUTTER_DB="$HOME/Library/Containers/com.spayce.app/Data/Documents/spaces.sqlite"
FLUTTER_DB="${1:-$DEFAULT_FLUTTER_DB}"
ELECTRON_DB="resources/db/spaces.sqlite"

echo "=== Copy Flutter Database ==="
echo "Source: ${FLUTTER_DB}"
echo "Destination: ${ELECTRON_DB}"
echo ""

# Check source exists
if [ ! -f "${FLUTTER_DB}" ]; then
    echo "Error: Flutter database not found at: ${FLUTTER_DB}"
    echo ""
    echo "Common locations:"
    echo "  macOS: ~/Library/Containers/com.spayce.app/Data/Documents/spaces.sqlite"
    echo "  Linux: ~/.local/share/spayce/spaces.sqlite"
    echo ""
    echo "Usage: ./scripts/copy-flutter-db.sh /path/to/flutter/spaces.sqlite"
    exit 1
fi

# Create destination directory
mkdir -p "$(dirname "${ELECTRON_DB}")"

# Backup existing database if present
if [ -f "${ELECTRON_DB}" ]; then
    BACKUP="${ELECTRON_DB}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backing up existing database to: ${BACKUP}"
    cp "${ELECTRON_DB}" "${BACKUP}"
fi

# Copy database
echo "Copying database..."
cp "${FLUTTER_DB}" "${ELECTRON_DB}"

# Verify copy
if [ -f "${ELECTRON_DB}" ]; then
    echo ""
    echo "Database copied successfully!"
    echo "Size: $(ls -lh "${ELECTRON_DB}" | awk '{print $5}')"
    
    # Run migration to ensure schema is up to date
    echo ""
    echo "Running migration to ensure schema compatibility..."
    npx ts-node scripts/migrate-db.ts || echo "Migration script not available"
else
    echo "Error: Copy failed"
    exit 1
fi
