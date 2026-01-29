# Skill: Workspace Typecheck

## Goal
Type check all TypeScript files across the entire workspace, including all submodules under `orgs/**`, using strict TypeScript settings.

## Use This Skill When
- You need to verify type safety across multiple repositories
- You are about to commit changes and want to ensure type compliance
- You want to catch type errors before running build or tests

## Do Not Use This Skill When
- You are only working in a single submodule and can run its own typecheck
- The change is unrelated to TypeScript files

## Inputs
- File paths to typecheck (default: all `.ts` files in workspace and submodules)
- TypeScript config to use (default: `tsconfig.json`)

## Steps
1. Run `pnpm typecheck` to typecheck all TypeScript files across the workspace
2. Script uses `tsconfig.json` from workspace root
3. Checks all `src/` files and recursively `orgs/**` directories
4. Reports all type errors

## Output
- Type error summary
- File paths, line numbers, and error messages
- Exit code 1 if any type errors found, 0 otherwise

## Strong Hints
- **TypeScript Strict**: Uses strict mode with all type-checking options enabled
- **Target**: ES2022 module system
- **No Any**: No `any` types allowed
- **Explicit Types**: All parameters must have explicit types
- **ReadOnly**: Prefer `readonly` parameters where appropriate
- **Sync Submodules**: Typecheck may fail if submodules have issues

## Common Commands

### Typecheck All Workspace Files
```bash
# Typecheck all TypeScript files
pnpm typecheck

# Run Octavia typecheck (workspace-specific)
pnpm test:octavia

# Typecheck Octavia with coverage
pnpm test:octavia:coverage
```

### Typecheck Specific Submodule
```bash
# Navigate to submodule and run its typecheck
cd orgs/riatzukiza/promethean
pnpm typecheck

# Or from workspace root
cd orgs/riatzukiza/promethean && pnpm typecheck
```

## References
- TypeScript config: `tsconfig.json`
- Typecheck script: `package.json` → `test:octavia`
- Octavia runner: `src/octavia/runner.ts`

## Important Constraints
- **TypeScript Strict**: Uses strict mode with all type-checking options enabled
- **Target**: ES2022 module system
- **No Any**: No `any` types allowed
- **Explicit Types**: All parameters must have explicit types
- **ReadOnly**: Prefer `readonly` parameters where appropriate
- **Submodule State**: Typecheck may fail if submodules have uncommitted changes or issues

## Error Handling
- **Uncommitted Changes**: Submodules with uncommitted changes may fail typechecking
- **Dependency Issues**: Missing dependencies in submodules cause failures
- **Type Errors**: Script exits with code 1 on any type errors
- **Build Issues**: Typecheck runs before build; build failures may be related to types

## Output Format
```
❌ /path/to/file.ts:42:5 error: Type 'string' is not assignable to type 'number'.
❌ /path/to/file.ts:78:12 error: Parameter 'x' implicitly has an 'any' type.
```
