# Cephalon Bot Service

Runs **one** Cephalon bot per process. This is the recommended way to operate multiple personalities at once.

## Run locally

```bash
pnpm install

# Duck (uses DUCK_DISCORD_TOKEN)
CEPHALON_BOT_ID=duck pnpm -C services/cephalon-bot dev

# Janitor (uses JANITOR_DISCORD_TOKEN)
CEPHALON_BOT_ID=janitor pnpm -C services/cephalon-bot dev
```

## Configure bots

Edit bot definitions in:

- `packages/cephalon-ts/src/config/bots.ts`

Each bot config can define:

- `cephalonId` (self-name)
- `discordTokenEnv`
- `sessions` (persona + priority routing)
- `tick` (proactive loop interval + target session)
- persistence namespacing (`mongoDbName`, `mongoCollectionName`)
- chroma namespacing (`collectionName`)

## PM2

See `services/cephalon-bot/ecosystem.cljs` for an example of running multiple bot processes.
