# MCP Migration Spec — Tool ID Compatibility

## Why this matters
Workflows and clients often reference tools by **tool ID**. The legacy monolith uses IDs like `files_list_directory` while the migrated FS services expose `fs_list`.

Breaking tool IDs breaks:
- existing workflow specs
- saved configurations
- clients that hardcode tool names

## Strategy
Provide aliases during migration.

### Alias rule
For each affected tool, register both:
- the new canonical ID (preferred)
- the legacy ID (alias)

Example (files):
- `fs_list` (canonical)
- `files_list_directory` (alias) → calls the same implementation

## Required alias mappings

### Files
- `files_list_directory` → `fs_list`
- `files_view_file` → `fs_read`
- `files_write_content` → `fs_write` (content)
- `files_write_lines` → `fs_write` (line-edit mode, if supported)
- `files_tree_directory` → `fs_tree`
- `files_search` → `fs_grep` or `fs_search`

## Deprecation
Once workflows are updated, legacy IDs can be removed in stages:
1. Log warnings on legacy IDs
2. Document replacement
3. Remove after a defined cutoff

