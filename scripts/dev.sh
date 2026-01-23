#!/bin/bash

# Development startup script with proper Node.js version
# This ensures the correct Node.js version is loaded before starting the dev server

set -e

# Load NVM
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
fi

# Use the correct Node.js version
nvm use v22.17.1

# Navigate to project root
cd "$(dirname "$0")/.."

# Start development server
pnpm run dev
