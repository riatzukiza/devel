import React, { useState } from 'react'

interface Props {
  onSearch: (q: string) => void
}

const SearchBar: React.FC<Props> = ({ onSearch }) => {
  const [q, setQ] = useState('')
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(q)
  }
  return (
    <form onSubmit={onSubmit} className="ui-search-bar" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search memories..." style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #333', background: '#0b0b0b', color: '#fff' }} />
      <button type="submit" style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#2b2b2b', color: '#fff' }}>Search</button>
    </form>
  )
}

export default SearchBar
