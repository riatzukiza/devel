# Devel Workspace

Multi-repository development workspace with git submodules and TypeScript/ESLint configuration.

## Commands

**Workspace:**
- `pnpm lint` - Lint all TypeScript files
- `pnpm typecheck` - Type check with strict TypeScript
- `pnpm build` - Build workspace (if src/ exists)
- `bun run src/hack.ts` - Run the main utility script

**Submodule workflows:**
- `cd promethean && pnpm --filter @promethean-os/<pkg> <command>`
- `cd stt/opencode && bun dev` (opencode development)

## Code Style

**ESLint enforced:**
- ESM modules only (no require/module.exports)
- Functional programming: prefer const, avoid let, no classes
- TypeScript strict: no any, explicit types, readonly parameters
- Import order: builtin → external → internal → sibling → index
- Max 100 lines per function, 15 cognitive complexity
- Max 4 parameters per function, max 600 lines per file

**Testing:**
- Use `sleep` from test utils instead of setTimeout
- Mock at module boundaries with esmock
- Tests in src/tests/, deterministic and parallel-friendly

## Development

- Submodules: promethean, stt/, dotfiles, clojure-mcp, agent-shell
- TypeScript config: es2022, commonjs, strict mode
- ESLint with functional, sonarjs, promise plugins
- Use Bun APIs when available (Bun.file(), etc.)
- No default exports, prefer named exports
- Avoid try/catch statements when possible