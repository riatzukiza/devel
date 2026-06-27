import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { MongoClient } from "mongodb";

/**
 * E2E Translation Pipeline Test
 * 
 * Tests the complete translation pipeline from document creation
 * to SFT export, simulating real-world usage.
 */

describe("E2E Translation Pipeline", () => {
  const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017";
  const dbName = "openplanner_e2e_test";
  const openplannerUrl = process.env.OPENPLANNER_URL || "http://localhost:7777";
  const apiKey = process.env.OPENPLANNER_API_KEY || "test-api-key";
  
  let mongo: MongoClient;

  beforeAll(async () => {
    mongo = new MongoClient(mongoUrl);
    await mongo.connect();
  });

  afterAll(async () => {
    // Cleanup
    await mongo.db(dbName).dropDatabase();
    await mongo.close();
  });

  it("should complete full translation pipeline", async () => {
    const db = mongo.db(dbName);
    const segmentsCollection = db.collection("translation_segments");
    const labelsCollection = db.collection("translation_labels");

    // Clean start
    await segmentsCollection.deleteMany({});
    await labelsCollection.deleteMany({});

    // Step 1: MT Pipeline creates segments
    console.log("Step 1: Creating translation segments...");
    
    const batchPayload = {
      project: "e2e-test",
      org_id: "test-org",
      segments: [
        {
          source_text: "Welcome to our platform. We are excited to have you here.",
          translated_text: "Bienvenido a nuestra plataforma. Estamos emocionados de tenerte aquí.",
          source_lang: "en",
          target_lang: "es",
          document_id: "welcome-doc",
          segment_index: 0,
          mt_model: "glm-5",
          confidence: 0.88,
          domain: "marketing",
        },
        {
          source_text: "Our platform offers cutting-edge AI solutions for your business.",
          translated_text: "Nuestra plataforma ofrece soluciones de IA de vanguardia para su negocio.",
          source_lang: "en",
          target_lang: "es",
          document_id: "welcome-doc",
          segment_index: 1,
          mt_model: "glm-5",
          confidence: 0.85,
          domain: "marketing",
        },
        {
          source_text: "Get started today and transform your workflow.",
          translated_text: "Comience hoy y transforme su flujo de trabajo.",
          source_lang: "en",
          target_lang: "es",
          document_id: "welcome-doc",
          segment_index: 2,
          mt_model: "glm-5",
          confidence: 0.90,
          domain: "marketing",
        },
      ],
    };

    const createResponse = execSync(
      `curl -s -X POST "${openplannerUrl}/v1/translations/segments/batch" ` +
      `-H "Authorization: Bearer ${apiKey}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '${JSON.stringify(batchPayload)}'`,
      { encoding: "utf-8" }
    );

    const createResult = JSON.parse(createResponse);
    expect(createResult.ok).toBe(true);
    expect(createResult.imported).toBe(3);

    const segmentIds = createResult.results.map((r: any) => r.id);
    console.log(`Created ${segmentIds.length} segments`);

    // Step 2: Reviewer fetches pending segments
    console.log("\nStep 2: Fetching pending segments...");
    
    const listResponse = execSync(
      `curl -s "${openplannerUrl}/v1/translations/segments?project=e2e-test&status=pending" ` +
      `-H "Authorization: Bearer ${apiKey}"`,
      { encoding: "utf-8" }
    );

    const listResult = JSON.parse(listResponse);
    expect(listResult.total).toBe(3);
    expect(listResult.segments).toHaveLength(3);

    // Step 3: SME reviews first segment - approves
    console.log("\nStep 3: Reviewing segment 1 - approve...");
    
    const approvePayload = {
      adequacy: "excellent",
      fluency: "excellent",
      terminology: "correct",
      risk: "safe",
      overall: "approve",
      editor_notes: "Perfect translation, ready for publication.",
      labeler_id: "sme-reviewer-1",
      labeler_email: "sme@example.com",
    };

    const approveResponse = execSync(
      `curl -s -X POST "${openplannerUrl}/v1/translations/segments/${segmentIds[0]}/labels" ` +
      `-H "Authorization: Bearer ${apiKey}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '${JSON.stringify(approvePayload)}'`,
      { encoding: "utf-8" }
    );

    const approveResult = JSON.parse(approveResponse);
    expect(approveResult.ok).toBe(true);
    expect(approveResult.new_status).toBe("approved");

    // Step 4: SME reviews second segment - needs correction
    console.log("\nStep 4: Reviewing segment 2 - needs edit with correction...");
    
    const correctPayload = {
      adequacy: "adequate",
      fluency: "good",
      terminology: "minor_errors",
      risk: "safe",
      overall: "needs_edit",
      corrected_text: "Nuestra plataforma ofrece soluciones de inteligencia artificial de vanguardia para su negocio.",
      editor_notes: "Expanded 'IA' to 'inteligencia artificial' for better clarity.",
      labeler_id: "sme-reviewer-1",
      labeler_email: "sme@example.com",
    };

    const correctResponse = execSync(
      `curl -s -X POST "${openplannerUrl}/v1/translations/segments/${segmentIds[1]}/labels" ` +
      `-H "Authorization: Bearer ${apiKey}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '${JSON.stringify(correctPayload)}'`,
      { encoding: "utf-8" }
    );

    const correctResult = JSON.parse(correctResponse);
    expect(correctResult.ok).toBe(true);
    expect(correctResult.new_status).toBe("approved"); // Has correction

    // Step 5: SME reviews third segment - rejects
    console.log("\nStep 5: Reviewing segment 3 - reject...");
    
    const rejectPayload = {
      adequacy: "poor",
      fluency: "poor",
      terminology: "major_errors",
      risk: "sensitive",
      overall: "reject",
      editor_notes: "Translation is inaccurate and uses incorrect terminology. Needs complete rewrite.",
      labeler_id: "sme-reviewer-1",
      labeler_email: "sme@example.com",
    };

    const rejectResponse = execSync(
      `curl -s -X POST "${openplannerUrl}/v1/translations/segments/${segmentIds[2]}/labels" ` +
      `-H "Authorization: Bearer ${apiKey}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '${JSON.stringify(rejectPayload)}'`,
      { encoding: "utf-8" }
    );

    const rejectResult = JSON.parse(rejectResponse);
    expect(rejectResult.ok).toBe(true);
    expect(rejectResult.new_status).toBe("rejected");

    // Step 6: Check manifest
    console.log("\nStep 6: Checking manifest...");
    
    const manifestResponse = execSync(
      `curl -s "${openplannerUrl}/v1/translations/export/manifest?project=e2e-test" ` +
      `-H "Authorization: Bearer ${apiKey}"`,
      { encoding: "utf-8" }
    );

    const manifest = JSON.parse(manifestResponse);
    expect(manifest.languages.es.total).toBe(3);
    expect(manifest.languages.es.approved).toBe(2);
    expect(manifest.languages.es.rejected).toBe(1);
    expect(manifest.labelers).toHaveLength(1);
    expect(manifest.labelers[0].segments_labeled).toBe(3);

    console.log("Manifest:", JSON.stringify(manifest, null, 2));

    // Step 7: Export SFT training data
    console.log("\nStep 7: Exporting SFT training data...");
    
    const sftResponse = execSync(
      `curl -s "${openplannerUrl}/v1/translations/export/sft?project=e2e-test&target_lang=es" ` +
      `-H "Authorization: Bearer ${apiKey}"`,
      { encoding: "utf-8" }
    );

    const lines = sftResponse.split("\n").filter((l: string) => l.trim());
    expect(lines.length).toBe(2); // Only approved segments

    // Verify first line uses original translation
    const line1 = JSON.parse(lines[0]);
    expect(line1.target).toContain("Bienvenido a nuestra plataforma");

    // Verify second line uses corrected text
    const line2 = JSON.parse(lines[1]);
    expect(line2.target).toContain("inteligencia artificial"); // Corrected version
    expect(line2.target).not.toContain("IA"); // Original had this

    console.log("\nExported SFT data:");
    lines.forEach((line: string, i: number) => {
      const data = JSON.parse(line);
      console.log(`  Line ${i + 1}: prompt=${data.prompt.substring(0, 50)}..., target=${data.target.substring(0, 50)}...`);
    });

    // Step 8: Verify final state
    console.log("\nStep 8: Verifying final state...");
    
    const finalListResponse = execSync(
      `curl -s "${openplannerUrl}/v1/translations/segments?project=e2e-test" ` +
      `-H "Authorization: Bearer ${apiKey}"`,
      { encoding: "utf-8" }
    );

    const finalList = JSON.parse(finalListResponse);
    const statusCounts = finalList.segments.reduce((acc: any, seg: any) => {
      acc[seg.status] = (acc[seg.status] || 0) + 1;
      return acc;
    }, {});

    expect(statusCounts.approved).toBe(2);
    expect(statusCounts.rejected).toBe(1);
    expect(statusCounts.pending).toBeUndefined();

    console.log("\nFinal status counts:", statusCounts);

    // Verify each segment has labels
    for (const segmentId of segmentIds) {
      const segmentResponse = execSync(
        `curl -s "${openplannerUrl}/v1/translations/segments/${segmentId}" ` +
        `-H "Authorization: Bearer ${apiKey}"`,
        { encoding: "utf-8" }
      );

      const segment = JSON.parse(segmentResponse);
      expect(segment.labels).toHaveLength(1);
    }

    console.log("\n✅ E2E pipeline test passed!");
  }, 30000); // 30 second timeout

  it("should handle multiple languages in parallel", async () => {
    const db = mongo.db(dbName);
    const segmentsCollection = db.collection("translation_segments");
    
    await segmentsCollection.deleteMany({ project: "multi-lang-test" });

    // Create segments for multiple languages
    const languages = ["es", "de", "fr"];
    const segments = [];

    for (const lang of languages) {
      segments.push({
        source_text: "Hello world",
        translated_text: lang === "es" ? "Hola mundo" : lang === "de" ? "Hallo Welt" : "Bonjour le monde",
        source_lang: "en",
        target_lang: lang,
        document_id: `doc-${lang}`,
        segment_index: 0,
        status: "approved",
        project: "multi-lang-test",
        org_id: "test-org",
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await segmentsCollection.insertMany(segments);

    // Export each language separately
    for (const lang of languages) {
      const exportResponse = execSync(
        `curl -s "${openplannerUrl}/v1/translations/export/sft?project=multi-lang-test&target_lang=${lang}" ` +
        `-H "Authorization: Bearer ${apiKey}"`,
        { encoding: "utf-8" }
      );

      const lines = exportResponse.split("\n").filter((l: string) => l.trim());
      expect(lines.length).toBe(1);
      
      const exported = JSON.parse(lines[0]);
      expect(exported.prompt).toContain(lang);
    }

    // Check manifest shows all languages
    const manifestResponse = execSync(
      `curl -s "${openplannerUrl}/v1/translations/export/manifest?project=multi-lang-test" ` +
      `-H "Authorization: Bearer ${apiKey}"`,
      { encoding: "utf-8" }
    );

    const manifest = JSON.parse(manifestResponse);
    expect(Object.keys(manifest.languages)).toEqual(expect.arrayContaining(languages));
    expect(manifest.export_sizes).toHaveProperty("sft_es");
    expect(manifest.export_sizes).toHaveProperty("sft_de");
    expect(manifest.export_sizes).toHaveProperty("sft_fr");
  });
});
