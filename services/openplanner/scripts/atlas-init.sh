#!/bin/bash
# =============================================================================
# Atlas Local Initialization Script
# =============================================================================
# This script initializes Atlas Local for OpenPlanner:
# 1. Creates the app user (openplanner) if it doesn't exist
# 2. Creates required collections
# 3. Creates required indexes
# 4. Creates vector search index for semantic search
#
# PREREQUISITES:
# - Atlas Local container is healthy (mongodb service)
# - Root credentials are set via environment variables
#
# VOLUME PERSISTENCE:
# - Data is stored in 'openplanner-atlas-data' volume
# - User/collections/indexes are persisted across restarts
# - This script is idempotent - safe to run multiple times
# =============================================================================

set -e

mongosh_retry() {
  # Atlas Local can briefly accept healthcheck pings and then restart while
  # replica-set/mongot wiring settles. Wrap all mongosh operations in a retry
  # loop so init doesn't fail spuriously on ECONNREFUSED.
  local js="$1"
  local attempts="${2:-60}"
  local delay_s="${3:-2}"

  for ((i=1; i<=attempts; i++)); do
    if mongosh "$MONGODB_URI" --quiet --eval "$js"; then
      return 0
    fi
    echo "      mongosh failed (attempt ${i}/${attempts}); retrying in ${delay_s}s..." >&2
    sleep "$delay_s"
  done
  echo "      mongosh failed after ${attempts} attempts" >&2
  return 1
}

MONGODB_URI="mongodb://${MONGODB_ROOT_USERNAME}:${MONGODB_ROOT_PASSWORD}@mongodb:27017/?authSource=admin"
APP_USER="${OPENPLANNER_MONGO_APP_USERNAME:-openplanner}"
APP_PASSWORD="${OPENPLANNER_MONGO_APP_PASSWORD:-change-me-openplanner-password}"
APP_DB="${MONGODB_DB:-openplanner}"
DEV_DB="${OPENPLANNER_DEV_MONGODB_DB:-openplanner_dev}"

echo "=== Atlas Local Initialization ==="
echo "Database: ${APP_DB}"
echo "Dev Database: ${DEV_DB}"
echo "App User: ${APP_USER}"

# Wait for MongoDB to be ready
echo "[1/5] Waiting for MongoDB..."
if mongosh_retry 'db.adminCommand({ping:1})' 60 1 >/dev/null 2>&1; then
  echo "      MongoDB is ready"
else
  echo "      MongoDB did not become ready in time" >&2
  exit 1
fi

# Create app user if it doesn't exist
echo "[2/5] Ensuring app user exists..."
mongosh_retry '
var appDb = db.getSiblingDB("'"${APP_DB}"'");
var existingUsers = appDb.getUsers();
var desiredRoles = [{role: "readWrite", db: "'"${APP_DB}"'"}];
if ("'"${DEV_DB}"'" !== "'"${APP_DB}"'") {
  desiredRoles.push({role: "readWrite", db: "'"${DEV_DB}"'"});
}
if (existingUsers.users.length === 0) {
  appDb.createUser({
    user: "'"${APP_USER}"'",
    pwd: "'"${APP_PASSWORD}"'",
    roles: desiredRoles
  });
  print("      Created app user: '"${APP_USER}"'");
} else {
  var user = appDb.getUser("'"${APP_USER}"'");
  if (user) {
    desiredRoles.forEach(function(role) {
      var hasRole = user.roles.some(function(existing) {
        return existing.role === role.role && existing.db === role.db;
      });
      if (!hasRole) {
        appDb.grantRolesToUser("'"${APP_USER}"'", [role]);
        print("      Granted " + role.role + " on " + role.db + " to '"${APP_USER}"'");
      }
    });
  }
  print("      App user already exists: '"${APP_USER}"'");
}
'

# Create collections
echo "[3/5] Creating collections..."
mongosh_retry '
var appDb = db.getSiblingDB("'"${APP_DB}"'");
var collections = ["events", "event_chunks", "graph_edges", "graph_semantic_edges",
                   "graph_layout_overrides", "graph_node_embeddings", "gardens"];
var existing = appDb.getCollectionNames();
collections.forEach(function(c) {
  if (!existing.includes(c)) {
    appDb.createCollection(c);
    print("      Created collection: " + c);
  }
});
print("      Collections ready: " + appDb.getCollectionNames().length);
'

# Create indexes
echo "[4/5] Creating indexes..."
mongosh_retry '
var appDb = db.getSiblingDB("'"${APP_DB}"'");

// Graph layout indexes
var layoutIndexes = appDb.graph_layout_overrides.getIndexes();
if (!layoutIndexes.some(function(i) { return i.name === "node_id_1"; })) {
  appDb.graph_layout_overrides.createIndex({node_id: 1}, {unique: true});
  print("      Created index: graph_layout_overrides.node_id_1");
}
if (!layoutIndexes.some(function(i) { return i.name === "project_1_updated_at_-1"; })) {
  appDb.graph_layout_overrides.createIndex({project: 1, updated_at: -1});
  print("      Created index: graph_layout_overrides.project_1_updated_at_-1");
}
if (!layoutIndexes.some(function(i) { return i.name === "updated_at_-1"; })) {
  appDb.graph_layout_overrides.createIndex({updated_at: -1});
  print("      Created index: graph_layout_overrides.updated_at_-1");
}
if (!layoutIndexes.some(function(i) { return i.name === "layout_source_1_updated_at_-1"; })) {
  appDb.graph_layout_overrides.createIndex({layout_source: 1, updated_at: -1});
  print("      Created index: graph_layout_overrides.layout_source_1_updated_at_-1");
}

// Events indexes
var eventsIndexes = appDb.events.getIndexes();
if (!eventsIndexes.some(function(i) { return i.name === "kind_1"; })) {
  appDb.events.createIndex({kind: 1});
  print("      Created index: events.kind_1");
}
if (!eventsIndexes.some(function(i) { return i.name === "project_1"; })) {
  appDb.events.createIndex({project: 1});
  print("      Created index: events.project_1");
}

// Event chunks indexes
var chunksIndexes = appDb.event_chunks.getIndexes();
if (!chunksIndexes.some(function(i) { return i.name === "event_id_1"; })) {
  appDb.event_chunks.createIndex({event_id: 1});
  print("      Created index: event_chunks.event_id_1");
}

print("      Indexes ready");
'

# Create vector search index for semantic search
echo "[5/5] Creating vector search index..."
EMBEDDING_DIMS="${EMBEDDING_DIMENSIONS:-1024}"
mongosh_retry '
var appDb = db.getSiblingDB("'"${APP_DB}"'");
var embeddingDims = '"${EMBEDDING_DIMS}"';

// Check if vector search index exists
var hasVectorIndex = false;
try {
  var existingIndexes = appDb.runCommand({listSearchIndexes: "event_chunks"});
  if (existingIndexes.cursor && existingIndexes.cursor.firstBatch) {
    hasVectorIndex = existingIndexes.cursor.firstBatch.some(function(i) {
      return i.name === "chunk_vector";
    });
  }
} catch (e) {
  // listSearchIndexes may not be available, try to create anyway
}

if (!hasVectorIndex) {
  try {
    // Use createSearchIndexes (plural) with mappings structure for Atlas Local
    var result = appDb.runCommand({
      createSearchIndexes: "event_chunks",
      indexes: [{
        name: "chunk_vector",
        definition: {
          mappings: {
            dynamic: true,
            fields: {
              embedding: {
                type: "knnVector",
                dimensions: parseInt(embeddingDims) || 1024,
                similarity: "cosine"
              }
            }
          }
        }
      }]
    });
    if (result.ok === 1) {
      print("      Created vector search index: chunk_vector");
    } else {
      print("      Vector search index creation failed: " + JSON.stringify(result));
    }
  } catch (e) {
    print("      Vector search index creation: " + e);
  }
} else {
  print("      Vector search index already exists: chunk_vector");
}
'

echo "=== Atlas Local initialization complete ==="
exit 0
