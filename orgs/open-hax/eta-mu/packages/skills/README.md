# packages/skills

Harness-agnostic skill contracts for the ημΠ cognitive loop.

## Structure

```text
packages/skills/
├── core/                    # Harness-agnostic CONTRACT.edn files
│   ├── work-cycle/          # ημΠ.cognitive-loop.v1 — foundational loop
│   └── receipt-river/       # Append-only μ-trace, driver-abstracted
├── harness/                 # Harness adapter stubs
│   ├── pi/                  # ~/.pi / ~/.ημ personal install
│   ├── opencode/            # opencode plugin/agent delivery
│   ├── claude-code/         # CLAUDE.md injection + hooks API
│   └── codex/               # AGENTS.md injection + MCP packages
└── skill-registry.edn       # Top-level manifest (replaces .skill-lock.json)
```

## Canonical loop

`ημΠ.cognitive-loop.v1`

```text
P → R → N → Π → A → F → P
```

Typed morphisms:
- `P : S × H → O`
- `ρ : O → ℝ`
- `N : ℝ → ℝ_norm`
- `Π : ℝ_norm × C × G → π`
- `A : π × S → (S', μ)`
- `F : (μ, S', O) → fb`

η is only knowable via μ under feedback.  
息 (breath boundary) turns continuous loops into auditable episodes.

## Migration status

| Skill | Core migrated | Harness adapters |
|---|---|---|
| work-cycle | ✅ v0.2.0 | pi, opencode, claude-code, codex |
| receipt-river | ✅ v0.2.0 (+ driver abstraction) | pi, opencode, claude-code, codex |
| agent-runtime-state | ⏳ pi/agent/skills/ | — |
| fork-tax | ⏳ pi/agent/skills/ | — |
| regression-triage | ⏳ pi/agent/skills/ | — |
| spec-driven-dev | ⏳ pi/agent/skills/ | — |
| session-mycology | ⏳ pi/agent/skills/ | — |
| contract-governance | ⏳ pi/agent/skills/ | — |

## Receipt river drivers

| Driver | Context |
|---|---|
| `:fs` | Local filesystem — personal/pi installs, discovered by ingestion engine |
| `:db` | EventRecord table — Knoxx/cephalon cloud deploy, multi-tenant |
| `:s3` | S3-compatible blob — Dropbox/GDrive/S3 tenants |
| `:http` | Remote API — agent has no direct storage access |

The agent always sees the same tool surface regardless of driver.

## Adding a new skill

1. Write `packages/skills/core/<name>/CONTRACT.edn`
2. Add an entry to `skill-registry.edn`
3. Add `packages/skills/harness/<target>/<name>/ADAPTER.edn` for each relevant harness
4. Remove the `pi/agent/skills/<name>/` entry from skill-registry.edn TODO list
