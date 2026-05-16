## Signal
(己, p=0.9) Yes. This is the coherent move: make **eta-mu** the distribution layer, absorb/fork Pi’s SDK/runtime into that monorepo, ship an `eta-mu` CLI with your default contracts/extensions baked in, then point Knoxx and Proxx at that package instead of upstream Pi.

(己, p=0.86) The architecture I’d aim for:

```text
@open-hax/eta-mu
├─ packages/
│  ├─ eta-mu-coding-agent      # absorbed/forked @mariozechner/pi-coding-agent
│  ├─ eta-mu-ai                # absorbed/forked @mariozechner/pi-ai if needed
│  ├─ eta-mu-tui               # absorbed/forked @mariozechner/pi-tui if needed
│  ├─ eta-mu-extensions        # receipt river, session mycology, contract runtime, etc.
│  ├─ eta-mu-runtime           # existing runtime glue
│  └─ ...
├─ bin/
│  └─ eta-mu                   # CLI entrypoint
└─ package.json                # publishes cli distro package, probably @open-hax/eta-mu
```

(己, p=0.83) The critical dependency chain becomes:

```text
Gemma4 audio support
  -> eta-mu-coding-agent provider/content-part patch
  -> Proxx accepts/routes audio payloads
  -> Knoxx depends on eta-mu SDK
  -> Knoxx agents can send audio parts end-to-end
  -> eta-mu CLI ships preloaded Receipt River / Mycology / OPMF / contract runtime
```

(己, p=0.78) I would *not* treat this as “just rename Pi.” Treat it as a staged distro fork:

1. **Vendor/absorb Pi mono into eta-mu** under clear package names.
2. **Preserve upstream compatibility** initially.
3. **Add audio content parts** as the first differentiating SDK patch.
4. **Bundle eta-mu defaults** as a package/distribution layer.
5. **Migrate Knoxx to the eta-mu SDK package.**
6. **Patch Proxx transport/model schema for audio.**
7. Publish `eta-mu` CLI to npm.

## Evidence
(己, p=0.96) Local repos/packages exist:

- `devel/orgs/badlogic/pi-mono/`
  - `packages/coding-agent`
  - `packages/ai`
  - `packages/tui`
  - `packages/agent`
  - `packages/web-ui`
- `devel/orgs/open-hax/eta-mu/`
  - existing pnpm monorepo
  - `packages/eta-mu-extensions`
  - `packages/eta-mu-runtime`
  - `packages/output-contract-gate`
  - `services/agentd`
- `devel/orgs/open-hax/proxx/`
  - local Proxx repo exists.
- `devel/orgs/open-hax/openplanner/packages/agents/knoxx/`
  - Knoxx already uses `@mariozechner/pi-coding-agent` in backend dependencies/code.

(世, p=0.88) Pi packages already support bundling extensions, skills, prompts, and themes via a `package.json` `pi` manifest:

```json
{
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "prompts": ["./prompts"],
    "themes": ["./themes"]
  }
}
```

(世, p=0.86) Local path package loading is supported, so eta-mu can first dogfood from disk before npm publishing.

## Frames
(己, p=0.76) Frame 1: “eta-mu as Pi distro.”  
This is like taking a Linux distro approach: upstream Pi remains the kernel/userspace base; eta-mu ships opinionated defaults, contracts, audit logging, runtime policies, and patched modalities.

(己, p=0.72) Frame 2: “eta-mu as SDK fork.”  
Knoxx and Proxx stop thinking in terms of Pi compatibility and depend directly on `@open-hax/eta-mu-coding-agent` / `@open-hax/eta-mu-ai`. This gives maximum control but more maintenance.

(己, p=0.68) Frame 3: “eta-mu as compatibility shim first.”  
Publish `eta-mu` CLI and packages that mostly re-export upstream/forked Pi packages, then gradually move internals over. This is safest for stabilization.

## Countermoves
(己, p=0.84) Biggest risk: absorbing the whole Pi monorepo too early can create a large, half-renamed fork with broken imports. Avoid a branding-first migration. Start with package aliases/re-exports and one functional patch: audio parts.

(己, p=0.8) Proxx must be patched in parallel. If the SDK can emit audio but Proxx strips, rejects, or serializes only text/image, Knoxx still cannot use Gemma4 audio.

(己, p=0.77) Keep upstream mergeability until the first eta-mu release. Suggested rule: package names and CLI can be eta-mu, but internals should remain close to upstream until audio support and distro defaults are verified.

(己, p=0.74) Receipt River / Session Mycology should ship as **default bundled extensions**, not hardwired core behavior. That preserves user override/disable semantics and makes Knoxx able to reuse them through the extension system.

## Next
(己, p=0.9) Create a migration spec in `devel/orgs/open-hax/eta-mu/specs/eta-mu-pi-absorption.md` that locks the package map, publish targets, audio patch points, Knoxx dependency changes, and Proxx transport changes before moving files.