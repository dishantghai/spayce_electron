#!/bin/bash
# Setup NVM for permanent Node.js version access

# Check if NVM is installed
if [ ! -d "$HOME/.nvm" ]; then
    echo "Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
fi

# Add NVM to shell profile
if [ -f "$HOME/.zshrc" ]; then
    if ! grep -q "nvm.sh" "$HOME/.zshrc"; then
        cat >> "$HOME/.zshrc" << 'NVMRC'

# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
NVMRC
        echo "✓ Added NVM to ~/.zshrc"
    fi
fi

if [ -f "$HOME/.bashrc" ]; then
    if ! grep -q "nvm.sh" "$HOME/.bashrc"; then
        cat >> "$HOME/.bashrc" << 'NVMRC'

# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
NVMRC
        echo "✓ Added NVM to ~/.bashrc"
    fi
fi

# Source NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use correct Node version
echo "Installing Node.js v22.17.1..."
nvm install 22.17.1
nvm use 22.17.1
nvm alias default 22.17.1

echo "✓ Node.js v22.17.1 is now set as default"
echo "✓ Restart your terminal or run: source ~/.zshrc"
