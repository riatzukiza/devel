# Spec Draft: Root pack-limit rewrite and artifact guards

## Context
The root `feature/threat-radar-platform` branch accumulated very large generated artifacts, causing GitHub to reject pushes with `pack exceeds maximum allowed size (2.00 GiB)`.

## Findings
- The dominant offenders are `services/proxx/db-backups/*`.
- Secondary weight comes from `labs/*/runs/**` model artifacts.
- Existing pre-commit only scanned secrets and existing pre-push only typechecked; neither blocked large generated artifacts.

## Risks
- History rewrite will replace the local branch lineage after `origin/feature/threat-radar-platform`.
- Without explicit guards, backup dumps and run outputs can be recommitted and recreate the push failure.

## Plan
1. Add ignore rules for backup dumps, lab run outputs, and Python bytecode caches.
2. Harden `.hooks/pre-commit-secrets.sh` so it:
   - blocks staged backup/run/cache artifacts
   - blocks oversized staged blobs
   - uses `detect-secrets-hook` directly instead of parsing `detect-secrets scan` JSON output
3. Harden `.hooks/pre-push-typecheck.sh` so it fails fast when the push range contains:
   - blocked generated/runtime artifact paths
   - oversized new blobs
4. Rewrite the root branch in a disposable clone to remove:
   - `services/proxx/db-backups/*`
   - `labs/parameter-golf-ant-lab/runs/**`
   - Python bytecode cache files
5. Force-push the rewritten branch and reinstall hooks locally.

## Definition of done
- Root branch push succeeds to `origin/feature/threat-radar-platform`.
- `.gitignore` blocks the offending artifact classes.
- Pre-commit blocks staged backup/run/cache artifacts and oversized blobs.
- Pre-push blocks oversized/history-level artifact regressions before network push.