# OpenCode Command: nx-generate

```yaml
name: nx-generate
description: Generate Nx project configuration for submodules
usage: |
  ## Usage
  pnpm nx-generate [options]

  ## Options
  --repo <repo> (optional): Specific repo to generate (e.g., orgs/riatzukiza/promethean)
  --all (optional): Generate for all submodules

  ## Description
  Generates Nx virtual project configuration for each tracked submodule
  using the Giga Nx plugin.

  ## Examples
  pnpm nx-generate
  pnpm nx-generate --all
  pnpm nx-generate --repo orgs/riatzukiza/promethean
```
