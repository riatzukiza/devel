import { drumClip, melodyClip, writeClipsToMidi, wavToOgg, playInVoice } from "./src/index.js";
import { Client, GatewayIntentBits } from "discord.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function main() {
  const TOKEN = process.env.DISCORD_BOT_TOKEN;
  const GUILD_ID = process.env.DISCORD_GUILD_ID;
  const VOICE_CHANNEL_ID = process.env.DISCORD_VOICE_CHANNEL_ID;

  if (!TOKEN || !GUILD_ID || !VOICE_CHANNEL_ID) {
    throw new Error("Missing env vars: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_VOICE_CHANNEL_ID");
  }

  console.log("Composing sillyshit motif...");
  const d = drumClip({ pattern: "x---x---x---x---" });
  const m = melodyClip({ root: "C4", scaleName: "minor", degrees: [0, 2, 4, 6], pattern: "x-x-x-x-x-x-x-x-" });

  const midiPath = path.join(process.cwd(), "sillyshit.mid");
  writeClipsToMidi([d, m], midiPath);

  console.log("Rendering MIDI to WAV via fluidsynth...");
  const wavPath = path.join(process.cwd(), "sillyshit.wav");
  const sf2Path = "/usr/share/sounds/sf2/FluidR3_GM.sf2";
  execSync(`fluidsynth -n ${sf2Path} ${midiPath} -F ${wavPath}`);

  console.log("Converting WAV to OGG...");
  const oggPath = await wavToOgg(wavPath);

  console.log("Connecting to Discord...");
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
  await client.login(TOKEN);
  
  console.log("Wait for ready...");
  await new Promise(res => client.once("ready", res));

  console.log("Dropping beat in VC...");
  try {
    await playInVoice({ client, guildId: GUILD_ID, channelId: VOICE_CHANNEL_ID, audioPath: oggPath });
  } catch (e) {
    console.error("Play error:", e);
  }
  console.log("Beat dropped successfully.");
  
  process.exit(0);
}

main().catch(err => {
  console.error("Error dropping beat:", err);
  process.exit(1);
});
