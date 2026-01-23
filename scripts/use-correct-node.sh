#!/bin/bash
# Force use of correct Node.js version

# Try NVM first
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    . "$HOME/.nvm/nvm.sh"
    nvm use 22.17.1 2>/dev/null
fi

# Fallback: use explicit path if NVM fails
if ! command -v node &> /dev/null || [ "$(node --version)" = "v16.14.0" ]; then
    export PATH="/Users/apple/.nvm/versions/node/v22.17.1/bin:$PATH"
fi

# Verify
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
