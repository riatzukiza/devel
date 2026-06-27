import React from 'react'

interface Props {
  page: number
  onPageChange: (page: number) => void
  totalPages: number
}

const Pagination: React.FC<Props> = ({ page, onPageChange, totalPages }) => {
  if (totalPages <= 1) return null

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      gap: 12,
      padding: 12,
      borderTop: '1px solid #30363d'
    }}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        style={{
          background: page <= 1 ? '#21262d' : '#238636',
          border: '1px solid #30363d',
          borderRadius: 6,
          padding: '6px 12px',
          color: page <= 1 ? '#8b949e' : '#fff',
          cursor: page <= 1 ? 'not-allowed' : 'pointer'
        }}
      >
        Previous
      </button>
      <span style={{ color: '#8b949e', fontSize: 14 }}>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        style={{
          background: page >= totalPages ? '#21262d' : '#238636',
          border: '1px solid #30363d',
          borderRadius: 6,
          padding: '6px 12px',
          color: page >= totalPages ? '#8b949e' : '#fff',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer'
        }}
      >
        Next
      </button>
    </div>
  )
}

export default Pagination
