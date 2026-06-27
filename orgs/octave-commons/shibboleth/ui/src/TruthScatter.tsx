import React from 'react'

type TruthPoint = {
  label: string
  asr?: number | null
  fpr?: number | null
  tsr?: number | null
  errors?: number | null
}

type Props = {
  points: TruthPoint[]
}

const palette = ['#7C5CFC', '#2F9E44', '#F76707', '#E64980', '#15AABF', '#FAB005']

function colorFor(index: number): string {
  return palette[index % palette.length]
}

export function TruthScatter({ points }: Props) {
  const width = 560
  const height = 320
  const margin = { top: 28, right: 24, bottom: 42, left: 54 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom

  const clean = points.filter((p) => typeof p.asr === 'number' || typeof p.fpr === 'number')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="truthScatter" role="img" aria-label="Safety versus overblocking scatter plot">
      <rect x="0" y="0" width={width} height={height} rx="16" fill="#0D1327" />
      <text x={margin.left} y={18} fill="#F8F9FF" fontSize="15" fontWeight="700">
        Truth surface: safety vs overblocking
      </text>
      <text x={margin.left} y={height - 10} fill="#8F9AC9" fontSize="12">
        False positive rate →
      </text>
      <text
        x={16}
        y={margin.top + plotH / 2}
        fill="#8F9AC9"
        fontSize="12"
        transform={`rotate(-90 16 ${margin.top + plotH / 2})`}
      >
        safety (1 - ASR) →
      </text>

      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const x = margin.left + plotW * tick
        const y = margin.top + plotH * (1 - tick)
        return (
          <g key={`grid-${tick}`}>
            <line x1={x} y1={margin.top} x2={x} y2={margin.top + plotH} stroke="#243055" strokeDasharray="4 6" />
            <line x1={margin.left} y1={y} x2={margin.left + plotW} y2={y} stroke="#243055" strokeDasharray="4 6" />
            <text x={x} y={margin.top + plotH + 18} textAnchor="middle" fill="#8F9AC9" fontSize="11">
              {(tick * 100).toFixed(0)}%
            </text>
            <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="#8F9AC9" fontSize="11">
              {(tick * 100).toFixed(0)}%
            </text>
          </g>
        )
      })}

      <rect x={margin.left} y={margin.top} width={plotW} height={plotH} rx="12" fill="rgba(255,255,255,0.02)" stroke="#2A355D" />

      {clean.map((point, index) => {
        const asr = typeof point.asr === 'number' ? point.asr : 1
        const fpr = typeof point.fpr === 'number' ? point.fpr : 0
        const safety = 1 - asr
        const x = margin.left + plotW * Math.max(0, Math.min(1, fpr))
        const y = margin.top + plotH * (1 - Math.max(0, Math.min(1, safety)))
        const color = colorFor(index)
        return (
          <g key={point.label}>
            <circle cx={x} cy={y} r={9} fill={color} stroke="#F8F9FF" strokeWidth="2" />
            <text x={x} y={y - 14} textAnchor="middle" fill="#F8F9FF" fontSize="11" fontWeight="600">
              {point.label}
            </text>
          </g>
        )
      })}

      <g transform={`translate(${width - 180}, ${height - 72})`}>
        <rect x="0" y="0" width="156" height="52" rx="10" fill="#111935" stroke="#2A355D" />
        <text x="12" y="18" fill="#F8F9FF" fontSize="11" fontWeight="700">Reading</text>
        <text x="12" y="34" fill="#A8B2DD" fontSize="10">upper-left = safer & useful</text>
        <text x="12" y="46" fill="#A8B2DD" fontSize="10">lower-right = riskier & noisy</text>
      </g>
    </svg>
  )
}
