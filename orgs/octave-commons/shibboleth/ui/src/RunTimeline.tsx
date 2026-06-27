import React from 'react'

type TimelineRun = {
  id: string
  created_at?: string | null
  status?: string | null
  max_cases?: number | null
  models?: string[]
  placement_modes?: string | null
  tmux_running?: boolean
}

type Props = {
  runs: TimelineRun[]
  activeRunId?: string | null
  onSelect?: (runId: string) => void
}

function statusColor(status: string | null | undefined): string {
  switch (status) {
    case 'running':
      return '#40C057'
    case 'completed':
    case 'succeeded':
      return '#4DABF7'
    case 'failed':
      return '#FF922B'
    case 'incomplete':
      return '#FFD43B'
    default:
      return '#A5B2E5'
  }
}

function whenLabel(value: string | null | undefined): string {
  if (!value) return '—'
  if (value.includes('T')) return value.replace('T', ' ').replace('Z', ' UTC')
  return value
}

export function RunTimeline({ runs, activeRunId, onSelect }: Props) {
  return (
    <div className="timelineStrip">
      {runs.map((run) => (
        <button
          key={run.id}
          type="button"
          className={activeRunId === run.id ? 'timelineCard active' : 'timelineCard'}
          onClick={() => onSelect?.(run.id)}
        >
          <div className="timelineAccent" style={{ background: statusColor(run.status) }} />
          <div className="timelineBody">
            <div className="timelineTitle">{run.id}</div>
            <div className="timelineMeta">{whenLabel(run.created_at)}</div>
            <div className="timelineMeta">
              status={run.status ?? '—'} · cases={run.max_cases ?? '—'} · models={(run.models ?? []).length}
            </div>
            <div className="timelineMeta">placement={run.placement_modes ?? '—'}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
