# OpenCode Command: lint-workspace

```yaml
name: lint-workspace
description: Lint all TypeScript and markdown files across the workspace
usage: |
  ## Usage
  pnpm lint-workspace [--type <type>]

  ## Options
  type (default: "all"):
    - "all": Lint all files (default)
    - "ts": Lint only TypeScript files
    - "md": Lint only markdown files

  ## Examples
  pnpm lint-workspace
  pnpm lint-workspace --type ts
  pnpm lint-workspace --type md
```
