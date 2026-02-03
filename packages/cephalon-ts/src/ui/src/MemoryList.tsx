import React from 'react'
import styles from './MemoryList.module.css'
import MemoryCard from './MemoryCard'
import type { Memory } from './api'

interface Props {
  memories: Memory[]
  selectedId: string | null
  onSelect: (m: Memory) => void
  onPin?: (id: string) => void
  onUnpin?: (id: string) => void
}

const MemoryList: React.FC<Props> = ({ memories, selectedId, onSelect, onPin, onUnpin }) => {
  if (!memories || memories.length === 0) {
    return <div className={styles.empty}>No memories to display.</div>
  }
  return (
    <div className={styles.grid}>
      {memories.map((m) => (
        <MemoryCard
          key={m.id}
          memory={m}
          selected={m.id === selectedId}
          onClick={() => onSelect(m)}
          onPin={() => onPin?.(m.id)}
          onUnpin={() => onUnpin?.(m.id)}
        />
      ))}
    </div>
  )
}

export default MemoryList
