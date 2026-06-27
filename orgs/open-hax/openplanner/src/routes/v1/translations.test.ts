import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { FastifyInstance } from "fastify";
import { MongoClient, ObjectId } from "mongodb";
import { buildApp } from "../../main.js";

/**
 * Translation Routes Integration Tests
 * 
 * Tests the complete translation workflow:
 * 1. Batch segment import
 * 2. Segment listing and retrieval
 * 3. Label submission
 * 4. Status transitions
 * 5. SFT export
 * 6. Manifest generation
 */

describe("Translation Routes", () => {
  let app: FastifyInstance;
  let mongo: MongoClient;
  let segmentsCollection: any;
  let labelsCollection: any;
  let jobsCollection: any;
  let configCollection: any;

  const testProject = "test-translations";
  const testOrgId = "test-org";
  const testApiKey = "test-api-key";

  beforeAll(async () => {
    // Build app with test configuration
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
    jobsCollection = app.mongo.db.collection("translation_jobs");
    configCollection = app.mongo.db.collection("translation_config");
  });

  afterAll(async () => {
    await app.close();
    await mongo.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await segmentsCollection.deleteMany({ project: testProject });
    await labelsCollection.deleteMany({});
    await jobsCollection.deleteMany({ project: testProject });
    await configCollection.deleteMany({});
  });

  describe("GET/PATCH /v1/translations/config", () => {
    it("should return default config when unset", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/translations/config",
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.config).toEqual({
        model: "glm-5",
        updated_at: null,
      });
    });

    it("should require authorization", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/translations/config",
      });

      expect(response.statusCode).toBe(401);
    });

    it("should reject PATCH with missing model", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: "/v1/translations/config",
        headers: {
          authorization: `Bearer ${testApiKey}`,
          "content-type": "application/json",
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it("should persist model via PATCH and return it on GET", async () => {
      const patchResponse = await app.inject({
        method: "PATCH",
        url: "/v1/translations/config",
        headers: {
          authorization: `Bearer ${testApiKey}`,
          "content-type": "application/json",
        },
        payload: {
          model: "gemma4:latest",
        },
      });

      expect(patchResponse.statusCode).toBe(200);
      const patchBody = JSON.parse(patchResponse.body);
      expect(patchBody.ok).toBe(true);
      expect(patchBody.config.model).toBe("gemma4:latest");
      expect(typeof patchBody.config.updated_at).toBe("string");

      const getResponse = await app.inject({
        method: "GET",
        url: "/v1/translations/config",
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(getResponse.statusCode).toBe(200);
      const getBody = JSON.parse(getResponse.body);
      expect(getBody.ok).toBe(true);
      expect(getBody.config.model).toBe("gemma4:latest");
      expect(typeof getBody.config.updated_at).toBe("string");
    });
  });

  describe("POST /v1/translations/segments/batch", () => {
    it("should create translation segments", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/translations/segments/batch",
        headers: {
          authorization: `Bearer ${testApiKey}`,
          "content-type": "application/json",
        },
        payload: {
          project: testProject,
          org_id: testOrgId,
          segments: [
            {
              source_text: "Hello world",
              translated_text: "Hola mundo",
              source_lang: "en",
              target_lang: "es",
              document_id: "doc-1",
              segment_index: 0,
              mt_model: "test-model",
              confidence: 0.9,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.imported).toBe(1);
      expect(body.errors).toBe(0);
      expect(body.results).toHaveLength(1);
      expect(body.results[0]).toHaveProperty("id");
      expect(body.results[0].status).toBe("pending");
    });

    it("should create multiple segments in batch", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/translations/segments/batch",
        headers: {
          authorization: `Bearer ${testApiKey}`,
          "content-type": "application/json",
        },
        payload: {
          project: testProject,
          org_id: testOrgId,
          segments: [
            {
              source_text: "First segment",
              translated_text: "Primer segmento",
              source_lang: "en",
              target_lang: "es",
              document_id: "doc-2",
              segment_index: 0,
            },
            {
              source_text: "Second segment",
              translated_text: "Segundo segmento",
              source_lang: "en",
              target_lang: "es",
              document_id: "doc-2",
              segment_index: 1,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.imported).toBe(2);
    });

    it("should reject segments missing required fields", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/translations/segments/batch",
        headers: {
          authorization: `Bearer ${testApiKey}`,
          "content-type": "application/json",
        },
        payload: {
          project: testProject,
          org_id: testOrgId,
          segments: [
            {
              source_text: "Hello world",
              // missing translated_text
              source_lang: "en",
              target_lang: "es",
              document_id: "doc-1",
              segment_index: 0,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.imported).toBe(0);
      expect(body.errors).toBe(1);
    });

    it("should require authorization", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/translations/segments/batch",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          project: testProject,
          segments: [],
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /v1/translations/segments", () => {
    beforeEach(async () => {
      // Create test segments
      await segmentsCollection.insertMany([
        {
          source_text: "Test 1",
          translated_text: "Prueba 1",
          source_lang: "en",
          target_lang: "es",
          document_id: "doc-1",
          segment_index: 0,
          status: "pending",
          project: testProject,
          org_id: testOrgId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          source_text: "Test 2",
          translated_text: "Prueba 2",
          source_lang: "en",
          target_lang: "de",
          document_id: "doc-2",
          segment_index: 0,
          status: "approved",
          project: testProject,
          org_id: testOrgId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    });

    it("should list all segments", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/segments?project=${testProject}`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.segments).toHaveLength(2);
      expect(body.total).toBe(2);
    });

    it("should filter by status", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/segments?project=${testProject}&status=pending`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.segments).toHaveLength(1);
      expect(body.segments[0].status).toBe("pending");
    });

    it("should filter by target language", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/segments?project=${testProject}&target_lang=de`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.segments).toHaveLength(1);
      expect(body.segments[0].target_lang).toBe("de");
    });

    it("should paginate results", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/segments?project=${testProject}&limit=1`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.segments).toHaveLength(1);
      expect(body.has_more).toBe(true);
    });
  });

  describe("GET /v1/translations/segments/:id", () => {
    let segmentId: string;

    beforeEach(async () => {
      const result = await segmentsCollection.insertOne({
        source_text: "Test segment",
        translated_text: "Segmento de prueba",
        source_lang: "en",
        target_lang: "es",
        document_id: "doc-1",
        segment_index: 0,
        status: "pending",
        project: testProject,
        org_id: testOrgId,
        created_at: new Date(),
        updated_at: new Date(),
      });
      segmentId = result.insertedId.toString();
    });

    it("should get segment by id", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/segments/${segmentId}`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(segmentId);
      expect(body.source_text).toBe("Test segment");
      expect(body.labels).toEqual([]);
    });

    it("should return 404 for non-existent segment", async () => {
      const fakeId = new ObjectId().toString();
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/segments/${fakeId}`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should include labels in response", async () => {
      // Add a label
      await labelsCollection.insertOne({
        segment_id: segmentId,
        labeler_id: "user-1",
        labeler_email: "user@example.com",
        adequacy: "good",
        fluency: "excellent",
        terminology: "correct",
        risk: "safe",
        overall: "approve",
        created_at: new Date(),
      });

      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/segments/${segmentId}`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.labels).toHaveLength(1);
      expect(body.labels[0].labeler_email).toBe("user@example.com");
    });
  });

  describe("POST /v1/translations/segments/:id/labels", () => {
    let segmentId: string;

    beforeEach(async () => {
      const result = await segmentsCollection.insertOne({
        source_text: "Test segment",
        translated_text: "Segmento de prueba",
        source_lang: "en",
        target_lang: "es",
        document_id: "doc-1",
        segment_index: 0,
        status: "pending",
        project: testProject,
        org_id: testOrgId,
        created_at: new Date(),
        updated_at: new Date(),
      });
      segmentId = result.insertedId.toString();
    });

    it("should create label and update status to approved", async () => {
      const response = await app.inject({
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
          labeler_id: "user-1",
          labeler_email: "user@example.com",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.new_status).toBe("approved");

      // Verify segment status changed
      const segment = await segmentsCollection.findOne({ _id: new ObjectId(segmentId) });
      expect(segment.status).toBe("approved");
    });

    it("should set status to in_review for needs_edit without correction", async () => {
      const response = await app.inject({
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
          labeler_id: "user-1",
          labeler_email: "user@example.com",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.new_status).toBe("in_review");
    });

    it("should set status to approved with corrected_text", async () => {
      const response = await app.inject({
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
          corrected_text: "Este es el texto corregido",
          labeler_id: "user-1",
          labeler_email: "user@example.com",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.new_status).toBe("approved");
      expect(body.label.corrected_text).toBe("Este es el texto corregido");
    });

    it("should set status to rejected", async () => {
      const response = await app.inject({
        method: "POST",
        url: `/v1/translations/segments/${segmentId}/labels`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
          "content-type": "application/json",
        },
        payload: {
          adequacy: "poor",
          fluency: "poor",
          terminology: "major_errors",
          risk: "safe",
          overall: "reject",
          editor_notes: "Major issues with translation",
          labeler_id: "user-1",
          labeler_email: "user@example.com",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.new_status).toBe("rejected");
    });

    it("should increment label version", async () => {
      // First label
      await app.inject({
        method: "POST",
        url: `/v1/translations/segments/${segmentId}/labels`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
          "content-type": "application/json",
        },
        payload: {
          adequacy: "good",
          fluency: "good",
          terminology: "correct",
          risk: "safe",
          overall: "needs_edit",
          labeler_id: "user-1",
          labeler_email: "user@example.com",
        },
      });

      // Second label
      const response = await app.inject({
        method: "POST",
        url: `/v1/translations/segments/${segmentId}/labels`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
          "content-type": "application/json",
        },
        payload: {
          adequacy: "excellent",
          fluency: "excellent",
          terminology: "correct",
          risk: "safe",
          overall: "approve",
          labeler_id: "user-2",
          labeler_email: "user2@example.com",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.label.label_version).toBe(2);
    });

    it("should require all label fields", async () => {
      const response = await app.inject({
        method: "POST",
        url: `/v1/translations/segments/${segmentId}/labels`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
          "content-type": "application/json",
        },
        payload: {
          adequacy: "good",
          // missing other required fields
          labeler_id: "user-1",
          labeler_email: "user@example.com",
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /v1/translations/export/sft", () => {
    beforeEach(async () => {
      // Create approved segments
      const seg1 = await segmentsCollection.insertOne({
        source_text: "Hello world",
        translated_text: "Hola mundo",
        source_lang: "en",
        target_lang: "es",
        document_id: "doc-1",
        segment_index: 0,
        status: "approved",
        project: testProject,
        org_id: testOrgId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Add correction label
      await labelsCollection.insertOne({
        segment_id: seg1.insertedId.toString(),
        labeler_id: "user-1",
        labeler_email: "user@example.com",
        corrected_text: "¡Hola mundo!",
        created_at: new Date(),
      });

      // Create pending segment (should not appear in export)
      await segmentsCollection.insertOne({
        source_text: "Pending segment",
        translated_text: "Segmento pendiente",
        source_lang: "en",
        target_lang: "es",
        document_id: "doc-2",
        segment_index: 0,
        status: "pending",
        project: testProject,
        org_id: testOrgId,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    it("should export approved segments as JSONL", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/export/sft?project=${testProject}&target_lang=es`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("application/x-ndjson");

      const lines = response.body.split("\n").filter((line: string) => line.trim());
      expect(lines).toHaveLength(1);

      const exported = JSON.parse(lines[0]);
      expect(exported).toHaveProperty("prompt");
      expect(exported).toHaveProperty("target");
      expect(exported.target).toBe("¡Hola mundo!"); // Should use corrected text
    });

    it("should use original text when include_corrected=false", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/export/sft?project=${testProject}&target_lang=es&include_corrected=false`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      const lines = response.body.split("\n").filter((line: string) => line.trim());
      const exported = JSON.parse(lines[0]);
      expect(exported.target).toBe("Hola mundo"); // Original translation
    });

    it("should filter by target language", async () => {
      // Create German segment
      await segmentsCollection.insertOne({
        source_text: "Hello world",
        translated_text: "Hallo Welt",
        source_lang: "en",
        target_lang: "de",
        document_id: "doc-3",
        segment_index: 0,
        status: "approved",
        project: testProject,
        org_id: testOrgId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/export/sft?project=${testProject}&target_lang=de`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      const lines = response.body.split("\n").filter((line: string) => line.trim());
      expect(lines).toHaveLength(1);
      const exported = JSON.parse(lines[0]);
      expect(exported.target).toBe("Hallo Welt");
    });
  });

  describe("GET /v1/translations/export/manifest", () => {
    beforeEach(async () => {
      await segmentsCollection.insertMany([
        {
          source_text: "Test 1",
          translated_text: "Prueba 1",
          source_lang: "en",
          target_lang: "es",
          document_id: "doc-1",
          segment_index: 0,
          status: "approved",
          project: testProject,
          org_id: testOrgId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          source_text: "Test 2",
          translated_text: "Prueba 2",
          source_lang: "en",
          target_lang: "es",
          document_id: "doc-2",
          segment_index: 0,
          status: "pending",
          project: testProject,
          org_id: testOrgId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          source_text: "Test 3",
          translated_text: "Prueba 3",
          source_lang: "en",
          target_lang: "de",
          document_id: "doc-3",
          segment_index: 0,
          status: "approved",
          project: testProject,
          org_id: testOrgId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      await labelsCollection.insertOne({
        segment_id: "test-segment",
        labeler_email: "reviewer@example.com",
        created_at: new Date(),
      });
    });

    it("should return manifest with statistics", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/export/manifest?project=${testProject}`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.project).toBe(testProject);
      expect(body.languages).toHaveProperty("es");
      expect(body.languages).toHaveProperty("de");
      expect(body.languages.es.total).toBe(2);
      expect(body.languages.es.approved).toBe(1);
      expect(body.languages.es.pending).toBe(1);
    });

    it("should list labelers", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/export/manifest?project=${testProject}`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      const body = JSON.parse(response.body);
      expect(body.labelers).toBeInstanceOf(Array);
      expect(body.labelers.length).toBeGreaterThan(0);
    });
  });

  describe("POST /v1/documents/:id/translate", () => {
    it("should create translation job", async () => {
      // Create test document
      const docId = "test-doc-translate";
      await app.mongo.events.insertOne({
        _id: docId,
        text: "This is a test document to translate.",
        kind: "docs",
        project: testProject,
        created_at: new Date(),
      });

      const response = await app.inject({
        method: "POST",
        url: `/v1/documents/${docId}/translate`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
          "content-type": "application/json",
        },
        payload: {
          target_languages: ["es", "de"],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.target_languages).toEqual(["es", "de"]);
      expect(body.status).toBe("queued");
      expect(body).toHaveProperty("job_id");
    });

    it("should return 404 for non-existent document", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/documents/nonexistent-doc/translate",
        headers: {
          authorization: `Bearer ${testApiKey}`,
          "content-type": "application/json",
        },
        payload: {
          target_languages: ["es"],
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("GET /v1/translations/jobs", () => {
    beforeEach(async () => {
      await jobsCollection.insertMany([
        {
          document_id: "doc-1",
          project: testProject,
          source_lang: "en",
          target_languages: ["es"],
          status: "completed",
          created_at: new Date(),
        },
        {
          document_id: "doc-2",
          project: testProject,
          source_lang: "en",
          target_languages: ["de"],
          status: "queued",
          created_at: new Date(),
        },
      ]);
    });

    it("should list translation jobs", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/jobs?project=${testProject}`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.jobs).toHaveLength(2);
    });

    it("should filter by status", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/translations/jobs?project=${testProject}&status=queued`,
        headers: {
          authorization: `Bearer ${testApiKey}`,
        },
      });

      const body = JSON.parse(response.body);
      expect(body.jobs).toHaveLength(1);
      expect(body.jobs[0].status).toBe("queued");
    });
  });
});
