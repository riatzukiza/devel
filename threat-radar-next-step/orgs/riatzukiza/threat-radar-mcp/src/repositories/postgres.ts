import type { Pool } from 'pg';
import type {
  AddSourceInput,
  CreateProposalInput,
  CreateRadarInput,
  RadarRepository,
  SaveLiveSnapshotInput,
  SavePacketInput,
  SealDailySnapshotInput,
} from './interface';

export class PostgresRadarRepository implements RadarRepository {
  constructor(private readonly pool: Pool) {}

  async createRadar(input: CreateRadarInput): Promise<{ id: string; slug: string }> {
    const { rows } = await this.pool.query(
      `
        insert into radar (slug, title, description, template_key, owner_node)
        values ($1, $2, coalesce($3, ''), $4, coalesce($5, 'local'))
        returning id, slug
      `,
      [input.slug, input.title, input.description ?? '', input.templateKey ?? null, input.ownerNode ?? 'local'],
    );
    return rows[0];
  }

  async listRadars(): Promise<Array<{ id: string; slug: string; title: string; status: string }>> {
    const { rows } = await this.pool.query(
      `select id, slug, title, status from radar order by updated_at desc, created_at desc`,
    );
    return rows;
  }

  async addSource(input: AddSourceInput): Promise<{ id: string; sourceKey: string }> {
    const { rows } = await this.pool.query(
      `
        insert into source_definition
          (radar_id, source_key, source_type, title, trust_weight, config)
        values ($1, $2, $3, $4, coalesce($5, 1.0), $6::jsonb)
        on conflict (radar_id, source_key)
        do update set
          source_type = excluded.source_type,
          title = excluded.title,
          trust_weight = excluded.trust_weight,
          config = excluded.config,
          enabled = true
        returning id, source_key as "sourceKey"
      `,
      [
        input.radarId,
        input.sourceKey,
        input.sourceType,
        input.title,
        input.trustWeight ?? 1.0,
        JSON.stringify(input.config),
      ],
    );
    return rows[0];
  }

  async savePacket(input: SavePacketInput): Promise<{ id: string }> {
    const { rows } = await this.pool.query(
      `
        insert into assessment_packet
          (radar_id, module_version_id, model_id, packet_timestamp, packet, evidence_hash, support_weight)
        values ($1, $2, $3, $4::timestamptz, $5::jsonb, $6, coalesce($7, 1.0))
        returning id
      `,
      [
        input.radarId,
        input.moduleVersionId ?? null,
        input.modelId,
        input.packetTimestamp,
        JSON.stringify(input.packet),
        input.evidenceHash,
        input.supportWeight ?? 1.0,
      ],
    );
    return rows[0];
  }

  async saveLiveSnapshot(input: SaveLiveSnapshotInput): Promise<{ id: string }> {
    const { rows } = await this.pool.query(
      `
        insert into reduced_snapshot
          (radar_id, snapshot_kind, live_revision, reducer_version, packet_count, disagreement_score, snapshot)
        values ($1, 'live', $2, $3, $4, $5, $6::jsonb)
        on conflict (radar_id, snapshot_kind, live_revision)
        do update set
          reducer_version = excluded.reducer_version,
          packet_count = excluded.packet_count,
          disagreement_score = excluded.disagreement_score,
          snapshot = excluded.snapshot,
          created_at = now()
        returning id
      `,
      [
        input.radarId,
        input.liveRevision,
        input.reducerVersion,
        input.packetCount,
        input.disagreementScore,
        JSON.stringify(input.snapshot),
      ],
    );
    return rows[0];
  }

  async sealDailySnapshot(input: SealDailySnapshotInput): Promise<{ id: string }> {
    const { rows } = await this.pool.query(
      `
        insert into reduced_snapshot
          (radar_id, snapshot_kind, snapshot_date, reducer_version, packet_count, disagreement_score, snapshot)
        values ($1, 'daily', $2::date, $3, $4, $5, $6::jsonb)
        on conflict (radar_id, snapshot_kind, snapshot_date)
        do update set
          reducer_version = excluded.reducer_version,
          packet_count = excluded.packet_count,
          disagreement_score = excluded.disagreement_score,
          snapshot = excluded.snapshot,
          created_at = now()
        returning id
      `,
      [
        input.radarId,
        input.snapshotDate,
        input.reducerVersion,
        input.packetCount,
        input.disagreementScore,
        JSON.stringify(input.snapshot),
      ],
    );
    return rows[0];
  }

  async createProposal(input: CreateProposalInput): Promise<{ id: string }> {
    const { rows } = await this.pool.query(
      `
        insert into change_proposal
          (radar_id, target_module_kind, title, rationale, proposed_payload, proposed_by, proposal_status)
        values ($1, $2, $3, coalesce($4, ''), $5::jsonb, coalesce($6, 'agent'), 'proposed')
        returning id
      `,
      [
        input.radarId,
        input.targetModuleKind,
        input.title,
        input.rationale ?? '',
        JSON.stringify(input.proposedPayload),
        input.proposedBy ?? 'agent',
      ],
    );
    return rows[0];
  }

  async getWallView(): Promise<
    Array<{
      radarId: string;
      slug: string;
      title: string;
      status: string;
      latestSnapshot: Record<string, unknown> | null;
      latestSnapshotAt: string | null;
    }>
  > {
    const { rows } = await this.pool.query(
      `
        with ranked_live as (
          select
            rs.radar_id,
            rs.snapshot,
            rs.created_at,
            row_number() over (partition by rs.radar_id order by rs.created_at desc) as rn
          from reduced_snapshot rs
          where rs.snapshot_kind = 'live'
        )
        select
          r.id as "radarId",
          r.slug,
          r.title,
          r.status,
          rl.snapshot as "latestSnapshot",
          rl.created_at as "latestSnapshotAt"
        from radar r
        left join ranked_live rl on rl.radar_id = r.id and rl.rn = 1
        where r.status in ('active', 'paused')
        order by r.updated_at desc, r.created_at desc
      `,
    );
    return rows;
  }
}
