# OpenCode Command: giga-test

```yaml
name: giga-test
description: Run tests in a specific submodule
usage: |
  ## Usage
  pnpm giga-test <subPath> [options]

  ## Arguments
  subPath: Path to submodule (e.g., orgs/riatzukiza/promethean)

  ## Options
  --target <target> (default: "test"):
    - "test": Run test script
    - "build": Run build script
    - "typecheck": Run typecheck script
    - "lint": Run lint script

  ## Examples
  pnpm giga-test orgs/riatzukiza/promethean
  pnpm giga-test orgs/sst/opencode --target build
  pnpm giga-test orgs/bhauman/clojure-mcp --target typecheck
```
