## Signal

(己, p=0.98) Fixed.

Changed `orgs/open-hax/proxx/Dockerfile`:

- `node:22-bookworm-slim` → `node:22-trixie-slim`
- `openjdk-17-jre-headless` → `openjdk-21-jre-headless`

This resolves:

```text
UnsupportedClassVersionError
class file version 65.0
this Java Runtime only recognizes up to 61.0
```

because class file `65.0` requires Java 21.

## Evidence

(己, p=0.97) Verified the exact failing command now succeeds:

```bash
cd services/proxx
docker compose --profile prod build
```

Result:

```text
Image proxx-local-proxx Built
```

(己, p=0.95) Commits:

- Proxx submodule: `1786ec9 Use Java 21 for shadow-cljs Docker builds`
- Workspace root: `08b787f2 Update Proxx Java runtime for Docker build`

## Frames

(己, p=0.9) The breakage came from newer Closure Compiler / shadow-cljs deps requiring Java 21 bytecode.

(己, p=0.88) Debian bookworm’s default OpenJDK 17 cannot load class version 65; trixie provides OpenJDK 21 cleanly.

## Countermoves

(己, p=0.9) Docker no-root policy remains satisfied: container still ends with `USER node`.

(己, p=0.86) I staged/committed only the Dockerfile/submodule pointer changes; existing untracked Proxx notes were preserved.

## Next

(己, p=0.94) Re-run `cd services/proxx && docker compose --profile prod up -d` when you want the rebuilt image running.