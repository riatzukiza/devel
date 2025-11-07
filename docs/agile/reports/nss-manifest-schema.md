# Nested Submodule Manifest Schema

Version: 0.1.0
Date: 2025-11-05

## Top-Level Structure
```yaml
version: "0.1.0"
generatedAt: "2025-11-05T00:00:00.000Z"
root: "/home/err/devel"
generator:
  name: "nss manifest init"
  version: "0.1.0"
repositories: []
profiles: []
```

- `version`: schema revision, locked to `0.1.0` for compatibility checks.
- `generatedAt`: ISO-8601 timestamp for reproducibility and drift detection.
- `root`: canonical absolute path of the workspace root used during generation.
- `generator`: metadata for the CLI version that produced the manifest.
- `repositories`: ordered list of repository descriptors (see below).
- `profiles`: reusable subsets of repositories for selective operations (workstation, CI, etc.).

## Repository Descriptor (`repositories[]`)
| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Human-readable handle derived from `.gitmodules` section |
| `path` | string | Path relative to manifest `root`; `.` for root repo |
| `url` | string | Remote URL or relative local path |
| `depth` | integer | Nesting depth from manifest root |
| `category` | enum | `core`, `support`, `test`, `sandbox`, `local` |
| `auth` | discriminated union | Strategy-specific fields below |
| `branch` | string? | Default branch to track (omitted for test/sandbox snapshots) |
| `tag` | string? | Optional pinned tag |
| `pinnedCommit` | string? | Frozen commit hash when required |
| `sparseCheckout` | string[]? | Sparse patterns for large repos |
| `hooks` | Hook[]? | Post-clone/sync or pre-commit/push scripts |
| `dependsOn` | string[]? | Logical dependencies (parent path by default) |
| `metadata` | map? | Free-form key-value (strings, numbers, booleans, string arrays) |

### Authentication Strategy (`auth`)
```ts
{ type: 'ssh', identityFile?: string, useAgent?: boolean }
{ type: 'https', tokenEnv?: string }
{ type: 'github-app', appIdEnv: string, installationIdEnv: string, privateKeyPath?: string }
{ type: 'local', relativePath: string }
```

### Hooks
```ts
{
  name: string;
  when: 'post-clone' | 'post-sync' | 'pre-commit' | 'pre-push';
  run: string;           // command to execute
  shell?: 'bash' | 'sh' | 'pwsh' | 'cmd';
  timeoutSec?: number;   // up to 3600
  continueOnError?: boolean;
}
```

## Profiles (`profiles[]`)
- `name`: unique identifier (e.g., `all`, `workstation`, `ci`).
- `description`: short summary of intent.
- `include`: non-empty list of repository names.
- `exclude`: optional list to subtract from `include` (defaults to empty).
- `overrides`: repo-specific adjustments (category, branch, auth, hooks).

## Validation Guarantees
- Powered by Zod schema (`src/nss/schema.ts`); errors surface precise field paths.
- Repository list must be non-empty; parser enforces unique categories via inference.
- Hook timeouts limited to one hour to prevent hung bootstrap flows.
- `github-app` strategy requires both `appIdEnv` and `installationIdEnv`.

## Generation Defaults
- Category inference based on path + URL heuristics (local/test/sandbox detection).
- Workstation profile excludes `test` and `sandbox` repos; CI profile restricts to `core` + `support`.
- HTTPS auth uses `NSS_GIT_HTTP_TOKEN`; GitHub App entries default to `NSS_GITHUB_APP_ID` / `NSS_GITHUB_INSTALLATION_ID`.
- Metadata captures `absolutePath`, `parent`, and `workspaceRoot` to assist future tooling.

## Future Extensions
1. Extend `metadata` to accept structured objects once schema negotiator is in place.
2. Add environment blocks for token sourcing and machine-specific overrides.
3. Support profile inheritance and conditions (e.g., `platform == macOS`).
4. Persist last-known commit hashes to fast-path drift detection.
5. Allow declarative sparse-checkout templates referencing shared patterns.
