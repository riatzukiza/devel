import React from 'react'

type View = 'cards' | 'table'

interface Props {
  view: View
  onChange: (v: View) => void
}

const ViewToggle: React.FC<Props> = ({ view, onChange }) => {
  return (
    <div className="ui-view-toggle" style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => onChange('cards')} style={{ padding: '6px 10px', borderRadius: 6, border: view === 'cards' ? '2px solid #4a4a4a' : '1px solid #333', background: '#0b0b0b', color: '#fff' }}>Cards</button>
      <button onClick={() => onChange('table')} style={{ padding: '6px 10px', borderRadius: 6, border: view === 'table' ? '2px solid #4a4a4a' : '1px solid #333', background: '#0b0b0b', color: '#fff' }}>Table</button>
    </div>
  )
}

export default ViewToggle
