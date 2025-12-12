# Frontend Linting & Formatting Commands Reference

## Quick Start

All frontend code quality tools are pre-configured and ready to use.

---

## Available npm Scripts

### Run These Commands from `/workspaces/commitolab/`

#### Check Mode (Read-Only - No Changes)

```bash
# ESLint check - detects errors, unused imports, duplicates
npm run lint

# TypeScript type checking
npm run typecheck

# Prettier format check - verifies code matches formatter
npm run check:format
```

#### Auto-Fix Mode (Makes Changes)

```bash
# ESLint auto-fix - removes unused imports, consolidates duplicates, fixes linting issues
npm run lint:fix

# Prettier auto-format - formats code to match .prettierrc.json standards
npm run format
```

#### Combined Workflows

```bash
# Complete cleanup (recommended before committing)
npm run lint:fix && npm run format && npm run typecheck

# Quick check (before pushing)
npm run lint && npm run typecheck && npm run check:format
```

---

## What Each Script Does

### `npm run lint`

**Purpose**: Detects and reports linting errors

**Scope**: All .ts, .tsx, .js, .jsx files in client/

**Rules Enforced**:
- No duplicate imports (`no-duplicate-imports`)
- No unused variables (`@typescript-eslint/no-unused-vars`)
- React Native best practices (via eslint-config-expo)
- Prettier formatting issues (via eslint-plugin-prettier)

**Expected Output**:
```
# If no errors:
(no output = success)

# If errors found:
client/path/to/file.tsx
  Line 5: Unused variable 'foo'
  Line 12: Duplicate import
```

**Exit Code**: 0 (success) or 1 (errors found)

---

### `npm run lint:fix`

**Purpose**: Auto-fix ESLint violations

**What It Fixes**:
- ✅ Removes unused imports
- ✅ Consolidates duplicate imports
- ✅ Fixes simple linting violations
- ✅ Formats code to match Prettier (via prettier plugin)

**What It Cannot Fix**:
- ❌ Complex logic errors
- ❌ Type mismatches (use typecheck for that)

**Example Before**:
```typescript
import { useTheme } from "@/hooks/useTheme";
import { useTheme } from "@/hooks/useTheme";  // Duplicate!
import { unusedVariable } from "@/lib";       // Unused!

export function MyComponent() {
  const { theme } = useTheme();
  return <Text>{theme.primary}</Text>;
}
```

**Example After**:
```typescript
import { useTheme } from "@/hooks/useTheme";

export function MyComponent() {
  const { theme } = useTheme();
  return <Text>{theme.primary}</Text>;
}
```

---

### `npm run format`

**Purpose**: Auto-format code to match .prettierrc.json standards

**What It Changes**:
- ✅ Line length (max 80 characters)
- ✅ Quote style (double quotes)
- ✅ Semicolons (always added)
- ✅ Indentation (2 spaces)
- ✅ Arrow function parentheses (always included)
- ✅ Trailing commas (es5 style)

**Scope**: client/**/*.{ts,tsx,js,jsx,json,md}

**Example Before**:
```typescript
function MyComponent({name,email,address}){return <Text>{name}</Text>}
```

**Example After**:
```typescript
function MyComponent({ name, email, address }) {
  return <Text>{name}</Text>;
}
```

---

### `npm run typecheck`

**Purpose**: Run TypeScript type checker without emitting files

**Detects**:
- ✅ Type mismatches
- ✅ Missing properties
- ✅ Invalid function arguments
- ✅ Undefined variables

**Options**:
- `--noEmit`: Don't generate .js files (check only)
- `--skipLibCheck`: Skip checking node_modules (faster)

**Expected Output**:
```
# If all types correct:
(no output = success)

# If type errors:
client/screens/HomeScreen.tsx:42:5 - error TS2322: Type 'string' is not assignable to type 'number'
```

---

### `npm run check:format`

**Purpose**: Check if code matches Prettier without making changes

**Use When**:
- ✅ Verifying code is formatted before commit
- ✅ CI/CD pipeline checks
- ✅ Pre-push hooks

**Example Output**:
```bash
# Already formatted:
# (no output = success)

# Needs formatting:
client/screens/HomeScreen.tsx
client/hooks/useCommitments.ts
(2 files need formatting)
```

---

## Common Workflows

### Before Committing Code

```bash
npm run lint:fix    # Auto-fix lint issues
npm run format      # Auto-format code
npm run typecheck   # Verify types are correct
```

### Before Pushing to Remote

```bash
npm run lint        # Check no lint errors
npm run typecheck   # Check no type errors  
npm run check:format # Check all formatted
```

### Quick Manual Check

```bash
npm run lint && npm run typecheck
```

### Full Cleanup (Recommended)

```bash
npm run lint:fix && npm run format && npm run typecheck
```

---

## ESLint Configuration Details

**File**: `/workspaces/commitolab/eslint.config.js`

**Active Rules**:
```javascript
{
  "no-duplicate-imports": "error",           // Prevents duplicate imports
  "import/no-duplicates": "error",           // Secondary check for duplicates
  "@typescript-eslint/no-unused-vars": "error", // Detects unused imports
  "react/no-unescaped-entities": "off",     // Allows apostrophes in JSX
}
```

**Allowed Placeholders**:
- `_variable` - Intentionally unused variables
- `_param` - Unused function parameters
- Can be used to satisfy TypeScript but ignore ESLint

---

## Prettier Configuration Details

**File**: `/workspaces/commitolab/.prettierrc.json`

**Settings**:
```json
{
  "semi": true,                  // Always add semicolons
  "trailingComma": "es5",        // Trailing commas in es5 style
  "singleQuote": false,          // Use double quotes
  "printWidth": 80,              // Max 80 characters per line
  "tabWidth": 2,                 // 2 spaces per indent
  "useTabs": false,              // Use spaces, not tabs
  "arrowParens": "always",       // Always parentheses around arrow params
  "endOfLine": "lf"              // Unix line endings
}
```

---

## Troubleshooting

### "npm: command not found"
```bash
# Install Node.js and npm from nodejs.org
# Then try again:
npm run lint
```

### ESLint finds errors but won't auto-fix them
```bash
# Some errors require manual fixes (e.g., logic errors)
# View the actual error:
npm run lint

# Then edit the file manually and re-run:
npm run lint
```

### Prettier and ESLint conflicts
```bash
# If you see conflicting formatting suggestions:
# This shouldn't happen - they're integrated
# Try running both:
npm run lint:fix && npm run format
```

### TypeScript errors but code looks right
```bash
# Sometimes TypeScript cache gets stale
# Clear and re-check:
npm run typecheck
```

---

## Import System Details

### How @/ Alias Works

**tsconfig.json**:
```json
"baseUrl": "./client",
"paths": { "@/*": ["./*"] }
```

This means:
- `@/components` → `./client/components`
- `@/hooks/useTheme` → `./client/hooks/useTheme`
- `@/shared/config` → `./shared/config` (via @shared alias)

### babel.config.js
```javascript
alias: {
  "@": "./client",
  "@shared": "./shared",
}
```

Ensures Expo Metro bundler resolves aliases correctly.

---

## Duplicate Import Prevention

### How It Works
The `no-duplicate-imports` and `import/no-duplicates` ESLint rules prevent this:

**❌ NOT ALLOWED**:
```typescript
import { useTheme } from "@/hooks/useTheme";
import { useTheme } from "@/hooks/useTheme";
```

**✅ CORRECT**:
```typescript
import { useTheme } from "@/hooks/useTheme";
```

**✅ ALSO CORRECT** (multiple from same file):
```typescript
import { useTheme, useColorScheme } from "@/hooks";
```

---

## Unused Import Prevention

### How It Works
The `@typescript-eslint/no-unused-vars` rule prevents this:

**❌ NOT ALLOWED**:
```typescript
import { unusedFunction } from "@/lib";

export function MyComponent() {
  return <Text>Hello</Text>;
}
```

**✅ CORRECT**:
```typescript
import { usedFunction } from "@/lib";

export function MyComponent() {
  return <Text>{usedFunction()}</Text>;
}
```

**✅ ALLOWED** (intentional placeholder):
```typescript
export function Handler(_event: Event) {
  // Intentionally ignoring event parameter
  console.log("Handler triggered");
}
```

---

## CI/CD Integration

### Suggested GitHub Actions Workflow

```yaml
name: Frontend Quality Check

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run check:format
```

### Pre-commit Hook (Local)

```bash
#!/bin/sh
# .git/hooks/pre-commit (create this file)
npm run lint:fix && npm run format || exit 1
```

---

## Performance Notes

- **npm run lint**: ~2-5 seconds
- **npm run typecheck**: ~3-10 seconds (first run), ~1-3 seconds (cached)
- **npm run format**: ~1-2 seconds
- **Combined**: ~10-20 seconds total

All scripts are fast enough for frequent use.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `eslint.config.js` | ESLint rules and configuration |
| `.prettierrc.json` | Prettier formatting rules |
| `tsconfig.json` | TypeScript and path aliases |
| `babel.config.js` | Babel and Expo bundler config |
| `package.json` | npm scripts |
| `shared/config.ts` | Feature flags and config exports |

---

## Getting Help

### Check current lint status
```bash
npm run lint
```

### See what prettier would change
```bash
npm run check:format
```

### Auto-fix everything
```bash
npm run lint:fix && npm run format && npm run typecheck
```

### View TypeScript errors
```bash
npm run typecheck
```

---

**All scripts configured and tested ✅**  
**Ready for development and CI/CD integration**
