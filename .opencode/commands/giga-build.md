# OpenCode Command: giga-build

```yaml
name: giga-build
description: Build in a specific submodule
usage: |
  ## Usage
  pnpm giga-build <subPath> [options]

  ## Arguments
  subPath: Path to submodule (e.g., orgs/riatzukiza/promethean)

  ## Options
  --target <target> (default: "build"):
    - "test": Run test script
    - "build": Run build script
    - "typecheck": Run typecheck script
    - "lint": Run lint script

  ## Examples
  pnpm giga-build orgs/riatzukiza/promethean
  pnpm giga-build orgs/sst/opencode --target typecheck
  pnpm giga-build orgs/bhauman/clojure-mcp --target lint
```
