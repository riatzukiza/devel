import React from 'react'

interface Props {
  total: number
  pinned: number
  sessions: number
}

const Header: React.FC<Props> = ({ total, pinned, sessions }) => {
  return (
    <header className="ui-header" style={{ padding: 16, borderBottom: '1px solid #1f1f1f', background: '#0e1117' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <strong style={{ fontSize: 18 }}>Cephalon Memory</strong>
        <span className="badge">Total: {total}</span>
        <span className="badge">Pinned: {pinned}</span>
        <span className="badge">Sessions: {sessions}</span>
      </div>
    </header>
  )
}

export default Header
