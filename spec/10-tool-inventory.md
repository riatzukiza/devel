# MCP Migration Spec — Tool Inventory

Source of truth for the legacy tool list is `orgs/riatzukiza/promethean/services/mcp/src/index.ts` (`toolCatalog`).

## Legacy tool IDs

### Meta
- `mcp_help`
- `mcp_toolset`
- `mcp_endpoints`
- `mcp_validate_config`

### Files
- `files_list_directory`
- `files_tree_directory`
- `files_view_file`
- `files_write_content`
- `files_write_lines`
- `files_search`

### Exec
- `exec_run`
- `exec_list`

### Process manager
- `process_get_task_runner_config`
- `process_update_task_runner_config`
- `process_enqueue_task`
- `process_stop`
- `process_get_queue`
- `process_get_stdout`
- `process_get_stderr`

### GitHub (API + PR + review)
- `github_request`
- `github_graphql`
- `github_rate_limit`
- `github_contents_write`
- `github_workflow_get_run_logs`
- `github_workflow_get_job_logs`
- `github_apply_patch`

PR data
- `github_pr_get`
- `github_pr_files`
- `github_pr_resolve_position`

PR review flow
- `github_pr_review_start`
- `github_pr_review_comment_inline`
- `github_pr_review_submit`

Review automation
- `github_review_open_pull_request`
- `github_review_get_comments`
- `github_review_get_review_comments`
- `github_review_submit_comment`
- `github_review_request_changes_from_codex`
- `github_review_submit_review`
- `github_review_get_action_status`
- `github_review_commit`
- `github_review_push`
- `github_review_checkout_branch`
- `github_review_create_branch`
- `github_review_revert_commits`

### Dev tooling
- `pnpm_install`
- `pnpm_add`
- `pnpm_remove`
- `pnpm_run_script`
- `nx_generate_package`
- `apply_patch`

### TDD
- `tdd_scaffold_test`
- `tdd_changed_files`
- `tdd_run_tests`
- `tdd_start_watch`
- `tdd_get_watch_changes`
- `tdd_stop_watch`
- `tdd_coverage`
- `tdd_property_check`
- `tdd_mutation_score`

### Sandboxes
- `sandbox_create`
- `sandbox_list`
- `sandbox_delete`

### Ollama
- `ollama_pull`
- `ollama_list_models`
- `ollama_list_templates`
- `ollama_create_template`
- `ollama_enqueue_generate_job`
- `ollama_enqueue_chat_completion`
- `ollama_enqueue_job_from_template`
- `ollama_start_conversation`
- `ollama_get_queue`
- `ollama_remove_job`

## Already-migrated tool IDs (new-style)
`services/mcp-fs-oauth` and `services/mcp-files` expose `fs_*` tools (`fs_list`, `fs_read`, `fs_write`, `fs_delete`, `fs_tree`, etc.) and may include discovery tools (`fs_glob`, `fs_grep`).

## Key compatibility concern
Legacy file tools use `files_*` IDs; migrated FS tools use `fs_*`. Plan for compatibility is documented in `spec/50-tool-id-compat.md`.
