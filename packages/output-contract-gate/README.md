# @workspace/output-contract-gate

Prototype runtime for contract-enforced agent output.

Current scope:
- parse list-form EDN response contracts
- normalize them into a usable IR
- parse Markdown into an AST
- validate the five-section ημ response shape deterministically
- compile bounded repair prompts from machine failures

This package is the first implementation slice for:
- `specs/drafts/contract-enforced-agent-output-pipeline-2026-03-23.md`

## Commands

```bash
pnpm --filter @workspace/output-contract-gate build
pnpm --filter @workspace/output-contract-gate test
pnpm --filter @workspace/output-contract-gate validate -- --contract ../../specs/drafts/contract-enforced-agent-output-pipeline.example.edn --response ./sample.md
```

## CLI

Validate a Markdown response against an EDN contract file:

```bash
pnpm --filter @workspace/output-contract-gate build

node devel/packages/output-contract-gate/dist/cli.js \
  --contract devel/specs/drafts/contract-enforced-agent-output-pipeline.example.edn \
  --response /tmp/candidate.md \
  --artifacts-root devel/artifacts/output-contract-gate
```

The CLI prints JSON.

- exit `0` = structure passed
- exit `1` = structure failed; JSON includes `repairPrompt`
- exit `2` = CLI/IO/contract loading error

By default the CLI writes a run bundle under:

```text
./artifacts/output-contract-gate/<run-id>/
```

Use `--artifacts-root <dir>` to override or `--no-artifacts` to suppress writing.

Current artifact bundle:
- `input.json`
- `contract.edn`
- `contract-ir.json`
- `candidate.md`
- `candidate.ast.json`
- `validation-report.json`
- `final-decision.json`
- `repair-prompt.txt` when structure fails

### Generate mode

Generate a candidate, then pipe it through the structure gate and, on success, the review stub:

```bash
node devel/packages/output-contract-gate/dist/cli.js generate \
  --contract devel/specs/drafts/contract-enforced-agent-output-pipeline.example.edn \
  --task-text "Turn this request into the required five-section response." \
  --generator fixture-valid \
  --artifacts-root devel/artifacts/output-contract-gate
```

Supported generators:
- `fixture-valid`
- `fixture-invalid`
- `openai-chat`

`openai-chat` uses an OpenAI-compatible `POST /chat/completions` transport.

Default model for `openai-chat` remains `gpt-5.4`.
`qwen3.5` was verified successfully through local `proxx`, but must be selected explicitly when desired.

Useful flags:
- `--task-file <path>`
- `--task-text <text>`
- `--generator <mode>`
- `--base-url <url>`
- `--model <id>`
- `--api-key <token>`
- `--temperature <n>`

Generate mode adds:
- `task.txt`
- `generation-report.json`

and, when structure passes, also writes:
- `review-report.json`

### Review stub

Once a structurally valid bundle exists, emit a machine-shaped stub review report:

```bash
node devel/packages/output-contract-gate/dist/cli.js review-stub \
  --bundle devel/artifacts/output-contract-gate/<run-id>
```

This writes:
- `review-report.json`

and augments:
- `final-decision.json`

The stub reviewer is deterministic and heuristic-only. It is a placeholder for the later GPT-family semantic reviewer.

## Status

Prototype only.
The first reference contract is the five-section response shape:
- Signal
- Evidence
- Frames
- Countermoves
- Next
