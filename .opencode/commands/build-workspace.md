# OpenCode Command: build-workspace

```yaml
name: build-workspace
description: Build and test all affected submodules across the workspace
usage: |
  ## Usage
  pnpm build-workspace [--files <path>]

  ## Options
  files (optional): Only build affected by specific files

  ## Examples
  pnpm build-workspace
  pnpm build-workspace --files src/some/file.ts
  pnpm build-workspace --only affected
  pnpm build-workspace --target test
  pnpm build-workspace --target build
```
