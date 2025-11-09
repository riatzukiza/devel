# Giga Nx Plugin

Generates a virtual Nx project graph from the `.gitmodules` file at the repo root.
- Each submodule under `orgs/` becomes a virtual project named `orgs-<org>-<repo>`.
- Implicit dependency: the `giga` root project depends on every submodule.
- Provides `test` and `build` targets for each virtual project, proxying to the submodule’s native tooling via the shared runner.
- Optional: can add synthetic dependencies between submodules via a simple config file.

## Registration

Add the plugin to `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "./tools/nx-plugins/giga/plugin.js",
      "options": {}
    }
  ]
}
```

## Features

- Virtual project graph (no on-disk `project.json` files needed).
- Targets: `test`, `build` delegate to `src/giga/run-submodule.ts`.
- Automatic re-generation when `.gitmodules` changes.
- Support for custom dependency map `tools/nx-plugins/giga/deps.json` (repo → array of dep repos).

## Usage

```sh
pnpm nx show projects          # lists submodules as virtual projects
pnpm nx run orgs-riatzukiza-promethean:test
pnpm nx run-many --target=test --all
pnpm affected --target=build --files=orgs/riatzukiza/promethean/src/foo.ts
```

No root `projects/` directory needed. The plugin reads `.gitmodules` directly.
