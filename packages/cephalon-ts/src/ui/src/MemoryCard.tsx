import React from 'react'
import styles from './MemoryCard.module.css'
import type { Memory } from './api'

interface Props {
  memory: Memory
  selected?: boolean
  onClick?: () => void
  onPin?: () => void
  onUnpin?: () => void
}

const MemoryCard: React.FC<Props> = ({ memory, selected, onClick, onPin, onUnpin }) => {
  const text = memory.content?.text ?? ''
  const pinned = memory.retrieval?.pinned
  const timestamp = new Date(memory.timestamp).toLocaleString()

  return (
    <div 
      className={`${styles.card} ${selected ? styles.selected : ''}`} 
      onClick={onClick}
    >
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles[`badge${memory.role.charAt(0).toUpperCase() + memory.role.slice(1)}`]}`}>
          {memory.role}
        </span>
        <span className={`${styles.badge} ${styles[`badge${memory.kind.charAt(0).toUpperCase() + memory.kind.slice(1)}`]}`}>
          {memory.kind}
        </span>
        {pinned && <span className={`${styles.badge} ${styles.pinned}`}>📌</span>}
      </div>
      <div className={styles.content}>{text}</div>
      <div className={styles.meta}>
        <span>{timestamp}</span>
        <span className={styles.session}>{memory.sessionId.slice(0, 8)}</span>
      </div>
      {(onPin || onUnpin) && (
        <div className={styles.actions}>
          {pinned ? (
            <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onUnpin?.(); }}>
              Unpin
            </button>
          ) : (
            <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onPin?.(); }}>
              Pin
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default MemoryCard
