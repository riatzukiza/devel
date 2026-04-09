#!/bin/sh
# Atlas Local initialization script
# Creates app user and vector search indexes
set -eu

MHOST="${MONGODB_ROOT_USERNAME:-openplannerRoot}"
MPASS="${MONGODB_ROOT_PASSWORD:-change-me-root-password}"
MDB="${MONGODB_DB:-openplanner}"
AUSER="${OPENPLANNER_MONGO_APP_USERNAME:-openplanner}"
APASS="${OPENPLANNER_MONGO_APP_PASSWORD:-change-me-openplanner-password}"
EDIM="${EMBEDDING_DIMENSIONS:-1024}"

echo "Waiting for MongoDB..."
until mongosh --host mongodb -u "$MHOST" -p "$MPASS" --authenticationDatabase admin --quiet --eval "db.adminCommand({ ping: 1 })" >/dev/null 2>&1; do
  sleep 2
done
echo "MongoDB is up"

# ── Create app user ──
echo "Creating app user..."
mongosh --host mongodb -u "$MHOST" -p "$MPASS" --authenticationDatabase admin --quiet --eval "
const appDb = db.getSiblingDB('$MDB');
const appExisting = appDb.getUser('$AUSER');
if (!appExisting) {
  appDb.createUser({
    user: '$AUSER',
    pwd: '$APASS',
    roles: [{ role: 'readWrite', db: '$MDB' }]
  });
  print('Created app user');
} else {
  print('App user already exists');
}
"

# ── Create vector search index on graph_node_embeddings ──
echo "Creating vector search indexes..."
mongosh --host mongodb -u "$MHOST" -p "$MPASS" --authenticationDatabase admin --quiet --eval "
const db = db.getSiblingDB('$MDB');
try {
  const existing1 = db.runCommand({ listSearchIndexes: 'graph_node_embeddings' });
  const indexes1 = existing1.cursor ? existing1.cursor.firstBatch : [];
  if (indexes1.some(idx => idx.name === 'embedding_vector')) {
    print('graph_node_embeddings: vector index already exists');
  } else {
    const r1 = db.runCommand({
      createSearchIndexes: 'graph_node_embeddings',
      indexes: [{
        name: 'embedding_vector',
        type: 'vectorSearch',
        definition: {
          fields: [
            { type: 'vector', path: 'embedding', numDimensions: $EDIM, similarity: 'cosine' },
            { type: 'filter', path: 'project' },
            { type: 'filter', path: 'embedding_model' }
          ]
        }
      }]
    });
    printjson({ graph_node_embeddings: r1 });
  }
} catch (e) { print('graph_node_embeddings index error: ' + e.message); }
"

# ── Create vector search index on event_chunks ──
mongosh --host mongodb -u "$MHOST" -p "$MPASS" --authenticationDatabase admin --quiet --eval "
const db = db.getSiblingDB('$MDB');
try {
  const existing2 = db.runCommand({ listSearchIndexes: 'event_chunks' });
  const indexes2 = existing2.cursor ? existing2.cursor.firstBatch : [];
  if (indexes2.some(idx => idx.name === 'chunk_vector')) {
    print('event_chunks: vector index already exists');
  } else {
    const r2 = db.runCommand({
      createSearchIndexes: 'event_chunks',
      indexes: [{
        name: 'chunk_vector',
        type: 'vectorSearch',
        definition: {
          fields: [
            { type: 'vector', path: 'embedding', numDimensions: $EDIM, similarity: 'cosine' },
            { type: 'filter', path: 'project' },
            { type: 'filter', path: 'source' }
          ]
        }
      }]
    });
    printjson({ event_chunks: r2 });
  }
} catch (e) { print('event_chunks index error: ' + e.message); }
"

echo "Atlas init complete"
