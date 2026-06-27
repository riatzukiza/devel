# eta-mu-extensions-e2e

Shadow-cljs node-test harness for exercising contract runtime flows against Pi-shaped tool-call/tool-result events.

## Scope

- Uses Pi 0.67.1 event field names: `toolName`, `input`, `toolCallId`, `content`, `details`, `isError`
- Exercises contract block and fulfillment paths with scriptable fixtures
- Keeps harness local to the monorepo under `packages/`

## Run

```bash
cd packages/eta-mu-extensions-e2e
npm install
npm test
```
