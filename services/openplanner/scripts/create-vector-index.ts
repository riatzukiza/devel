#!/usr/bin/env npx tsx
/**
 * create-vector-index.ts
 *
 * Idempotent script to create Atlas vector search indexes on the openplanner
 * MongoDB database. Works against both AtlasCLI local deployment and Atlas cloud.
 *
 * Usage:
 *   MONGODB_URI="mongodb://..." npx tsx scripts/create-vector-index.ts
 *
 * Environment:
 *   MONGODB_URI           - MongoDB connection string (required)
 *   MONGODB_DB            - Database name (default: openplanner)
 *   EMBEDDING_DIMENSIONS  - Vector dimensions (default: 1024)
 *   COLLECTIONS           - Comma-separated list of collections to index
 *                           (default: graph_node_embeddings,event_chunks)
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || 'openplanner';
const EMBEDDING_DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS || '1024', 10);
const COLLECTIONS = (process.env.COLLECTIONS || 'graph_node_embeddings,event_chunks').split(',');

interface IndexDefinition {
  name: string;
  type: 'vectorSearch';
  definition: {
    fields: Array<{
      type: 'vector' | 'filter';
      path: string;
      numDimensions?: number;
      similarity?: string;
    }>;
  };
}

const INDEX_DEFINITIONS: Record<string, IndexDefinition> = {
  graph_node_embeddings: {
    name: 'embedding_vector',
    type: 'vectorSearch',
    definition: {
      fields: [
        { type: 'vector', path: 'embedding', numDimensions: EMBEDDING_DIMENSIONS, similarity: 'cosine' },
        { type: 'filter', path: 'project' },
        { type: 'filter', path: 'embedding_model' },
      ],
    },
  },
  event_chunks: {
    name: 'chunk_vector',
    type: 'vectorSearch',
    definition: {
      fields: [
        { type: 'vector', path: 'embedding', numDimensions: EMBEDDING_DIMENSIONS, similarity: 'cosine' },
        { type: 'filter', path: 'project' },
        { type: 'filter', path: 'source' },
      ],
    },
  },
  compacted_vectors: {
    name: 'compacted_vector',
    type: 'vectorSearch',
    definition: {
      fields: [
        { type: 'vector', path: 'embedding', numDimensions: EMBEDDING_DIMENSIONS, similarity: 'cosine' },
        { type: 'filter', path: 'project' },
      ],
    },
  },
};

async function main() {
  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  console.log(`Connected to MongoDB: ${MONGODB_DB}`);
  console.log(`Embedding dimensions: ${EMBEDDING_DIMENSIONS}`);
  console.log(`Collections to index: ${COLLECTIONS.join(', ')}`);
  console.log('---');

  for (const collName of COLLECTIONS) {
    const indexDef = INDEX_DEFINITIONS[collName];
    if (!indexDef) {
      console.log(`SKIP: No index definition for collection "${collName}"`);
      continue;
    }

    try {
      // Check if the collection exists and has documents
      const collections = await db.listCollections({ name: collName }).toArray();
      if (collections.length === 0) {
        console.log(`SKIP: Collection "${collName}" does not exist yet`);
        continue;
      }

      const docCount = await db.collection(collName).countDocuments();
      console.log(`Collection "${collName}": ${docCount} documents`);

      // List existing search indexes
      let existingIndexes: any[] = [];
      try {
        const listResult = await db.runCommand({ listSearchIndexes: collName });
        existingIndexes = listResult.cursor?.firstBatch || [];
      } catch (err: any) {
        console.log(`  WARN: Cannot list search indexes: ${err.message}`);
        console.log(`  This may indicate AtlasCLI local deployment is not running.`);
        console.log(`  Attempting creation anyway...`);
      }

      const alreadyExists = existingIndexes.some(
        (idx: any) => idx.name === indexDef.name
      );

      if (alreadyExists) {
        const existing = existingIndexes.find((idx: any) => idx.name === indexDef.name);
        console.log(`  Index "${indexDef.name}" already exists (status: ${existing.status || 'unknown'})`);
        continue;
      }

      // Create the index
      console.log(`  Creating index "${indexDef.name}"...`);
      const result = await db.runCommand({
        createSearchIndexes: collName,
        indexes: [indexDef],
      });
      console.log(`  Result: ${JSON.stringify(result)}`);
    } catch (err: any) {
      console.error(`  ERROR creating index on "${collName}": ${err.message}`);
      // Continue to next collection instead of failing entirely
    }
  }

  console.log('---');
  console.log('Done. Indexes may take time to build; check status with:');
  console.log(`  mongosh "${MONGODB_URI}" --eval 'db.runCommand({listSearchIndexes: "graph_node_embeddings"})'`);

  await client.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
