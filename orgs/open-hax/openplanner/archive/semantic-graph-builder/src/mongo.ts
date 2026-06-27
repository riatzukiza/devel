import { MongoClient } from "mongodb";
import type { SemanticGraphBuilderConfig } from "./config.js";

export async function connectMongo(config: SemanticGraphBuilderConfig): Promise<MongoClient> {
  const client = new MongoClient(config.mongoUri, {
    connectTimeoutMS: 10_000,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 30_000,
  });

  await client.connect();

  const adminDb = client.db(config.mongoDbName);
  const result = await adminDb.command({ ping: 1 });
  if (!result?.ok) {
    await client.close();
    throw new Error(`MongoDB ping failed for ${config.mongoDbName}`);
  }

  return client;
}