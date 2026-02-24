([past chat][1])([past chat][1])([past chat][1])([past chat][1])([past chat][1])


### `services/cephalon-ts`

* your **typescript cephalon** runtime (discord/tools loop, cli, etc.).
* still outputs **both esm + cjs**, so it can be consumed from the cljs runtime.

### `services/cephalon-cljs`

* a more complete **clojurescript cephalon** core (ecs-ish structure, systems, context assembler, session plumbing).
* **now boots the typescript runtime automatically** via `promethean.bridge.cephalon-ts` at startup:

  * pulls token from `discord_token` (or `discord_bot_token`).
  * calls `createcephalonapp` and `.start()`.

### `packages/`

* pulled in your more complete packages:

  * `@promethean-os/event`
  * `@promethean-os/fsm`
  * `@promethean-os/utils`
  * `@promethean-os/persistence` (plus small stubs to satisfy workspace deps)
* added minimal workspace stubs so installs don’t fail:

  * `@promethean-os/embedding` (implements `remoteembeddingfunction.fromconfig(...)`)
  * `@promethean-os/logger`
  * `@promethean-os/test-utils`

### `docs/notes/cephalon/`

* your cephalon notes from `cephalon_notes.zip`.

## quickstart

> assumes you’re using `pnpm` in your environment (recommended for this workspace).

```bash
pnpm install
```

### run the cljs “brain” (which starts the ts runtime)

```bash
export discord_token="..."
pnpm -c services/cephalon-cljs dev
```

### run the ts runtime directly (optional)

```bash
export discord_token="..."
pnpm -c services/cephalon-ts dev
```

## key wiring point

* `services/cephalon-cljs/src/promethean/main.cljs`
  * calls `ts/start-ts-cephalon!` early in `-main`

* `services/cephalon-cljs/src/promethean/bridge/cephalon_ts.cljs`
  * loads `@promethean-os/cephalon` via `js/require`
  * creates + starts the ts app


[1]: https://chatgpt.com/c/697fa31a-ea6c-832b-bd84-5144694c7cdc "ollama llm integration issues"
