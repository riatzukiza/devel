import { ChromaClient } from "chromadb";

async function inspectChroma() {
  const client = new ChromaClient({
    host: "localhost",
    port: 8000,
  });

  // List all collections
  const collections = await client.listCollections();
  console.log("Collections:", JSON.stringify(collections, null, 2));

  for (const col of collections) {
    console.log(`\n=== Collection: ${col.name} ===`);
    console.log("Metadata:", JSON.stringify(col.metadata, null, 2));
    
    try {
      const collection = await client.getCollection({ name: col.name });
      const count = await collection.count();
      console.log(`Count: ${count} documents`);
      
      // Get a sample
      if (count > 0) {
        const results = await collection.get({
          include: ["metadatas", "documents"],
          limit: 3
        });
        console.log("Sample documents:");
        for (let i = 0; i < Math.min(results.ids.length, 3); i++) {
          console.log(`  [${results.ids[i]}]`);
          console.log(`    Document: ${results.documents?.[i]?.substring(0, 100)}...`);
          console.log(`    Metadata: ${JSON.stringify(results.metadatas?.[i], null, 4)}`);
        }
      }
    } catch (e: any) {
      console.error(`Error inspecting ${col.name}:`, e.message);
    }
  }
}

inspectChroma().catch(console.error);
