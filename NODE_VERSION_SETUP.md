# Node.js Version Setup Guide for Spayce Electron

## Problem
The system has Node.js v22.17.1 installed at `/Users/apple/.nvm/versions/node/v22.17.1/bin/node`, but shell sessions default to v16.14.0, which is incompatible with pnpm 10.28.0 (requires Node.js v18.12+).

## Solution

### Option 1: Permanent Setup with NVM (Recommended)

#### Step 1: Run the Setup Script
```bash
bash scripts/setup-nvm.sh
```

This script will:
- Install NVM if not already installed
- Add NVM configuration to `~/.zshrc` and `~/.bashrc`
- Install Node.js v22.17.1
- Set it as the default version

#### Step 2: Restart Your Terminal
After running the script, restart your terminal or run:
```bash
source ~/.zshrc
```

#### Step 3: Verify
```bash
node --version  # Should show v22.17.1
pnpm --version  # Should show 10.28.0
```

---

### Option 2: Quick Fix for Current Session

If you need to use the correct Node version immediately without restarting:

```bash
export PATH="/Users/apple/.nvm/versions/node/v22.17.1/bin:$PATH"
node --version  # Should show v22.17.1
```

---

### Option 3: Add to Shell Profile Manually

Add these lines to your `~/.zshrc` (or `~/.bashrc` for bash):

```bash
# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

Then restart your terminal.

---

## Using the Correct Node Version with pnpm

### For Development
```bash
# Option A: With NVM (after setup)
pnpm dev

# Option B: With explicit PATH
export PATH="/Users/apple/.nvm/versions/node/v22.17.1/bin:$PATH"
pnpm dev
```

### For Building
```bash
# Option A: With NVM (after setup)
pnpm build

# Option B: With explicit PATH
export PATH="/Users/apple/.nvm/versions/node/v22.17.1/bin:$PATH"
pnpm build
```

### For TypeScript Checking
```bash
# Option A: With NVM (after setup)
pnpm typecheck

# Option B: With explicit PATH
export PATH="/Users/apple/.nvm/versions/node/v22.17.1/bin:$PATH"
pnpm typecheck
```

---

## Project-Specific Configuration

### .nvmrc File
The project includes a `.nvmrc` file that specifies Node.js v22.17.1. With NVM properly configured, entering the project directory will automatically use the correct version:

```bash
cd /Users/Shared/ALL\ WORKSPACE/projects/spayce_electron
# NVM will automatically switch to v22.17.1
node --version  # v22.17.1
```

---

## Troubleshooting

### Issue: "pnpm requires at least Node.js v18.12"

**Solution 1:** Run the setup script
```bash
bash scripts/setup-nvm.sh
```

**Solution 2:** Manually set PATH
```bash
export PATH="/Users/apple/.nvm/versions/node/v22.17.1/bin:$PATH"
pnpm --version
```

### Issue: NVM not found after restart

**Solution:** Ensure your shell profile was updated. Check:
```bash
cat ~/.zshrc | grep nvm.sh
```

If nothing appears, manually add the NVM configuration (see Option 3 above).

### Issue: Multiple Node versions installed

**Solution:** Set v22.17.1 as default
```bash
nvm alias default 22.17.1
```

---

## Verification Checklist

- [ ] Node.js v22.17.1 is installed
- [ ] `node --version` returns `v22.17.1`
- [ ] `pnpm --version` returns `10.28.0`
- [ ] `pnpm typecheck` passes without errors
- [ ] `pnpm build` completes successfully
- [ ] `pnpm dev` starts the development server

---

## Additional Resources

- [NVM GitHub Repository](https://github.com/nvm-sh/nvm)
- [pnpm Documentation](https://pnpm.io/)
- [Node.js v22.17.1 Release Notes](https://nodejs.org/en/blog/release/v22.17.1/)

---

**Last Updated:** Jan 23, 2026 6:44pm UTC+05:30
