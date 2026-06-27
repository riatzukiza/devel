#!/usr/bin/env node
/**
 * Session Recovery Script - Index and extract all OpenCode sessions
 */

import { DualStoreManager } from '@promethean-os/persistence';
import { ollamaEmbed } from '@promethean-os/utils';

// Configuration
const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const COLLECTION_PREFIX = process.env.COLLECTION_PREFIX || 'sessions_';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'qwen3-embedding:8b';
const EMBEDDING_CTX_SIZE = parseInt(process.env.EMBEDDING_CTX_SIZE || '32768');

// Store instances
let contextStore = null;

async function initializeStores() {
  console.log('🔧 Initializing stores...');

  try {
    // Initialize ChromaDB connection
    contextStore = await DualStoreManager.create('context', 'text', 'timestamp', {
      chroma: {
        url: CHROMA_URL,
        prefix: COLLECTION_PREFIX,
      },
    });
    console.log('✅ Connected to ChromaDB');
  } catch (error) {
    console.error('❌ Failed to initialize stores:', error);
    process.exit(1);
  }
}

async function listAllSessions() {
  console.log('\n📋 Listing all sessions...\n');

  try {
    const sessionCollection = contextStore!.collections!.get('sessions');

    if (!sessionCollection) {
      console.log('⚠️  No sessions collection found');
      return;
    }

    // Get all documents from collection
    const count = await sessionCollection.count();
    console.log(`📊 Total sessions: ${count}\n`);

    // Query all sessions with high limit
    const results = await sessionCollection.queryByEmbedding([], {
      nResults: count + 1000, // Get all with buffer
    });

    if (results.length === 0) {
      console.log('⚠️  No sessions found');
      return;
    }

    // Group sessions by type
    const sessionsByType = new Map();
    for (const result of results) {
      const metadata = result.metadata || {};
      const type = metadata.type || 'unknown';

      if (!sessionsByType.has(type)) {
        sessionsByType.set(type, []);
      }
      sessionsByType.get(type).push(result);
    }

    // Display sessions grouped by type
    for (const [type, sessions] of sessionsByType) {
      console.log(`\n📁 ${type.toUpperCase()} SESSIONS (${sessions.length}):`);
      console.log('─'.repeat(50));

      for (const session of sessions.slice(0, 20)) {
        const id = session.id || 'unknown';
        const title = session.metadata?.title || 'Untitled';
        const messageCount = session.metadata?.messageCount || 0;
        const createdAt = session.metadata?.createdAt
          ? new Date(session.metadata.createdAt).toISOString()
          : 'unknown';

        console.log(`  ${id}: ${title}`);
        console.log(`     Messages: ${messageCount} | Created: ${createdAt}`);
        console.log(`     Embedding: ${session.embedding?.length || 0} dims`);
      }

      if (sessions.length > 20) {
        console.log(`  ... and ${sessions.length - 20} more`);
      }
    }

    return results;
  } catch (error) {
    console.error('❌ Failed to list sessions:', error);
    process.exit(1);
  }
}

async function searchCephalonSessions() {
  console.log('\n🔍 Searching for cephalon-related sessions...\n');

  try {
    const sessionCollection = contextStore!.collections!.get('sessions');

    if (!sessionCollection) {
      console.log('⚠️  No sessions collection found');
      return;
    }

    // Generate embeddings for cephalon-related queries
    const queries = [
      'cephalon agent discord bot',
      'duck bot architecture',
      'discord bridge implementation',
      'ENSO protocol cephalon',
    ];

    for (const query of queries) {
      console.log(`\n🔎 Query: "${query}"`);

      // Generate embedding
      console.log('   Generating embedding for semantic search...');
    }

  } catch (error) {
    console.error('❌ Failed to search sessions:', error);
    process.exit(1);
  }
}

async function exportSessionMetadata() {
  console.log('\n💾 Exporting session metadata...\n');

  try {
    const sessionCollection = contextStore!.collections!.get('sessions');

    if (!sessionCollection) {
      console.log('⚠️  No sessions collection found');
      return;
    }

    const count = await sessionCollection.count();
    const results = await sessionCollection.queryByEmbedding([], { nResults: count + 100 });

    const exportData = {
      exportDate: new Date().toISOString(),
      totalSessions: count,
      sessions: results.map(result => ({
        id: result.id,
        title: result.metadata?.title,
        type: result.metadata?.type,
        messageCount: result.metadata?.messageCount,
        createdAt: result.metadata?.createdAt,
        hasEmbedding: !!result.embedding,
      })),
    };

    // Write to file
    const fs = await import('fs');
    const outputPath = 'session-export.json';
    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`✅ Exported ${count} sessions to ${outputPath}`);

  } catch (error) {
    console.error('❌ Failed to export:', error);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'list':
      await listAllSessions();
      break;

    case 'search':
      await searchCephalonSessions();
      break;

    case 'export':
      await exportSessionMetadata();
      break;

    default:
      console.log(`
Usage: node recover-sessions.mjs <command>

Commands:
  list     - List all sessions from ChromaDB
  search   - Search for cephalon-related sessions
  export   - Export session metadata to JSON file

Environment Variables:
  CHROMA_URL       - ChromaDB server URL (default: http://localhost:8000)
  COLLECTION_PREFIX - Collection name prefix (default: sessions_)
  EMBEDDING_MODEL - Ollama embedding model (default: qwen3-embedding:8b)
  EMBEDDING_CTX_SIZE - Embedding context size (default: 32768)
      `);
      process.exit(1);
  }
}

// Run main function
await initializeStores();
await main();
