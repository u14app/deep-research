# CI/CD Pipeline Improvement Plan with Biome, TypeScript, and Husky

## Current State Analysis

### Existing CI/CD Setup
- **GitHub Actions**: 
  - Docker publishing on tags
  - GHCR (GitHub Container Registry) publishing
  - Issue translation workflow
  - Fork sync workflow
- **Code Quality Tools**:
  - ESLint with Next.js config (minimal configuration)
  - TypeScript configured but no type-checking in CI
  - No formatting tool configured
  - No pre-commit hooks

### Identified Gaps
1. ❌ No automated code quality checks in CI
2. ❌ No formatting enforcement
3. ❌ No TypeScript type-checking in pipeline
4. ❌ No pre-commit hooks to catch issues early
5. ❌ No test execution in CI (no tests exist)
6. ❌ No build verification before Docker publishing

## Tool Selection: Biome vs ESLint/Prettier

### Why Biome for This Project

**Advantages for Deep Research:**
- ✅ **10x+ faster** than ESLint + Prettier (critical for CI/CD speed)
- ✅ **Single configuration** file (simpler maintenance)
- ✅ **Built-in formatter** (no Prettier conflicts)
- ✅ **Excellent Next.js support** out of the box
- ✅ **Lower memory usage** (better for CI runners)
- ✅ **Zero dependencies** (faster npm/pnpm installs)

**Trade-offs to Accept:**
- ⚠️ Limited plugin ecosystem (acceptable for this project)
- ⚠️ No type-aware linting (we'll use TypeScript compiler for that)
- ⚠️ Newer tool (but stable enough for production)

**Decision: Use Biome** for linting and formatting, with TypeScript compiler for type-checking.

## Implementation Plan

### Phase 1: Setup Biome and Remove ESLint

#### 1.1 Install Biome
```bash
pnpm add --save-dev @biomejs/biome
```

#### 1.2 Create Biome Configuration
```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": "warn"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error",
        "useTemplate": "error"
      },
      "suspicious": {
        "noExplicitAny": "off" // Keep current behavior
      }
    }
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "es5",
      "arrowParentheses": "always"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      ".next",
      "out",
      "public",
      "*.min.js",
      "coverage",
      ".github",
      ".husky",
      "*.config.js",
      "*.config.mjs"
    ]
  }
}
```

#### 1.3 Update package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "build:standalone": "cross-env NEXT_PUBLIC_BUILD_MODE=standalone next build",
    "build:export": "cross-env NEXT_PUBLIC_BUILD_MODE=export next build",
    "start": "next start",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "typecheck": "tsc --noEmit",
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "ci": "pnpm run typecheck && pnpm run check"
  }
}
```

#### 1.4 Remove ESLint
- Delete `eslint.config.mjs`
- Remove ESLint dependencies from package.json
- Remove `.eslintignore` if exists

### Phase 2: Setup Husky Pre-commit Hooks

#### 2.1 Install Husky and lint-staged
```bash
pnpm add --save-dev husky lint-staged
```

#### 2.2 Initialize Husky
```bash
npx husky init
```

#### 2.3 Create Pre-commit Hook
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged for changed files
npx lint-staged

# Run TypeScript check (fast with incremental compilation)
pnpm run typecheck
```

#### 2.4 Configure lint-staged
```json
// .lintstagedrc.json
{
  "*.{js,jsx,ts,tsx,mjs,cjs}": [
    "biome check --write --no-errors-on-unmatched"
  ],
  "*.{json,md,yml,yaml}": [
    "biome format --write --no-errors-on-unmatched"
  ]
}
```

#### 2.5 Create Pre-push Hook
```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run full checks before push
pnpm run ci
```

### Phase 3: GitHub Actions CI Pipeline

#### 3.1 Create Main CI Workflow
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  code-quality:
    name: Code Quality Checks
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run TypeScript type check
        run: pnpm run typecheck
        
      - name: Run Biome checks
        run: pnpm run check
        
      - name: Check formatting
        run: pnpm run format:check

  build:
    name: Build Verification
    runs-on: ubuntu-latest
    needs: code-quality
    
    strategy:
      matrix:
        build-mode: [standard, standalone, export]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build application (${{ matrix.build-mode }})
        run: |
          if [ "${{ matrix.build-mode }}" = "standard" ]; then
            pnpm run build
          elif [ "${{ matrix.build-mode }}" = "standalone" ]; then
            pnpm run build:standalone
          else
            pnpm run build:export
          fi
        
      - name: Upload build artifacts
        if: matrix.build-mode == 'export'
        uses: actions/upload-artifact@v4
        with:
          name: static-build
          path: out/
          retention-days: 7

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: code-quality
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run npm audit
        run: pnpm audit --audit-level=high
        continue-on-error: true
        
      - name: Run license check
        run: npx license-checker --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;0BSD'
        continue-on-error: true
```

#### 3.2 Update Docker Workflow
```yaml
# .github/workflows/docker.yml (updated)
name: Publish Docker image

on:
  push:
    tags:
      - "v*"

jobs:
  # Add quality check before building
  quality-gate:
    name: Quality Gate
    uses: ./.github/workflows/ci.yml
    
  push_to_registry:
    name: Push Docker image to Docker Hub
    runs-on: ubuntu-latest
    needs: quality-gate
    
    steps:
      # ... existing Docker build steps ...
```

#### 3.3 Create PR Automation
```yaml
# .github/workflows/pr-automation.yml
name: PR Automation

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  auto-assign:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@v0.5.0
        with:
          project-url: https://github.com/orgs/${{ github.repository_owner }}/projects/1
          
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          
  size:
    runs-on: ubuntu-latest
    steps:
      - uses: codelytv/pr-size-labeler@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          xs_max_size: 10
          s_max_size: 100
          m_max_size: 500
          l_max_size: 1000
          message_if_xl: >
            This PR is very large. Please consider breaking it into smaller PRs.
```

### Phase 4: Additional Configurations

#### 4.1 VS Code Settings
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

#### 4.2 Editor Config
```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2
```

#### 4.3 Git Attributes
```gitattributes
# .gitattributes
* text=auto eol=lf
*.{cmd,[cC][mM][dD]} text eol=crlf
*.{bat,[bB][aA][tT]} text eol=crlf
```

### Phase 5: TypeScript Enhancements

#### 5.1 Stricter TypeScript Config
```json
// tsconfig.json (additions)
{
  "compilerOptions": {
    // ... existing options ...
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

#### 5.2 Create Type Check Script
```bash
#!/bin/bash
# scripts/typecheck-incremental.sh

# Use incremental compilation for faster checks
tsc --incremental --noEmit

# Check for any TypeScript errors in tests (when added)
# tsc -p tsconfig.test.json --incremental --noEmit
```

## Migration Strategy

### Week 1: Local Development Setup
1. Install and configure Biome locally
2. Run initial format and fix on codebase
3. Setup Husky hooks
4. Test with team members

### Week 2: CI Pipeline Implementation
1. Deploy CI workflow to a feature branch
2. Test with multiple PRs
3. Gather feedback and adjust rules
4. Deploy to main branch

### Week 3: Team Onboarding
1. Documentation and training
2. VS Code extension setup for all developers
3. Address any issues or concerns

### Week 4: Monitoring and Optimization
1. Monitor CI pipeline performance
2. Adjust Biome rules based on team feedback
3. Optimize caching strategies

## Performance Expectations

### Before
- No automated checks
- Manual formatting inconsistencies
- Type errors caught late in development

### After
- **Local checks**: < 3 seconds for pre-commit
- **CI pipeline**: < 2 minutes for full checks
- **Type safety**: 100% of code type-checked
- **Format consistency**: 100% enforced
- **Build verification**: All 3 build modes tested

## Success Metrics

1. **Developer Experience**
   - Pre-commit hooks run in < 3 seconds
   - Zero false positives in linting rules
   - Consistent code style across team

2. **CI/CD Performance**
   - Full CI pipeline < 5 minutes
   - Parallel job execution
   - Cached dependencies

3. **Code Quality**
   - Zero TypeScript errors in production
   - Consistent formatting (100%)
   - No critical vulnerabilities in dependencies

## Rollback Plan

If issues arise:
1. Disable Husky hooks: `npx husky uninstall`
2. Revert to ESLint: restore `eslint.config.mjs`
3. Remove Biome: `pnpm remove @biomejs/biome`
4. Restore original package.json scripts

## Conclusion

This comprehensive CI/CD improvement plan will:
- ✅ Catch errors before they reach production
- ✅ Enforce consistent code style automatically
- ✅ Improve developer experience with fast local checks
- ✅ Provide confidence through automated verification
- ✅ Reduce review time by automating style checks

The combination of Biome (for speed), TypeScript (for type safety), and Husky (for early prevention) creates a robust quality gate that maintains high code standards without slowing down development.