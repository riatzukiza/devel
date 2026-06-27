#!/usr/bin/env node
/**
 * Document Reconstructor - Extract and reconstruct files from session content
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

async function generateEmbedding(text) {
  try {
    console.log(`📝 Generating embedding for: "${text.substring(0, 50)}..."`);
    const embedding = await ollamaEmbed(EMBEDDING_MODEL, text, {
      ctxSize: EMBEDDING_CTX_SIZE,
    });
    console.log(`✅ Generated embedding: ${embedding.length} dimensions`);
    return embedding;
  } catch (error) {
    console.warn(`⚠️  Failed to generate embedding for "${text}":`, error.message);
    return [];
  }
}

async function getMessagesForSession(sessionId) {
  console.log(`📨 Getting messages for session: ${sessionId}`);

  try {
    const messageCollection = contextStore!.collections!.get('messages');

    if (!messageCollection) {
      console.warn('⚠️  No messages collection found');
      return [];
    }

    // Query messages by session metadata
    const messages = await messageCollection.queryByEmbedding([], {
      nResults: 1000,
      where: {
        sessionId: sessionId,
      },
    });

    console.log(`✅ Found ${messages.length} messages`);
    return messages;
  } catch (error) {
    console.error('❌ Failed to get messages:', error);
    return [];
  }
}

async function reconstructSession(sessionId, outputDir) {
  console.log(`\n🔧 Reconstructing session: ${sessionId}\n`);

  try {
    const sessionCollection = contextStore!.collections!.get('sessions');

    if (!sessionCollection) {
      console.error('❌ No sessions collection found');
      return;
    }

    // Get session metadata
    const sessions = await sessionCollection.queryByEmbedding([], {
      nResults: 100,
      where: { id: sessionId },
    });

    if (sessions.length === 0) {
      console.error(`❌ Session ${sessionId} not found`);
      return;
    }

    const session = sessions[0];
    const metadata = session.metadata || {};
    const title = metadata.title || sessionId;

    console.log(`📋 Session: ${title}`);
    console.log(`   Type: ${metadata.type || 'unknown'}`);
    console.log(`   Messages: ${metadata.messageCount || 0}`);

    // Get all messages for this session
    const messages = await getMessagesForSession(sessionId);

    if (messages.length === 0) {
      console.warn('⚠️  No messages found, cannot reconstruct files');
      return;
    }

    // Create directory structure
    const sessionDir = `${outputDir}/${sessionId}`;
    const fs = await import('fs');
    await fs.mkdir(sessionDir, { recursive: true });

    // Extract and reconstruct files from messages
    let fileIndex = 1;

    for (const message of messages) {
      const msgMetadata = message.metadata || {};
      const content = message.metadata?.content || '';

      // Skip empty messages
      if (!content && !msgMetadata.fileContent) {
        continue;
      }

      // Determine file path based on message metadata
      let fileName;
      let fileContent;

      if (msgMetadata.filePath) {
        fileName = msgMetadata.filePath;
        fileContent = msgMetadata.fileContent || content;
      } else if (msgMetadata.fileType) {
        const ext = getFileExtension(msgMetadata.fileType);
        fileName = `${fileIndex.toString().padStart(3, '0')}_${msgMetadata.fileType}${ext}`;
        fileContent = content;
      } else {
        // Generate filename from message content
        const firstLine = content.split('\n')[0]?.substring(0, 50) || 'untitled';
        fileName = `${fileIndex.toString().padStart(3, '0')}.txt`;
        fileContent = content;
      }

      const filePath = `${sessionDir}/${fileName}`;

      // Write reconstructed file
      await fs.writeFile(filePath, fileContent);
      console.log(`  ${fileIndex}. ${fileName} (${content.length} bytes)`);
      fileIndex++;
    }

    // Create README with session metadata
    const readmeContent = `# Session: ${title}

## Metadata
- **ID**: ${sessionId}
- **Type**: ${metadata.type || 'unknown'}
- **Created**: ${metadata.createdAt || 'unknown'}
- **Messages**: ${metadata.messageCount || 0}
- **Files Reconstructed**: ${fileIndex - 1}

## Recovery Notes
- This session was reconstructed from ChromaDB message history
- File paths are approximations based on message metadata
- Code files may need manual review and cleanup

## Files
${Array.from({ length: fileIndex - 1 }, (_, i) =>
  `  ${i + 1}. ${filesInSession[i] || 'unknown'}`
).join('\n')}
`;

    await fs.writeFile(`${sessionDir}/README.md`, readmeContent);
    console.log(`✅ Reconstructed ${fileIndex - 1} files to ${sessionDir}`);

  } catch (error) {
    console.error(`❌ Failed to reconstruct session ${sessionId}:`, error);
  }
}

function getFileExtension(fileType) {
  const extMap = {
    'typescript': '.ts',
    'javascript': '.js',
    'clojure': '.clj',
    'cljs': '.cljs',
    'cljc': '.cljc',
    'markdown': '.md',
    'json': '.json',
    'edn': '.edn',
    'txt': '.txt',
  };

  return extMap[fileType] || '.txt';
}

async function reconstructAllCephalonSessions(outputDir) {
  console.log('\n🔍 Finding and reconstructing cephalon-related sessions...\n');

  try {
    const sessionCollection = contextStore!.collections!.get('sessions');

    if (!sessionCollection) {
      console.error('❌ No sessions collection found');
      return;
    }

    // Generate embedding for "cephalon" to find related sessions
    const cephalonEmbedding = await generateEmbedding('cephalon agent discord bot');

    // Find sessions related to cephalon
    const sessions = await sessionCollection.queryByEmbedding(cephalonEmbedding, {
      nResults: 50,
      threshold: 0.7, // Lower threshold for broader search
    });

    console.log(`✅ Found ${sessions.length} potentially cephalon-related sessions\n`);

    // Reconstruct each session
    for (const session of sessions) {
      await reconstructSession(session.id, outputDir);
    }

    console.log(`\n✅ Reconstruction complete. Check ${outputDir} for results.`);

  } catch (error) {
    console.error('❌ Failed to reconstruct sessions:', error);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];
  const outputDir = process.argv[3] || './recovered';

  switch (command) {
    case 'reconstruct-session':
      if (!process.argv[3]) {
        console.error('❌ Usage: node reconstruct.mjs reconstruct-session <sessionId> [outputDir]');
        process.exit(1);
      }
      await reconstructSession(process.argv[3], outputDir);
      break;

    case 'reconstruct-all':
      await reconstructAllCephalonSessions(outputDir);
      break;

    default:
      console.log(`
Usage: node reconstruct.mjs <command> [args...]

Commands:
  reconstruct-session <sessionId> [outputDir]
    - Reconstruct a specific session from ChromaDB
    - Default outputDir: ./recovered

  reconstruct-all [outputDir]
    - Find and reconstruct all cephalon-related sessions
    - Uses semantic search with "cephalon" embedding
    - Default outputDir: ./recovered

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
