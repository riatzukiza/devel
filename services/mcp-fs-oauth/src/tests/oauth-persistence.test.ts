import { afterEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { DuckDBPersistence } from "../auth/duckDbPersistence.js";
import { InMemoryClientsStore } from "../auth/inMemoryClients.js";

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((target) => rm(target, { recursive: true, force: true })));
});

async function createTempDbPath(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "mcp-fs-oauth-persistence-"));
  cleanupPaths.push(dir);
  return path.join(dir, "oauth.db");
}

describe("OAuth persistence", () => {
  it("persists dynamically registered clients across store instances", async () => {
    const dbPath = await createTempDbPath();

    const persistenceA = new DuckDBPersistence(dbPath);
    await persistenceA.init();
    const storeA = new InMemoryClientsStore([], persistenceA);

    const registered = await storeA.registerClient({
      client_name: "Persistence Test Client",
      redirect_uris: ["https://example.com/callback"],
      token_endpoint_auth_method: "client_secret_basic",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    });

    await persistenceA.stop();

    const persistenceB = new DuckDBPersistence(dbPath);
    await persistenceB.init();
    const storeB = new InMemoryClientsStore([], persistenceB);

    const hydrated = await storeB.getClient(registered.client_id);
    expect(hydrated).toBeDefined();
    expect(hydrated?.client_id).toBe(registered.client_id);
    expect(hydrated?.client_secret).toBe(registered.client_secret);
    expect(hydrated?.client_name).toBe("Persistence Test Client");
    expect(hydrated?.redirect_uris).toEqual(["https://example.com/callback"]);
    expect(hydrated?.token_endpoint_auth_method).toBe("client_secret_basic");

    await persistenceB.stop();
  });
});
