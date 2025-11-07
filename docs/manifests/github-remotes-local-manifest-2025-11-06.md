# GitHub Remotes — Local Clones Grouped by Owner (from remotes)

Scanned: 30 repos (.git/config) under /home/err/devel
Method: parsed `[remote "origin"] url = ...` in each config and grouped by GitHub owner.

Note: Some repos also have fork remotes (e.g., `fork` → `riatzukiza/*`); grouping below uses the `origin` owner.

## github.com/sst (4)
- stt/opencode → git@github.com:sst/opencode.git
- stt/opencode-bench → git@github.com:sst/opencode-bench.git
- stt/opencode-sdk-python → git@github.com:sst/opencode-sdk-python.git
- stt/opentui → git@github.com:sst/opentui.git

## github.com/riatzukiza (16)
- agent-shell → git@github.com:riatzukiza/agent-shell.git
- dotfiles → git@github.com:riatzukiza/dotfiles.git
- promethean → git@github.com:riatzukiza/promethean.git
- promethean/packages/autocommit → git@github.com:riatzukiza/autocommit.git
- promethean/packages/kanban → git@github.com:riatzukiza/kanban.git
- promethean/packages/mcp → git@github.com:riatzukiza/mcp.git
- promethean/packages/naming → git@github.com:riatzukiza/naming.git
- promethean/packages/persistence → git@github.com:riatzukiza/persistence.git
- promethean/packages/utils → git@github.com:riatzukiza/utils.git
- riatzukiza/book-of-shadows → git@github.com:riatzukiza/book-of-shadows.git
- riatzukiza/desktop → git@github.com:riatzukiza/desktop.git
- riatzukiza/goblin-lessons → git@github.com:riatzukiza/goblin-lessons.git
- riatzukiza/openhax → git@github.com:riatzukiza/openhax.git
- riatzukiza/riatzukiza.github.io → git@github.com:riatzukiza/riatzukiza.github.io.git
- stt → git@github.com:riatzukiza/stt.git
- devel (workspace root) → git@github.com:riatzukiza/devel.git

## github.com/openai (1)
- openai/codex → org-14957082@github.com:openai/codex.git

## github.com/moofone (1)
- moofone/codex-ts-sdk → git@github.com:moofone/codex-ts-sdk.git

## github.com/bhauman (1)
- clojure-mcp → git@github.com:bhauman/clojure-mcp.git

## github.com/kcrommett (1)
- opencode-web → git@github.com:kcrommett/opencode-web.git

## github.com/numman-ali (1)
- opencode-openai-codex-auth → git@github.com:numman-ali/opencode-openai-codex-auth.git

## github.com/alacritty (1)
- .config/alacritty/themes → https://github.com/alacritty/alacritty-theme.git

## No origin remote (ignored)
- promethean/packages/kanban/test-* (temporary test repos)
- .config/opencode (no remote configured)

If you want, I can generate “accessible vs tracked” manifests for any owner above using `gh repo list <owner>` and compute the gap set (repos you can access but haven’t cloned).