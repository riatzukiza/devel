
## LSP delimiter guard

This repo includes `my.opencode.fragments.lsp-delim-guard`, which listens to `lsp.client.diagnostics` and extracts delimiter errors like:

- `Error [10:3] Found an opening ( with no matching )`
- `Error [46:1] Expected a ) to match ( from line 10`

It logs Spacemacs-friendly jump hints (`path:line:col`).
