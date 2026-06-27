import React, { useEffect, useMemo, useState } from 'react'
import logoUrl from './assets/shibboleth-logo.svg'
import { ChatLab } from './ChatLab'
import { RunTimeline } from './RunTimeline'
import { TruthScatter } from './TruthScatter'
import {
  createRun,
  getBenchAggregate,
  getBenchRun,
  getRun,
  getSources,
  listBenchRuns,
  listRuns,
  renderPipeline,
  startBenchRun,
  startRun,
  stopBenchRun,
  type Source,
} from './api'

type PipelineDraft = {
  name: string
  seed: number
  dataDir: string
  tier2: boolean
  sources: string[]
  transforms: {
    tier1: { languages: string[]; scope: 'all' | 'high-affinity'; batchSize: number }
    tier2: { languages: string[]; scope: 'all' | 'high-affinity'; batchSize: number }
  }
}

type ControlPlaneRun = {
  id: string
  status?: string
}

type BenchmarkRunSummary = {
  id: string
  status?: string
  models?: string[]
  max_cases?: number
  placement_modes?: string | null
  tmux_session?: string | null
  tmux_running?: boolean
  metrics_present?: boolean
  launcher_log_present?: boolean
  events_present?: boolean
  created_at?: string | null
}

type BenchmarkModelSummary = {
  policy_layer?: string
  target_model?: string
  placement_mode?: string
  n_total?: number
  n_errors?: number
  n_adversarial?: number
  n_benign?: number
  asr?: number | null
  fpr?: number | null
  benign_task_success_rate?: number | null
  harm_ci_low?: number | null
  harm_ci_high?: number | null
  benign_ci_low?: number | null
  benign_ci_high?: number | null
}

type BenchmarkRunDetail = BenchmarkRunSummary & {
  config?: Record<string, unknown>
  log_tail?: string
  model_summaries?: BenchmarkModelSummary[]
}

type AggregateSummary = {
  judged_only?: boolean
  placement_mode?: string | null
  target_models?: string[] | null
  run_id_query?: string | null
  included_run_ids?: string[]
  included_runs?: BenchmarkRunSummary[]
  included_run_count?: number
  raw_event_count?: number
  unique_event_count?: number
  duplicate_event_count?: number
  parse_error_count?: number
  model_summaries?: BenchmarkModelSummary[]
}

const DEFAULT_TIER1 = ['es', 'fr', 'zh', 'ar', 'ja', 'hi', 'ru', 'pt', 'de', 'ko']
const DEFAULT_TIER2 = ['tl', 'sw', 'ur', 'bn', 'th', 'vi', 'id', 'tr', 'fa', 'he']
const DEFAULT_BENCH_MODELS = 'glm-5,gpt-5.2,gpt-5.4,kimi-k2.5,factory/claude-opus-4-6'

function parseLangs(s: string): string[] {
  return s
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.replace(/^:/, ''))
}

function pct(value: number | null | undefined): string {
  return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '—'
}

function metricWidth(value: number | null | undefined): number {
  return typeof value === 'number' ? Math.max(0, Math.min(100, value * 100)) : 0
}

function statusTone(status: string | null | undefined): string {
  switch (status) {
    case 'running':
      return 'running'
    case 'completed':
    case 'succeeded':
      return 'ok'
    case 'failed':
      return 'bad'
    default:
      return 'idle'
  }
}

function formatWhen(value: string | null | undefined): string {
  if (!value) return '—'
  if (value.includes('T')) return value.replace('T', ' ').replace('Z', ' UTC')
  return value
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((item) => String(item)) : []
}

function MetricBar({ label, value, color }: { label: string; value: number | null | undefined; color: string }) {
  return (
    <div className="metricBarRow">
      <div className="metricLabel">{label}</div>
      <div className="metricTrack">
        <div className="metricFill" style={{ width: `${metricWidth(value)}%`, background: color }} />
      </div>
      <div className="metricValue">{pct(value)}</div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="statCard">
      <div className="statLabel">{label}</div>
      <div className="statValue">{value}</div>
      {sub ? <div className="statSub">{sub}</div> : null}
    </div>
  )
}

function StatusPill({ status }: { status: string | null | undefined }) {
  return <span className={`statusPill ${statusTone(status)}`}>{status ?? 'unknown'}</span>
}

export function App() {
  const [sources, setSources] = useState<Source[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [edn, setEdn] = useState<string>('')
  const [runs, setRuns] = useState<ControlPlaneRun[]>([])
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [activeRun, setActiveRun] = useState<Record<string, unknown> | null>(null)
  const [logTail, setLogTail] = useState<string>('')
  const [benchRuns, setBenchRuns] = useState<BenchmarkRunSummary[]>([])
  const [activeBenchId, setActiveBenchId] = useState<string | null>(null)
  const [activeBench, setActiveBench] = useState<BenchmarkRunDetail | null>(null)
  const [aggregate, setAggregate] = useState<AggregateSummary | null>(null)
  const [err, setErr] = useState<string>('')

  const [name, setName] = useState('dataset')
  const [seed, setSeed] = useState(1337)
  const [tier2Enabled, setTier2Enabled] = useState(true)
  const [tier1Scope, setTier1Scope] = useState<'all' | 'high-affinity'>('all')
  const [tier2Scope, setTier2Scope] = useState<'all' | 'high-affinity'>('all')
  const [tier1Langs, setTier1Langs] = useState(DEFAULT_TIER1.join(', '))
  const [tier2Langs, setTier2Langs] = useState(DEFAULT_TIER2.join(', '))
  const [batchSize, setBatchSize] = useState(25)

  const [benchModels, setBenchModels] = useState(DEFAULT_BENCH_MODELS)
  const [benchMaxCases, setBenchMaxCases] = useState(1200)
  const [benchConcurrency, setBenchConcurrency] = useState(4)
  const [benchSeed, setBenchSeed] = useState(20260320)
  const [aggregateJudgedOnly, setAggregateJudgedOnly] = useState(true)
  const [aggregatePlacement, setAggregatePlacement] = useState('')
  const [aggregateModels, setAggregateModels] = useState('')
  const [aggregateRunQuery, setAggregateRunQuery] = useState('')

  const draft: PipelineDraft = useMemo(
    () => ({
      name,
      seed,
      dataDir: 'data',
      tier2: tier2Enabled,
      sources: Object.entries(selected)
        .filter(([, value]) => value)
        .map(([key]) => key),
      transforms: {
        tier1: { languages: parseLangs(tier1Langs), scope: tier1Scope, batchSize },
        tier2: { languages: parseLangs(tier2Langs), scope: tier2Scope, batchSize },
      },
    }),
    [selected, name, seed, tier2Enabled, tier1Scope, tier2Scope, tier1Langs, tier2Langs, batchSize],
  )

  const filteredSources = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sources
    return sources.filter((source) =>
      `${source.name} ${source.description} ${source.license ?? ''} ${source.format ?? ''}`.toLowerCase().includes(q),
    )
  }, [sources, query])

  const aggregateSummaries = aggregate?.model_summaries ?? []
  const aggregateIncludedRuns = aggregate?.included_runs ?? []
  const detailSummaries = activeBench?.model_summaries ?? []
  const aggregateScatter = aggregateSummaries.map((row) => ({
    label: row.target_model ?? 'model',
    asr: row.asr,
    fpr: row.fpr,
    tsr: row.benign_task_success_rate,
    errors: row.n_errors,
  }))
  const detailScatter = detailSummaries.map((row) => ({
    label: row.target_model ?? 'model',
    asr: row.asr,
    fpr: row.fpr,
    tsr: row.benign_task_success_rate,
    errors: row.n_errors,
  }))

  const activeJobs = benchRuns.filter((run) => run.status === 'running' || run.tmux_running)
  const completedJobs = benchRuns.filter((run) => run.status === 'completed' || run.status === 'succeeded')
  const incompleteJobs = benchRuns.filter((run) => run.status === 'failed' || run.status === 'incomplete')

  const aggregateRequest = useMemo(
    () => ({
      judged_only: aggregateJudgedOnly,
      placement_mode: aggregatePlacement || null,
      target_models: aggregateModels || null,
      run_id_query: aggregateRunQuery || null,
    }),
    [aggregateJudgedOnly, aggregatePlacement, aggregateModels, aggregateRunQuery],
  )

  async function refreshRuns(): Promise<void> {
    const response = await listRuns()
    setRuns((response.runs ?? []) as ControlPlaneRun[])
  }

  async function refreshBenchRuns(): Promise<void> {
    const response = await listBenchRuns()
    setBenchRuns((response.runs ?? []) as BenchmarkRunSummary[])
  }

  async function refreshAggregate(): Promise<void> {
    const response = await getBenchAggregate(aggregateRequest)
    setAggregate((response.aggregate ?? null) as AggregateSummary | null)
  }

  useEffect(() => {
    ;(async () => {
      try {
        setErr('')
        const fetchedSources = await getSources()
        setSources(fetchedSources)
        await Promise.all([refreshRuns(), refreshBenchRuns(), refreshAggregate()])
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e))
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        await refreshAggregate()
      } catch {
        // ignore reactive aggregate refresh errors
      }
    })()
  }, [aggregateRequest])

  useEffect(() => {
    if (!activeRunId) return
    const timer = setInterval(async () => {
      try {
        const response = await getRun(activeRunId)
        setActiveRun((response.run ?? null) as Record<string, unknown> | null)
        setLogTail(String(response.logTail ?? ''))
      } catch {
        // ignore polling errors
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [activeRunId])

  useEffect(() => {
    if (!activeBenchId) return
    const timer = setInterval(async () => {
      try {
        const [detail, list, agg] = await Promise.all([getBenchRun(activeBenchId), listBenchRuns(), getBenchAggregate(aggregateRequest)])
        setActiveBench((detail.run ?? null) as BenchmarkRunDetail | null)
        setBenchRuns((list.runs ?? []) as BenchmarkRunSummary[])
        setAggregate((agg.aggregate ?? null) as AggregateSummary | null)
      } catch {
        // ignore polling errors
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [activeBenchId, aggregateRequest])

  return (
    <div className="dashboardShell">
      <div className="layout">
        <header className="heroCard">
          <img className="heroLogo" src={logoUrl} alt="שִׁבֹּלֶת" />
          <div className="heroText">
            <h1>Shibboleth truth console</h1>
            <p>
              Put the runs together meaningfully. See live jobs, inspect evidence, aggregate the judged regime, and chart the model surface from the browser.
            </p>
            <div className="heroMeta">
              <span>שִׁבֹּלֶת</span>
              <span>browser job control</span>
              <span>aggregated truth view</span>
            </div>
          </div>
        </header>

        {err ? <div className="error">{err}</div> : null}

        <div className="statsGrid">
          <StatCard label="Live jobs" value={String(activeJobs.length)} sub="tmux-backed host benches" />
          <StatCard label="Completed runs" value={String(completedJobs.length)} sub="metrics materialized" />
          <StatCard label="Aggregate unique cases" value={String(aggregate?.unique_event_count ?? '—')} sub="deduped across judged runs" />
          <StatCard label="Duplicate reductions" value={String(aggregate?.duplicate_event_count ?? '—')} sub="overlap removed from the big picture" />
        </div>

        <div className="grid dashboardGrid">
          <ChatLab />
        </div>

        <div className="grid dashboardGrid">
          <section className="span2 glassPanel">
            <div className="sectionHeader">
              <h2>Big picture aggregation</h2>
              <div className="buttons">
                <button onClick={refreshAggregate}>Refresh aggregate</button>
              </div>
            </div>

            <div className="aggregateControls">
              <label className="inlineToggle">
                <input type="checkbox" checked={aggregateJudgedOnly} onChange={(e) => setAggregateJudgedOnly(e.target.checked)} />
                <span>judged-only truth regime</span>
              </label>
              <label>
                <span>placement</span>
                <select value={aggregatePlacement} onChange={(e) => setAggregatePlacement(e.target.value)}>
                  <option value="">all placements</option>
                  <option value="direct-user">direct-user</option>
                  <option value="system-context">system-context</option>
                  <option value="developer-context">developer-context</option>
                </select>
              </label>
              <label>
                <span>model filter</span>
                <input value={aggregateModels} onChange={(e) => setAggregateModels(e.target.value)} placeholder="gpt-5.2,gpt-5.4" />
              </label>
              <label>
                <span>run id contains</span>
                <input value={aggregateRunQuery} onChange={(e) => setAggregateRunQuery(e.target.value)} placeholder="significance-direct-user" />
              </label>
            </div>

            <div className="kv heroKv">
              <div>mode</div>
              <div>{aggregate?.judged_only ? 'judged llm-rubric only' : 'all runs'}</div>
              <div>included runs</div>
              <div>{aggregate?.included_run_count ?? '—'}</div>
              <div>raw events</div>
              <div>{aggregate?.raw_event_count ?? '—'}</div>
              <div>unique events</div>
              <div>{aggregate?.unique_event_count ?? '—'}</div>
              <div>parse errors</div>
              <div>{aggregate?.parse_error_count ?? '—'}</div>
            </div>

            {aggregateIncludedRuns.length ? (
              <>
                <h3>Included runs timeline</h3>
                <RunTimeline runs={aggregateIncludedRuns} activeRunId={activeBenchId} onSelect={setActiveBenchId} />
              </>
            ) : null}

            {aggregateScatter.length ? (
              <div className="chartFrame">
                <TruthScatter points={aggregateScatter} />
              </div>
            ) : (
              <div className="emptyState">Aggregation is empty right now. Once judged runs are present, this panel combines them into a deduped model-level view.</div>
            )}

            {aggregateSummaries.length ? (
              <>
                <div className="metricBars">
                  {aggregateSummaries.map((row) => (
                    <div key={`${row.policy_layer}-${row.target_model}-${row.placement_mode}`} className="metricCard">
                      <h3>
                        {row.target_model ?? 'model'} <span className="muted">/ {row.placement_mode ?? '—'}</span>
                      </h3>
                      <MetricBar label="ASR" value={row.asr} color="#E64980" />
                      <MetricBar label="FPR" value={row.fpr} color="#F08C00" />
                      <MetricBar label="TSR" value={row.benign_task_success_rate} color="#2B8A3E" />
                      <div className="small muted">
                        adv={row.n_adversarial ?? 0} · benign={row.n_benign ?? 0} · errors={row.n_errors ?? 0}
                      </div>
                    </div>
                  ))}
                </div>

                <table className="metricsTable">
                  <thead>
                    <tr>
                      <th>policy</th>
                      <th>model</th>
                      <th>placement</th>
                      <th>ASR</th>
                      <th>harm CI</th>
                      <th>FPR</th>
                      <th>benign CI</th>
                      <th>TSR</th>
                      <th>errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregateSummaries.map((row) => (
                      <tr key={`${row.policy_layer}-${row.target_model}-${row.placement_mode}-agg`}>
                        <td>{row.policy_layer ?? '—'}</td>
                        <td>{row.target_model ?? '—'}</td>
                        <td>{row.placement_mode ?? '—'}</td>
                        <td>{pct(row.asr)}</td>
                        <td>
                          {pct(row.harm_ci_low)} – {pct(row.harm_ci_high)}
                        </td>
                        <td>{pct(row.fpr)}</td>
                        <td>
                          {pct(row.benign_ci_low)} – {pct(row.benign_ci_high)}
                        </td>
                        <td>{pct(row.benign_task_success_rate)}</td>
                        <td>{row.n_errors ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}
          </section>

          <section>
            <div className="sectionHeader">
              <h2>Benchmark jobs</h2>
              <button onClick={refreshBenchRuns}>Refresh</button>
            </div>
            <div className="list jobsList">
              {benchRuns.map((run) => (
                <button
                  key={run.id}
                  className={activeBenchId === run.id ? 'run active' : 'run'}
                  onClick={() => setActiveBenchId(run.id)}
                >
                  <div className="runRowTop">
                    <div className="runTitle">{run.id}</div>
                    <StatusPill status={run.status} />
                  </div>
                  <div className="runMeta">
                    models={(run.models ?? []).length} · max-cases={run.max_cases ?? '—'} · created {formatWhen(run.created_at)}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="sectionHeader">
              <h2>Launch benchmark</h2>
            </div>
            <div className="form benchForm">
              <label>
                <span>models</span>
                <input value={benchModels} onChange={(e) => setBenchModels(e.target.value)} />
              </label>
              <label>
                <span>max cases</span>
                <input
                  type="number"
                  value={benchMaxCases}
                  onChange={(e) => setBenchMaxCases(Number.parseInt(e.target.value || '1200', 10))}
                />
              </label>
              <label>
                <span>concurrency</span>
                <input
                  type="number"
                  value={benchConcurrency}
                  onChange={(e) => setBenchConcurrency(Number.parseInt(e.target.value || '4', 10))}
                />
              </label>
              <label>
                <span>seed</span>
                <input
                  type="number"
                  value={benchSeed}
                  onChange={(e) => setBenchSeed(Number.parseInt(e.target.value || '20260320', 10))}
                />
              </label>
            </div>
            <div className="buttons">
              <button
                onClick={async () => {
                  try {
                    setErr('')
                    const result = await startBenchRun({
                      models: benchModels,
                      max_cases: benchMaxCases,
                      concurrency: benchConcurrency,
                      seed: benchSeed,
                    })
                    setActiveBenchId(String(result.run_id))
                    await Promise.all([refreshBenchRuns(), refreshAggregate()])
                  } catch (e: unknown) {
                    setErr(e instanceof Error ? e.message : String(e))
                  }
                }}
              >
                Start host-native job
              </button>
              <button
                disabled={!activeBenchId}
                onClick={async () => {
                  if (!activeBenchId) return
                  try {
                    setErr('')
                    await stopBenchRun(activeBenchId)
                    await Promise.all([refreshBenchRuns(), refreshAggregate()])
                    const detail = await getBenchRun(activeBenchId)
                    setActiveBench((detail.run ?? null) as BenchmarkRunDetail | null)
                  } catch (e: unknown) {
                    setErr(e instanceof Error ? e.message : String(e))
                  }
                }}
              >
                Stop selected job
              </button>
            </div>
            <div className="small muted cardNote">
              Jobs run through <code>scripts/ussy_host_long_bench.sh</code> with the host secret token file. Aggregate summaries dedupe overlapping cases across judged runs.
            </div>
          </section>

          <section className="span2 glassPanel">
            <div className="sectionHeader">
              <h2>Selected run</h2>
              <div className="headerMeta">
                <StatusPill status={activeBench?.status} />
                <span>{activeBench?.tmux_session ?? 'no tmux session'}</span>
              </div>
            </div>
            <div className="kv heroKv">
              <div>run</div>
              <div>{activeBench?.id ?? '—'}</div>
              <div>models</div>
              <div>{(activeBench?.models ?? []).join(', ') || '—'}</div>
              <div>max cases</div>
              <div>{activeBench?.max_cases ?? '—'}</div>
              <div>created</div>
              <div>{formatWhen(activeBench?.created_at)}</div>
            </div>

            {detailScatter.length ? (
              <div className="chartFrame">
                <TruthScatter points={detailScatter} />
              </div>
            ) : (
              <div className="emptyState">Run metrics are not ready yet. The job may still be warming up or writing its first summaries.</div>
            )}

            {detailSummaries.length ? (
              <>
                <div className="metricBars">
                  {detailSummaries.map((row) => (
                    <div key={`${row.policy_layer}-${row.target_model}-${row.placement_mode}`} className="metricCard">
                      <h3>
                        {row.target_model ?? 'model'} <span className="muted">/ {row.placement_mode ?? '—'}</span>
                      </h3>
                      <MetricBar label="ASR" value={row.asr} color="#E64980" />
                      <MetricBar label="FPR" value={row.fpr} color="#F08C00" />
                      <MetricBar label="TSR" value={row.benign_task_success_rate} color="#2B8A3E" />
                      <div className="small muted">
                        adv={row.n_adversarial ?? 0} · benign={row.n_benign ?? 0} · errors={row.n_errors ?? 0}
                      </div>
                    </div>
                  ))}
                </div>

                <table className="metricsTable">
                  <thead>
                    <tr>
                      <th>policy</th>
                      <th>model</th>
                      <th>placement</th>
                      <th>ASR</th>
                      <th>harm CI</th>
                      <th>FPR</th>
                      <th>benign CI</th>
                      <th>TSR</th>
                      <th>errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailSummaries.map((row) => (
                      <tr key={`${row.policy_layer}-${row.target_model}-${row.placement_mode}-detail`}>
                        <td>{row.policy_layer ?? '—'}</td>
                        <td>{row.target_model ?? '—'}</td>
                        <td>{row.placement_mode ?? '—'}</td>
                        <td>{pct(row.asr)}</td>
                        <td>
                          {pct(row.harm_ci_low)} – {pct(row.harm_ci_high)}
                        </td>
                        <td>{pct(row.fpr)}</td>
                        <td>
                          {pct(row.benign_ci_low)} – {pct(row.benign_ci_high)}
                        </td>
                        <td>{pct(row.benign_task_success_rate)}</td>
                        <td>{row.n_errors ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}

            <div className="splitPane">
              <div>
                <h3>Config</h3>
                <pre className="edn smallBlock">{JSON.stringify(activeBench?.config ?? {}, null, 2)}</pre>
              </div>
              <div>
                <h3>Log tail</h3>
                <pre className="log">{activeBench?.log_tail ?? '—'}</pre>
              </div>
            </div>
          </section>

          <section>
            <div className="sectionHeader">
              <h2>Pipeline sources</h2>
            </div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="filter sources…" />
            <div className="list">
              {filteredSources.map((source) => (
                <label key={source.name} className="row">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[source.name])}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [source.name]: e.target.checked }))}
                  />
                  <span className="name">{source.name}</span>
                  <span className="meta">
                    {source.format ?? '—'} / {source.license ?? '—'}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <div className="sectionHeader">
              <h2>EDN composer</h2>
              <button
                onClick={async () => {
                  setErr('')
                  const result = await renderPipeline(draft)
                  setEdn(result.edn)
                }}
              >
                Render EDN
              </button>
            </div>
            <div className="form">
              <label>
                <span>name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                <span>seed</span>
                <input type="number" value={seed} onChange={(e) => setSeed(Number.parseInt(e.target.value || '1337', 10))} />
              </label>
              <label className="inline">
                <input type="checkbox" checked={tier2Enabled} onChange={(e) => setTier2Enabled(e.target.checked)} />
                <span>enable tier2</span>
              </label>
              <label>
                <span>mt batch size</span>
                <input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number.parseInt(e.target.value || '25', 10))}
                />
              </label>
              <label>
                <span>tier1 languages</span>
                <input value={tier1Langs} onChange={(e) => setTier1Langs(e.target.value)} />
              </label>
              <label>
                <span>tier1 scope</span>
                <select value={tier1Scope} onChange={(e) => setTier1Scope(e.target.value as 'all' | 'high-affinity')}>
                  <option value="all">all</option>
                  <option value="high-affinity">high-affinity</option>
                </select>
              </label>
              <label>
                <span>tier2 languages</span>
                <input value={tier2Langs} onChange={(e) => setTier2Langs(e.target.value)} />
              </label>
              <label>
                <span>tier2 scope</span>
                <select value={tier2Scope} onChange={(e) => setTier2Scope(e.target.value as 'all' | 'high-affinity')}>
                  <option value="all">all</option>
                  <option value="high-affinity">high-affinity</option>
                </select>
              </label>
            </div>
            <div className="buttons">
              <button
                onClick={async () => {
                  setErr('')
                  const result = await createRun(draft)
                  setActiveRunId(String(result.run.id))
                  await refreshRuns()
                }}
              >
                Create control-plane run
              </button>
              <button disabled={!activeRunId} onClick={() => activeRunId && startRun(activeRunId, 'build')}>
                Build selected run
              </button>
            </div>
            <pre className="edn">{edn || 'Render EDN to preview the grammar instance.'}</pre>
          </section>

          <section>
            <div className="sectionHeader">
              <h2>Control-plane runs</h2>
              <button onClick={refreshRuns}>Refresh</button>
            </div>
            <div className="list">
              {runs.map((run) => (
                <button
                  key={run.id}
                  className={activeRunId === run.id ? 'run active' : 'run'}
                  onClick={() => setActiveRunId(run.id)}
                >
                  <div className="runRowTop">
                    <div className="runTitle">{run.id}</div>
                    <StatusPill status={run.status} />
                  </div>
                </button>
              ))}
            </div>
            <pre className="log">{logTail || JSON.stringify(activeRun ?? {}, null, 2)}</pre>
          </section>
        </div>
      </div>
    </div>
  )
}
