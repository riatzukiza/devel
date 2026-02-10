# Ecosystems - PM2 Process Management

ClojureScript-defined PM2 ecosystem configurations.

## OVERVIEW

`ecosystems/*.cljs` define PM2 process configurations compiled via shadow-cljs + clobber macro.

## WHERE TO LOOK

| File | Purpose |
|------|---------|
| `index.cljs` | Entry point, loads other ecosystem configs |
| `opencode.cljs` | OpenCode development processes |
| `openhax.cljs` | OpenHax application processes |
| `gates_of_aker.cljs` | Gates of Aker backend + web dev processes |
| `cephalon_stable.cljs` | Stable Cephalon services |
| `cephalon_experimental.cljs` | Experimental Cephalon services |
| `services_openplanner.cljs` | OpenPlanner services |

## COMPILATION

```bash
# Compile ecosystems to PM2 config
npx shadow-cljs release clobber

# Output: ecosystem.config.cjs (requires .clobber/index.cjs)
```

## PATTERNS

```clojure
;; ecosystems/*.cljs format
(ns ecosystem-name
  (:require [clobber.macro]))

(clobber.macro/defapp "service-name"
  {:script "node"
   :args ["dist/index.js"]
   :cwd "/path/to/service"
   :env {:NODE_ENV "production"}
   :autorestart true})
```

## PM2 MANAGEMENT

```bash
# Start all from compiled config
pm2 start ecosystem.config.cjs

# Individual process ops
pm2 list
pm2 stop <name>
pm2 restart <name>
pm2 logs <name>
pm2 monit
```

## GOTCHAS

- Edit `.cljs` files, NOT `ecosystem.config.cjs` (auto-generated)
- Run `npx shadow-cljs release clobber` after editing `.cljs`
- Services must have compiled dist/ output before starting
