import { createCephalonApp } from "@promethean-os/cephalon-ts";

async function run() {
  const botId = process.env.CEPHALON_BOT_ID || process.env.BOT_ID || "duck";
  const app = await createCephalonApp({ botId });
  await app.start();

  const graceful = async () => {
    try {
      await app.stop();
      process.exit(0);
    } catch (err) {
      console.error("[Shutdown] Error:", err);
      process.exit(1);
    }
  };

  process.on("SIGINT", graceful);
  process.on("SIGTERM", graceful);
}

run().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});
