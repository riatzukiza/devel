#!/usr/bin/env node
/* eslint-disable no-console */

import "dotenv/config";

import { ChromaClient } from "chromadb";

async function deleteCollections() {
  const chroma = new ChromaClient({
    path: process.env.CHROMA_URL ?? "http://localhost:8000",
  });

  const collections = ["opencode_messages_v1", "reconstitute_notes_v1"];

  for (const name of collections) {
    try {
      await chroma.deleteCollection({ name });
      console.log(`✓ Deleted collection: ${name}`);
    } catch (e: any) {
      if (e.message?.includes("not found")) {
        console.log(`○ Collection not found (skipping): ${name}`);
      } else {
        console.error(`✗ Failed to delete ${name}:`, e.message);
      }
    }
  }

  console.log("\nCollections deleted. Now run:");
  console.log("  BATCH_SIZE=8 pnpm reconstitute index");
}

deleteCollections().catch((e) => {
  console.error(e);
  process.exit(1);
});
