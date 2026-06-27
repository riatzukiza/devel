#!/usr/bin/env node

import "dotenv/config";

import { createOpencodeClient } from "@opencode-ai/sdk";

function unwrap(resp) {
  if (resp && typeof resp === "object" && "data" in resp) {
    return resp.data;
  }
  return resp;
}

function parseArgs(argv) {
  const isDryRun = argv.includes("--dry") || argv.includes("--dry-run");
  return { isDryRun };
}

function formatSession(session) {
  const id = session.id ?? "<missing-id>";
  const title = typeof session.title === "string" ? session.title.trim() : "";
  return title ? `${id} (${title})` : id;
}

async function main() {
  const { isDryRun } = parseArgs(process.argv.slice(2));
  const baseUrl = process.env.OPENCODE_BASE_URL ?? "http://localhost:4096";

  const client = createOpencodeClient({ baseUrl });
  const sessions = unwrap(await client.session.list());

  const emptySessions = [];

  for (const session of sessions) {
    const sessionId = session.id;
    if (!sessionId) continue;

    const messages = unwrap(await client.session.messages({ path: { id: sessionId } }));
    if (Array.isArray(messages) && messages.length === 0) {
      emptySessions.push(session);
    }
  }

  if (emptySessions.length === 0) {
    console.log("No empty sessions found.");
    return;
  }

  console.log(`Found ${emptySessions.length} empty session(s):`);
  for (const session of emptySessions) {
    console.log(`- ${formatSession(session)}`);
  }

  if (isDryRun) {
    console.log("Dry run enabled (--dry/--dry-run). No sessions were deleted.");
    return;
  }

  for (const session of emptySessions) {
    if (!session.id) continue;
    await client.session.delete({ path: { id: session.id } });
  }

  console.log(`Deleted ${emptySessions.length} empty session(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
