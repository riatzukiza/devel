# OpenCode Command: giga-typecheck

```yaml
name: giga-typecheck
description: Typecheck in a specific submodule
usage: |
  ## Usage
  pnpm giga-typecheck <subPath> [options]

  ## Arguments
  subPath: Path to submodule (e.g., orgs/riatzukiza/promethean)

  ## Options
  --target <target> (default: "typecheck"):
    - "test": Run test script
    - "build": Run build script
    - "typecheck": Run typecheck script
    - "lint": Run lint script

  ## Examples
  pnpm giga-typecheck orgs/riatzukiza/promethean
  pnpm giga-typecheck orgs/sst/opencode --target test
  pnpm giga-typecheck orgs/bhauman/clojure-mcp --target build
```
