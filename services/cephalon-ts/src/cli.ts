#!/usr/bin/env node

import { createCephalonApp } from "./app.js";

async function run(): Promise<void> {
  const discordToken = process.env.DUCK_DISCORD_TOKEN;
  if (!discordToken) {
    console.error("[Error] DUCK_DISCORD_TOKEN not set");
    process.exit(1);
  }

  const app = await createCephalonApp({ discordToken });
  await app.start();

  const graceful = async (signal: string) => {
    try {
      await app.stop(signal);
      process.exit(0);
    } catch (err) {
      console.error("[Shutdown] Error:", err);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => graceful("SIGINT"));
  process.on("SIGTERM", () => graceful("SIGTERM"));
}

run().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});
