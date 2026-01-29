# OpenCode Command: workspace-dev

```yaml
name: workspace-dev
description: Run common development workflow (lint, typecheck, build affected)
usage: |
  ## Usage
  pnpm workspace-dev [options]

  ## Options
  --skip-lint (optional): Skip linting
  --skip-typecheck (optional): Skip typecheck
  --skip-build (optional): Skip build
  --files <path> (optional): Only build affected by specific files

  ## Description
  Runs a standard development workflow:
  1. Lint all files (unless --skip-lint)
  2. Typecheck all files (unless --skip-typecheck)
  3. Build affected submodules (unless --skip-build)

  ## Examples
  pnpm workspace-dev
  pnpm workspace-dev --skip-lint
  pnpm workspace-dev --files src/some/file.ts
  pnpm workspace-dev --skip-lint --skip-typecheck --skip-build
```
