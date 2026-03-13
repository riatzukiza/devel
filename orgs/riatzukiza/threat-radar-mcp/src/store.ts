import { getSql } from "./lib/postgres.js";
import type { Radar, RadarModuleVersion, SourceDefinition, RadarAssessmentPacket, ReducedSnapshot, ModelSubmission, SignalEvent, Thread } from "@workspace/radar-core";

type RadarRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: string;
  template_id: string | null;
  active_module_version_id: string | null;
  created_at: Date;
  updated_at: Date;
};

type ModuleVersionRow = {
  id: string;
  radar_id: string;
  version: number;
  signal_definitions: object;
  branch_definitions: object;
  source_adapter_refs: object;
  model_weight_table: object;
  reducer_config: object;
  validation_rules: object;
  status: string;
  created_by: string;
  created_at: Date;
};

type SourceRow = {
  id: string;
  radar_id: string;
  kind: string;
  name: string;
  uri: string;
  adapter_config: object | null;
  trust_profile: object | null;
  freshness_policy: object | null;
  status: string;
  created_at: Date;
};

type PacketRow = {
  id: string;
  radar_id: string;
  module_version_id: string;
  timestamp_utc: Date;
  model_id: string;
  sources: object;
  signal_scores: object;
  branch_assessment: object;
  uncertainties: object;
  weight: number;
  received_at: Date;
};

type SnapshotRow = {
  id: string;
  radar_id: string;
  module_version_id: string;
  snapshot_kind: string;
  as_of_utc: Date;
  signals: object;
  branches: object;
  model_count: number;
  disagreement_index: number;
  quality_score: number;
  render_state: object;
  created_at: Date;
};

type AuditRow = {
  id: string;
  radar_id: string;
  event_type: string;
  payload: object;
  created_at: Date;
};

type SignalRow = {
  id: string;
  radar_id: string | null;
  source: string;
  text: string;
  title: string | null;
  links: string[];
  provenance: object;
  domain_tags: string[];
  content_hash: string | null;
  observed_at: Date;
  ingested_at: Date;
  metadata: object;
  created_at: Date;
};

type ThreadRow = {
  id: string;
  radar_id: string | null;
  kind: string;
  title: string;
  summary: string | null;
  members: object[];
  source_distribution: object;
  confidence: number;
  first_seen: Date;
  last_updated: Date;
  peak_activity: Date | null;
  domain_tags: string[];
  status: string;
  created_at: Date;
};

function nowIso(): string {
  return new Date().toISOString();
}

/** Safely parse a JSONB field that may come back as string or object from postgres driver */
function parseJsonb<T>(value: unknown): T {
  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }
  return value as T;
}

export class PostgresRadarStore {
  async getRadar(radarId: string): Promise<Radar | null> {
    const sql = getSql();
    const rows = await sql<RadarRow[]>`
      SELECT * FROM radars WHERE id = ${radarId}
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      category: r.category,
      status: r.status as Radar["status"],
      template_id: r.template_id ?? undefined,
      active_module_version_id: r.active_module_version_id ?? undefined,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
    };
  }

  async listRadars(): Promise<Radar[]> {
    const sql = getSql();
    const rows = await sql<RadarRow[]>`
      SELECT * FROM radars ORDER BY created_at DESC
    `;
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      category: r.category,
      status: r.status as Radar["status"],
      template_id: r.template_id ?? undefined,
      active_module_version_id: r.active_module_version_id ?? undefined,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
    }));
  }

  async createRadar(radar: Radar): Promise<void> {
    const sql = getSql();
    await sql`
      INSERT INTO radars (id, slug, name, category, status, template_id, active_module_version_id, created_at, updated_at)
      VALUES (
        ${radar.id},
        ${radar.slug},
        ${radar.name},
        ${radar.category},
        ${radar.status},
        ${radar.template_id ?? null},
        ${radar.active_module_version_id ?? null},
        ${radar.created_at},
        ${radar.updated_at}
      )
    `;
  }

  async updateRadar(radarId: string, updates: Partial<Radar>): Promise<void> {
    const sql = getSql();
    // Read current state, merge updates, write back to avoid trailing-comma SQL issues
    const current = await this.getRadar(radarId);
    if (!current) return;
    const merged = { ...current, ...updates, updated_at: nowIso() };
    await sql`
      UPDATE radars SET
        status = ${merged.status},
        active_module_version_id = ${merged.active_module_version_id ?? null},
        updated_at = ${merged.updated_at}
      WHERE id = ${radarId}
    `;
  }

  async getModuleVersion(moduleVersionId: string): Promise<RadarModuleVersion | null> {
    const sql = getSql();
    const rows = await sql<ModuleVersionRow[]>`
      SELECT * FROM radar_module_versions WHERE id = ${moduleVersionId}
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      radar_id: r.radar_id,
      version: r.version,
      signal_definitions: parseJsonb<RadarModuleVersion["signal_definitions"]>(r.signal_definitions),
      branch_definitions: parseJsonb<RadarModuleVersion["branch_definitions"]>(r.branch_definitions),
      source_adapter_refs: parseJsonb<RadarModuleVersion["source_adapter_refs"]>(r.source_adapter_refs),
      model_weight_table: parseJsonb<RadarModuleVersion["model_weight_table"]>(r.model_weight_table),
      reducer_config: parseJsonb<RadarModuleVersion["reducer_config"]>(r.reducer_config),
      validation_rules: parseJsonb<RadarModuleVersion["validation_rules"]>(r.validation_rules),
      status: r.status as RadarModuleVersion["status"],
      created_by: r.created_by,
      created_at: r.created_at.toISOString(),
    };
  }

  async listModuleVersions(radarId: string): Promise<RadarModuleVersion[]> {
    const sql = getSql();
    const rows = await sql<ModuleVersionRow[]>`
      SELECT * FROM radar_module_versions WHERE radar_id = ${radarId} ORDER BY version DESC
    `;
    return rows.map((r) => ({
      id: r.id,
      radar_id: r.radar_id,
      version: r.version,
      signal_definitions: parseJsonb<RadarModuleVersion["signal_definitions"]>(r.signal_definitions),
      branch_definitions: parseJsonb<RadarModuleVersion["branch_definitions"]>(r.branch_definitions),
      source_adapter_refs: parseJsonb<RadarModuleVersion["source_adapter_refs"]>(r.source_adapter_refs),
      model_weight_table: parseJsonb<RadarModuleVersion["model_weight_table"]>(r.model_weight_table),
      reducer_config: parseJsonb<RadarModuleVersion["reducer_config"]>(r.reducer_config),
      validation_rules: parseJsonb<RadarModuleVersion["validation_rules"]>(r.validation_rules),
      status: r.status as RadarModuleVersion["status"],
      created_by: r.created_by,
      created_at: r.created_at.toISOString(),
    }));
  }

  async createModuleVersion(mv: RadarModuleVersion): Promise<void> {
    const sql = getSql();
    await sql`
      INSERT INTO radar_module_versions (
        id, radar_id, version, signal_definitions, branch_definitions,
        source_adapter_refs, model_weight_table, reducer_config, validation_rules,
        status, created_by, created_at
      ) VALUES (
        ${mv.id},
        ${mv.radar_id},
        ${mv.version},
        ${JSON.stringify(mv.signal_definitions)}::jsonb,
        ${JSON.stringify(mv.branch_definitions)}::jsonb,
        ${JSON.stringify(mv.source_adapter_refs)}::jsonb,
        ${JSON.stringify(mv.model_weight_table)}::jsonb,
        ${JSON.stringify(mv.reducer_config)}::jsonb,
        ${JSON.stringify(mv.validation_rules)}::jsonb,
        ${mv.status},
        ${mv.created_by},
        ${mv.created_at}
      )
    `;
  }

  async listSources(radarId: string): Promise<SourceDefinition[]> {
    const sql = getSql();
    const rows = await sql<SourceRow[]>`
      SELECT * FROM radar_sources WHERE radar_id = ${radarId}
    `;
    return rows.map((r) => ({
      id: r.id,
      radar_id: r.radar_id,
      kind: r.kind as SourceDefinition["kind"],
      name: r.name,
      uri: r.uri,
      adapter_config: parseJsonb<SourceDefinition["adapter_config"]>(r.adapter_config ?? {}),
      trust_profile: parseJsonb<SourceDefinition["trust_profile"]>(r.trust_profile ?? {}),
      freshness_policy: parseJsonb<SourceDefinition["freshness_policy"]>(r.freshness_policy ?? {}),
      status: r.status as SourceDefinition["status"],
    }));
  }

  async createSource(source: SourceDefinition): Promise<void> {
    const sql = getSql();
    await sql`
      INSERT INTO radar_sources (id, radar_id, kind, name, uri, adapter_config, trust_profile, freshness_policy, status, created_at)
      VALUES (
        ${source.id},
        ${source.radar_id},
        ${source.kind},
        ${source.name},
        ${source.uri},
        ${JSON.stringify(source.adapter_config ?? {})}::jsonb,
        ${JSON.stringify(source.trust_profile ?? {})}::jsonb,
        ${JSON.stringify(source.freshness_policy ?? {})}::jsonb,
        ${source.status},
        ${nowIso()}
      )
    `;
  }

  async listSubmissions(radarId: string): Promise<ModelSubmission[]> {
    const sql = getSql();
    const rows = await sql<PacketRow[]>`
      SELECT * FROM radar_packets WHERE radar_id = ${radarId} ORDER BY received_at ASC
    `;
    return rows.map((r) => ({
      packet: {
        thread_id: r.id,
        radar_id: r.radar_id,
        module_version_id: r.module_version_id,
        timestamp_utc: r.timestamp_utc.toISOString(),
        model_id: r.model_id,
        sources: parseJsonb<RadarAssessmentPacket["sources"]>(r.sources),
        signal_scores: parseJsonb<RadarAssessmentPacket["signal_scores"]>(r.signal_scores),
        branch_assessment: parseJsonb<RadarAssessmentPacket["branch_assessment"]>(r.branch_assessment),
        uncertainties: parseJsonb<RadarAssessmentPacket["uncertainties"]>(r.uncertainties),
      },
      weight: r.weight,
      receivedAt: r.received_at.toISOString(),
    }));
  }

  async createSubmission(packet: RadarAssessmentPacket, weight: number): Promise<void> {
    const sql = getSql();
    await sql`
      INSERT INTO radar_packets (
        id, radar_id, module_version_id, timestamp_utc, model_id,
        sources, signal_scores, branch_assessment, uncertainties,
        weight, received_at
      ) VALUES (
        ${packet.thread_id},
        ${packet.radar_id},
        ${packet.module_version_id},
        ${packet.timestamp_utc},
        ${packet.model_id},
        ${JSON.stringify(packet.sources)}::jsonb,
        ${JSON.stringify(packet.signal_scores)}::jsonb,
        ${JSON.stringify(packet.branch_assessment)}::jsonb,
        ${JSON.stringify(packet.uncertainties)}::jsonb,
        ${weight},
        ${nowIso()}
      )
    `;
  }

  async getLatestLiveSnapshot(radarId: string): Promise<ReducedSnapshot | null> {
    const sql = getSql();
    const rows = await sql<SnapshotRow[]>`
      SELECT * FROM radar_snapshots
      WHERE radar_id = ${radarId} AND snapshot_kind = 'live'
      ORDER BY as_of_utc DESC LIMIT 1
    `;
    if (rows.length === 0) return null;
    return this.rowToSnapshot(rows[0]);
  }

  async getLatestDailySnapshot(radarId: string): Promise<ReducedSnapshot | null> {
    const sql = getSql();
    const rows = await sql<SnapshotRow[]>`
      SELECT * FROM radar_snapshots
      WHERE radar_id = ${radarId} AND snapshot_kind = 'daily'
      ORDER BY as_of_utc DESC LIMIT 1
    `;
    if (rows.length === 0) return null;
    return this.rowToSnapshot(rows[0]);
  }

  async createSnapshot(snapshot: ReducedSnapshot): Promise<void> {
    const sql = getSql();
    await sql`
      INSERT INTO radar_snapshots (
        id, radar_id, module_version_id, snapshot_kind, as_of_utc,
        signals, branches, model_count, disagreement_index, quality_score, render_state
      ) VALUES (
        ${snapshot.id},
        ${snapshot.radar_id},
        ${snapshot.module_version_id},
        ${snapshot.snapshot_kind},
        ${snapshot.as_of_utc},
        ${JSON.stringify(snapshot.signals)}::jsonb,
        ${JSON.stringify(snapshot.branches)}::jsonb,
        ${snapshot.model_count},
        ${snapshot.disagreement_index},
        ${snapshot.quality_score},
        ${JSON.stringify(snapshot.render_state)}::jsonb
      )
    `;
  }

  async listDailySnapshots(radarId: string): Promise<ReducedSnapshot[]> {
    const sql = getSql();
    const rows = await sql<SnapshotRow[]>`
      SELECT * FROM radar_snapshots
      WHERE radar_id = ${radarId} AND snapshot_kind = 'daily'
      ORDER BY as_of_utc DESC
    `;
    return rows.map((r) => this.rowToSnapshot(r));
  }

  private rowToSnapshot(r: SnapshotRow): ReducedSnapshot {
    return {
      id: r.id,
      radar_id: r.radar_id,
      module_version_id: r.module_version_id,
      snapshot_kind: r.snapshot_kind as ReducedSnapshot["snapshot_kind"],
      as_of_utc: r.as_of_utc.toISOString(),
      signals: parseJsonb<ReducedSnapshot["signals"]>(r.signals),
      branches: parseJsonb<ReducedSnapshot["branches"]>(r.branches),
      model_count: r.model_count,
      disagreement_index: r.disagreement_index,
      quality_score: r.quality_score,
      render_state: parseJsonb<ReducedSnapshot["render_state"]>(r.render_state),
    };
  }

  async createAuditEvent(radarId: string, eventType: string, payload: object): Promise<void> {
    const sql = getSql();
    const id = `${radarId}:${eventType}:${Date.now()}`;
    await sql`
      INSERT INTO radar_audit_events (id, radar_id, event_type, payload)
      VALUES (${id}, ${radarId}, ${eventType}, ${JSON.stringify(payload)}::jsonb)
    `;
  }

  async listAuditEvents(radarId: string, limit = 100): Promise<Array<{ event_type: string; payload: object; created_at: string }>> {
    const sql = getSql();
    const rows = await sql<AuditRow[]>`
      SELECT * FROM radar_audit_events
      WHERE radar_id = ${radarId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      event_type: r.event_type,
      payload: parseJsonb<object>(r.payload),
      created_at: r.created_at.toISOString(),
    }));
  }

  // --- Signal CRUD ---

  async createSignal(signal: SignalEvent): Promise<void> {
    const sql = getSql();
    await sql`
      INSERT INTO signals (id, radar_id, source, text, title, links, provenance, domain_tags, content_hash, observed_at, ingested_at, metadata)
      VALUES (
        ${signal.id},
        ${signal.radar_id ?? null},
        ${signal.provenance.source_type},
        ${signal.text},
        ${signal.title ?? null},
        ${JSON.stringify(signal.links)}::jsonb,
        ${JSON.stringify(signal.provenance)}::jsonb,
        ${JSON.stringify(signal.domain_tags)}::jsonb,
        ${signal.content_hash ?? null},
        ${signal.observed_at},
        ${signal.ingested_at},
        ${JSON.stringify(signal.metadata)}::jsonb
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  async getSignal(signalId: string): Promise<SignalEvent | null> {
    const sql = getSql();
    const rows = await sql<SignalRow[]>`
      SELECT * FROM signals WHERE id = ${signalId}
    `;
    if (rows.length === 0) return null;
    return this.rowToSignal(rows[0]);
  }

  async listSignals(radarId?: string, limit = 100): Promise<SignalEvent[]> {
    const sql = getSql();
    const rows = radarId
      ? await sql<SignalRow[]>`
          SELECT * FROM signals WHERE radar_id = ${radarId}
          ORDER BY ingested_at DESC LIMIT ${limit}
        `
      : await sql<SignalRow[]>`
          SELECT * FROM signals
          ORDER BY ingested_at DESC LIMIT ${limit}
        `;
    return rows.map((r) => this.rowToSignal(r));
  }

  async updateSignal(signalId: string, updates: Partial<Pick<SignalEvent, "radar_id" | "domain_tags" | "metadata">>): Promise<void> {
    const sql = getSql();
    const current = await this.getSignal(signalId);
    if (!current) return;
    await sql`
      UPDATE signals SET
        radar_id = ${updates.radar_id !== undefined ? (updates.radar_id ?? null) : (current.radar_id ?? null)},
        domain_tags = ${JSON.stringify(updates.domain_tags ?? current.domain_tags)}::jsonb,
        metadata = ${JSON.stringify(updates.metadata ?? current.metadata)}::jsonb
      WHERE id = ${signalId}
    `;
  }

  async findSignalByContentHash(contentHash: string): Promise<SignalEvent | null> {
    const sql = getSql();
    const rows = await sql<SignalRow[]>`
      SELECT * FROM signals WHERE content_hash = ${contentHash} LIMIT 1
    `;
    if (rows.length === 0) return null;
    return this.rowToSignal(rows[0]);
  }

  private rowToSignal(r: SignalRow): SignalEvent {
    return {
      id: r.id,
      radar_id: r.radar_id ?? undefined,
      provenance: parseJsonb<SignalEvent["provenance"]>(r.provenance),
      text: r.text,
      title: r.title ?? undefined,
      links: parseJsonb<string[]>(r.links),
      domain_tags: parseJsonb<string[]>(r.domain_tags),
      content_hash: r.content_hash ?? undefined,
      observed_at: r.observed_at.toISOString(),
      ingested_at: r.ingested_at.toISOString(),
      metadata: parseJsonb<Record<string, unknown>>(r.metadata),
    };
  }

  // --- Thread CRUD ---

  async createThread(thread: Thread): Promise<void> {
    const sql = getSql();
    await sql`
      INSERT INTO threads (id, radar_id, kind, title, summary, members, source_distribution, confidence, first_seen, last_updated, peak_activity, domain_tags, status)
      VALUES (
        ${thread.id},
        ${thread.radar_id ?? null},
        ${thread.kind},
        ${thread.title},
        ${thread.summary ?? null},
        ${JSON.stringify(thread.members)}::jsonb,
        ${JSON.stringify(thread.source_distribution)}::jsonb,
        ${thread.confidence},
        ${thread.timeline.first_seen},
        ${thread.timeline.last_updated},
        ${thread.timeline.peak_activity ?? null},
        ${JSON.stringify(thread.domain_tags)}::jsonb,
        ${thread.status}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  async getThread(threadId: string): Promise<Thread | null> {
    const sql = getSql();
    const rows = await sql<ThreadRow[]>`
      SELECT * FROM threads WHERE id = ${threadId}
    `;
    if (rows.length === 0) return null;
    return this.rowToThread(rows[0]);
  }

  async listThreads(radarId?: string, limit = 100): Promise<Thread[]> {
    const sql = getSql();
    const rows = radarId
      ? await sql<ThreadRow[]>`
          SELECT * FROM threads WHERE radar_id = ${radarId}
          ORDER BY last_updated DESC LIMIT ${limit}
        `
      : await sql<ThreadRow[]>`
          SELECT * FROM threads
          ORDER BY last_updated DESC LIMIT ${limit}
        `;
    return rows.map((r) => this.rowToThread(r));
  }

  async updateThread(threadId: string, updates: Partial<Pick<Thread, "title" | "summary" | "members" | "source_distribution" | "confidence" | "domain_tags" | "status">> & { last_updated?: string }): Promise<void> {
    const sql = getSql();
    const current = await this.getThread(threadId);
    if (!current) return;
    await sql`
      UPDATE threads SET
        title = ${updates.title ?? current.title},
        summary = ${updates.summary ?? current.summary ?? null},
        members = ${JSON.stringify(updates.members ?? current.members)}::jsonb,
        source_distribution = ${JSON.stringify(updates.source_distribution ?? current.source_distribution)}::jsonb,
        confidence = ${updates.confidence ?? current.confidence},
        domain_tags = ${JSON.stringify(updates.domain_tags ?? current.domain_tags)}::jsonb,
        status = ${updates.status ?? current.status},
        last_updated = ${updates.last_updated ?? current.timeline.last_updated}
      WHERE id = ${threadId}
    `;
  }

  private rowToThread(r: ThreadRow): Thread {
    return {
      id: r.id,
      radar_id: r.radar_id ?? undefined,
      kind: r.kind as Thread["kind"],
      title: r.title,
      summary: r.summary ?? undefined,
      members: parseJsonb<Thread["members"]>(r.members),
      source_distribution: parseJsonb<Record<string, number>>(r.source_distribution),
      confidence: r.confidence,
      timeline: {
        first_seen: r.first_seen.toISOString(),
        last_updated: r.last_updated.toISOString(),
        peak_activity: r.peak_activity?.toISOString(),
      },
      domain_tags: parseJsonb<string[]>(r.domain_tags),
      status: r.status as Thread["status"],
    };
  }
}