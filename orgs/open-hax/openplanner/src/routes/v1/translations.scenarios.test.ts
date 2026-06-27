import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { FastifyInstance } from "fastify";
import { MongoClient, ObjectId } from "mongodb";
import { buildApp } from "../../main.js";

/**
 * Translation Routes Scenario Tests
 * 
 * These tests verify complete workflows and multiple steps
 */

describe("Translation Review Workflow", () => {
  let app: FastifyInstance;
  let mongo: MongoClient;
  let segmentsCollection: any;
  let labelsCollection: any;

  const testProject = "workflow-test";
  const testApiKey = "test-api-key";

  beforeAll(async () => {
    app = await buildApp({
      logger: false,
      mongo: {
        url: process.env.MONGO_URL || "mongodb://localhost:27017",
        database: "openplanner_test",
      },
      apiKey: testApiKey,
    });

    await app.ready();
    mongo = app.mongo.client;
    segmentsCollection = app.mongo.db.collection("translation_segments");
    labelsCollection = app.mongo.db.collection("translation_labels");
  });

  afterAll(async () => {
    await app.close();
    await mongo.close();
  });

  beforeEach(async () => {
    await segmentsCollection.deleteMany({ project: testProject });
    await labelsCollection.deleteMany({});
  });

  it("should complete full review workflow", async () => {
    // Step 1: Create segments
    const batchResponse = await app.inject({
      method: "POST",
      url: "/v1/translations/segments/batch",
      headers: {
        authorization: `Bearer ${testApiKey}`,
        "content-type": "application/json",
      },
      payload: {
        project: testProject,
        segments: [
          {
            source_text: "First segment for review",
            translated_text: "Primer segmento para revisión",
            source_lang: "en",
            target_lang: "es",
            document_id: "doc-workflow",
            segment_index: 0,
          },
        ],
      },
    });

    expect(batchResponse.statusCode).toBe(200);
    const segmentId = JSON.parse(batchResponse.body).results[0].id;

    // Step 2: Verify segment is pending
    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/translations/segments/${segmentId}`,
      headers: {
        authorization: `Bearer ${testApiKey}`,
      },
    });

    expect(getResponse.statusCode).toBe(200);
    expect(JSON.parse(getResponse.body).status).toBe("pending");

    // Step 3: Submit label
    const labelResponse = await app.inject({
      method: "POST",
      url: `/v1/translations/segments/${segmentId}/labels`,
      headers: {
        authorization: `Bearer ${testApiKey}`,
        "content-type": "application/json",
      },
      payload: {
        adequacy: "good",
        fluency: "excellent",
        terminology: "correct",
        risk: "safe",
        overall: "approve",
        labeler_id: "reviewer-1",
        labeler_email: "reviewer@example.com",
      },
    });

    expect(labelResponse.statusCode).toBe(200);
    expect(JSON.parse(labelResponse.body).new_status).toBe("approved");

    // Step 4: Verify segment is now approved
    const finalResponse = await app.inject({
      method: "GET",
      url: `/v1/translations/segments/${segmentId}`,
      headers: {
        authorization: `Bearer ${testApiKey}`,
      },
    });

    expect(finalResponse.statusCode).toBe(200);
    expect(JSON.parse(finalResponse.body).status).toBe("approved");

    // Step 5: Export and verify
    const exportResponse = await app.inject({
      method: "GET",
      url: `/v1/translations/export/sft?project=${testProject}&target_lang=es`,
      headers: {
        authorization: `Bearer ${testApiKey}`,
      },
    });

    expect(exportResponse.statusCode).toBe(200);
    const lines = exportResponse.body.split("\n").filter((l: string) => l.trim());
    expect(lines.length).toBe(1);
    const exported = JSON.parse(lines[0]);
    expect(exported).toHaveProperty("prompt");
    expect(exported).toHaveProperty("target");
    expect(exported.target).toContain("Primer segmento");
  });

  it("should handle needs_edit with correction workflow", async () => {
    // Create segment
    const batchResponse = await app.inject({
      method: "POST",
      url: "/v1/translations/segments/batch",
      headers: {
        authorization: `Bearer ${testApiKey}`,
        "content-type": "application/json",
      },
      payload: {
        project: testProject,
        segments: [
          {
            source_text: "Segment needing correction",
            translated_text: "Segmento que necesita correre",
            source_lang: "en",
            target_lang: "es",
            document_id: "doc-correction",
            segment_index: 0,
          },
        ],
      },
    });

    const segmentId = JSON.parse(batchResponse.body).results[0].id;

    // Submit needs_edit with correction
    await app.inject({
      method: "POST",
      url: `/v1/translations/segments/${segmentId}/labels`,
      headers: {
        authorization: `Bearer ${testApiKey}`,
        "content-type": "application/json",
      },
      payload: {
        adequacy: "adequate",
        fluency: "good",
        terminology: "minor_errors",
        risk: "safe",
        overall: "needs_edit",
        corrected_text: "Segmento corregido",
        labeler_id: "reviewer-2",
        labeler_email: "reviewer2@example.com",
      },
    });

    // Verify status is approved (has correction)
    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/translations/segments/${segmentId}`,
      headers: {
        authorization: `Bearer ${testApiKey}`,
      },
    });

    expect(JSON.parse(getResponse.body).status).toBe("approved");

    // Verify export uses corrected text
    const exportResponse = await app.inject({
      method: "GET",
      url: `/v1/translations/export/sft?project=${testProject}&target_lang=es`,
      headers: {
        authorization: `Bearer ${testApiKey}`,
      },
    });

    const exported = JSON.parse(exportResponse.body.split("\n")[0]);
    expect(exported.target).toBe("Segmento corregido");
  });

  it("should handle rejection workflow", async () => {
    // Create segment
    const batchResponse = await app.inject({
      method: "POST",
      url: "/v1/translations/segments/batch",
      headers: {
        authorization: `Bearer ${testApiKey}`,
        "content-type": "application/json",
      },
      payload: {
        project: testProject,
        segments: [
          {
            source_text: "Bad segment",
            translated_text: "Mal segmento",
            source_lang: "en",
            target_lang: "es",
            document_id: "doc-reject",
            segment_index: 0,
          },
        ],
      },
    });

    const segmentId = JSON.parse(batchResponse.body).results[0].id;

    // Submit reject
    await app.inject({
      method: "POST",
      url: `/v1/translations/segments/${segmentId}/labels`,
      headers: {
        authorization: `Bearer ${testApiKey}`,
        "content-type": "application/json",
      },
      payload: {
        adequacy: "poor",
        fluency: "unusable",
        terminology: "major_errors",
        risk: "safe",
        overall: "reject",
        labeler_id: "reviewer-3",
        labeler_email: "reviewer3@example.com",
      },
    });

    // Verify status is rejected
    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/translations/segments/${segmentId}`,
      headers: {
        authorization: `Bearer ${testApiKey}`,
      },
    });

    expect(JSON.parse(getResponse.body).status).toBe("rejected");

    // Verify rejected segments don't appear in export
    const exportResponse = await app.inject({
      method: "GET",
      url: `/v1/translations/export/sft?project=${testProject}&target_lang=es`,
      headers: {
        authorization: `Bearer ${testApiKey}`,
      },
    });

    const lines = exportResponse.body.split("\n").filter((l: string) => l.trim());
    // Should only export approved segments (rejected one shouldn't be there)
    expect(lines.length).toBe(0);
  });
});
