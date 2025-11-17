# Inbox Document Pipeline

`docs/inbox/` is your single-gate brain dump: every idea, observation, hypothesis, or fragment of a thought lands here first. The pipeline described below keeps that folder tiny, structured, and actionable by:

1. observing new notes/brain dumps,
2. normalizing their metadata (title, tags, category),
3. routing them to categorized folders, and
4. invoking agent workers that prepare the next stage (analysis, research, implementation).

Each stage is also the trigger point for an OpenCode agent (`opencode-agent` or similar) so a `retitle` event might spark a creative summarizer, `label` triggers an ontology builder, `categorize` launches a project coach, and the `promotion` stage calls the code-generating agent that starts turning the idea into working code.

## Pipeline stages

| Stage | What happens | Agent trigger | Output folder |
| --- | --- | --- | --- |
| **Ingest (brain dump)** | Detects an unprocessed markdown/org file in `docs/inbox/`. Ensures there is a level-1 heading; fills front matter with `title` and `tags`. | `opencode-agent --stage retitle --model gpt-5-nano` (default creative summarizer). | `docs/inbox/raw/` until renamed. |
| **Label** | Runs a lightweight classifier that extracts concept tags, urgency, or mood keywords. Updates front matter with `tags` / `labels`. | `opencode-agent --stage label --model gpt-5-nano` plus local heuristics. | metadata saved inline. |
| **Categorize** | Assigns a category (e.g. `idea`, `research`, `project`, `experiment`) and moves file into `docs/inbox/categories/<category>/`. | `opencode-agent --stage categorize --model gpt-5-nano` (enriched with project context). | `docs/inbox/categories/<category>/`. |
| **Promotion** | Triggers the implementation workflow (creates tickets, spawns code scaffolds). | `opencode-agent --stage promote --model gpt-5-nano` or a more powerful agent when needed. | Moves to `docs/inbox/ready-for-code/`. |

Each stage is orchestrated by `scripts/inbox-pipeline.mjs`, which watches `docs/inbox/` for changes, runs the transformation, and then calls the agent command that is configured by the environment (see the helpers inside the script for how `PNPM_OPENCODE_AGENT` or `AGENT_COMMAND` can be overridden). The script logs everything, keeps a lockfile per-file to avoid duplicate triggers, and writes new metadata back into each note so you can audit what happened.

## Folder layout

```
docs/inbox/
├── raw/                     # newly dumped notes before processing
├── categories/             # organized ideas split by category
│   ├── idea/
│   ├── research/
│   ├── project/
│   └── experiment/
├── ready-for-code/          # promoted documents that need implementation
└── pipeline.log             # optional runtime log for the watcher
```

The pipeline uses the above structure to keep the `docs/inbox` root clean and to preserve breadcrumbs for every stage. When a file moves into `ready-for-code`, a dedicated code agent kicks off faster builds or scaffolds via the Nx/NPM toolset, tying ideas to deliverables.

## Meta pipeline & prompt effectiveness

A concurrent meta pipeline (`scripts/meta-agent-evaluator.mjs`) tests different prompt variants and evaluates how well each agent performed. It:

1. Downloads the list of hosted models from `https://models.dev/models`.
2. Filters for *free* models accessible via Opencode (`gpt-5-nano`, others listed on the portal) plus the ones offered under your z.ai coding plan.
3. Runs a battery of mini-scenarios against those models, logging completion quality, response time, and hallucination rate.
4. Chooses the best-performing prompt/model pair for each stage and writes the recommendations into `./docs/inbox/pipeline-prompt-recommendations.json`.
5. Periodically re-runs (configurable via `META_PIPELINE_INTERVAL_MS`) so changes in Opencode or z.ai offerings immediately reflect in which model backs each stage.

The meta pipeline also emits diagnostics for the Nx watch pipeline, making sure internal rebuilds and PM2 restarts happen after every file change. When a new iteration of `gpt-5-nano` or a free model appears on models.dev, the meta pipeline re-runs the evaluation suite to prove whether the new model beats the previous champion before switching production traffic over.

## Operational notes

- Gatekeeper folder `docs/inbox/` is source-of-truth: do not edit files downstream of the `categories` tree manually unless you intend to rerun the pipeline.
- `scripts/inbox-pipeline.mjs` executes in a long-lived node process; start it via `pnpm inbox:pipeline` so it watches for new files automatically.
- `scripts/meta-agent-evaluator.mjs` is meant to run as a periodic job (e.g., via a Cron PM2 entry) and writes its findings so you can map stage→agent→model.
- Agent commands are configurable through environment variables (`PNPM_OPENCODE_AGENT`, `ZAI_CODING_PLAN_TOKEN`, etc.) so you can swap models/directions without touching the scripts.

With this pipeline, your inbox becomes both the place you dump ideas and the factory that turns them, step-by-step, into code-ready work while continuously evaluating and improving the prompts that power each opencode agent stage.
