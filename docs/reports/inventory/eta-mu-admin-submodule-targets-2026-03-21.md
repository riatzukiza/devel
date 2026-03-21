# Eta-mu rollout candidate inventory — 2026-03-21

- total GitHub-backed targets discovered: `56`
- admin-eligible targets: `39`

## First 20 admin-eligible targets

| repo | path | default branch |
| --- | --- | --- |
| `riatzukiza/devel` | `.` | `main` |
| `riatzukiza/promethean` | `orgs/riatzukiza/promethean` | `main` |
| `riatzukiza/dotfiles` | `orgs/riatzukiza/dotfiles` | `main` |
| `riatzukiza/agent-shell` | `orgs/riatzukiza/agent-shell` | `main` |
| `riatzukiza/openhax` | `orgs/riatzukiza/openhax` | `main` |
| `riatzukiza/ollama-benchmarks` | `orgs/riatzukiza/ollama-benchmarks` | `main` |
| `riatzukiza/riatzukiza.github.io` | `orgs/riatzukiza/riatzukiza.github.io` | `main` |
| `riatzukiza/desktop` | `orgs/riatzukiza/desktop` | `master` |
| `riatzukiza/book-of-shadows` | `orgs/riatzukiza/book-of-shadows` | `main` |
| `riatzukiza/goblin-lessons` | `orgs/riatzukiza/goblin-lessons` | `main` |
| `riatzukiza/stt` | `orgs/riatzukiza/stt` | `main` |
| `open-hax/codex` | `orgs/open-hax/codex` | `dev` |
| `open-hax/agent-actors` | `orgs/open-hax/agent-actors` | `main` |
| `open-hax/opencode-skills` | `orgs/open-hax/opencode-skills` | `main` |
| `open-hax/clients` | `orgs/open-hax/clients` | `main` |
| `open-hax/cljs-plugin-template` | `orgs/open-hax/cljs-plugin-template` | `main` |
| `open-hax/openhax` | `orgs/open-hax/openhax` | `main` |
| `open-hax/codex` | `orgs/open-hax/plugins/codex` | `dev` |
| `open-hax/workbench` | `orgs/open-hax/workbench` | `main` |
| `octave-commons/helm` | `orgs/octave-commons/helm` | `device/yoga` |

## Notes

- Eligibility currently means `viewerPermission == ADMIN` from `gh repo view`.
- Read-only / external upstreams are kept in the JSON report but excluded from direct install mode.
- Install wrappers with `pnpm github:eta-mu:rollout install --repo <owner/repo> --apply`.
