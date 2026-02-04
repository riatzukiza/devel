# MongoDB Migration Path

## Current State (Option 1 - MVP)
Cephalon now uses MongoDBMemoryStore for full persistence:
- All Memory objects stored in MongoDB
- Includes all fields: role, kind, content, source, retrieval, usage, embedding, lifecycle, hashes
- Memories persist across restarts
- UI will show persisted data

## Migration Path to DualStore (Option 2 - Production)

### Why Migrate?
Current implementation stores everything in MongoDB. Production-grade DualStoreManager offers:
1. **Dual storage**: MongoDB (full docs) + ChromaDB (vectors) in one API
2. **Automatic sync**: Writes go to both stores automatically
3. **Consistency checking**: Built-in verification between MongoDB and ChromaDB
4. **Optimized queries**: MongoDB for lookups, ChromaDB for similarity search

### How to Migrate

1. **Replace MongoDBMemoryStore** with DualStoreManager from @promethean-os/persistence:
   ```typescript
   import { DualStoreManager } from '@promethean-os/persistence';
   import { getMongoClient, getChromaClient } from '@promethean-os/persistence';
   
   const mongoClient = await getMongoClient();
   const chromaClient = await getChromaClient();
   
   const dualStore = await DualStoreManager.create('cephalon_memories', 'text', 'createdAt');
   await dualStore.initialize();  // Loads from both backends
   ```

2. **Update MemoryStore interface usage**: DualStoreManager uses a different API:
   ```typescript
   // Current: await memoryStore.insert(memory);
   // DualStore: await dualStore.addEntry({ text: ..., createdAt: ... });
   ```

3. **Leverage shared infrastructure**:
   - Uses `@promethean-os/persistence` clients (already workspace dependency)
   - Automatic connection pooling and reconnection
   - Graceful shutdown via `cleanupClients()`

4. **Update Minting**: Change from `MemoryFactory` to `DualStoreEntry` format:
   ```typescript
   // Memory object → DualStoreEntry
   const dualEntry = {
     id: memory.id,
     text: memory.content.text,
     createdAt: memory.timestamp,
     metadata: { kind: memory.kind, role: memory.role, ... }
   };
   ```

### Migration Benefits

- **Performance**: MongoDB for exact lookups, ChromaDB for semantic similarity
- **Reliability**: Automatic sync between both stores with consistency checks
- **Maintainability**: Less custom code, more shared infrastructure
- **Testability**: Can use test hooks from @promethean-os/persistence

### Migration Effort Estimate

- **Low**: ~4-6 hours to replace MongoDBMemoryStore usage
- **Medium**: ~1-2 days to update minting/context assembly for DualStore API
- **High**: ~2-3 days for full migration with testing

### When to Migrate

Migrate when:
- ✅ Current MVP approach is stable and tested
- ✅ Need better semantic search performance
- ✅ Want automatic consistency between MongoDB and ChromaDB
- ✅ Need to scale beyond single server

### Notes

- **Backward compatible**: MongoDBMemoryStore and DualStoreManager can coexist
- **Gradual migration**: Can migrate session-by-session or feature-by-feature
- **ChromaDB still used**: For vector similarity searches via `getMostRelevant()`
