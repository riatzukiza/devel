import React from 'react'
import styles from './ContextPanel.module.css'
import type { Memory } from './api'

interface Props {
  pinned: Memory[]
  recent: Memory[]
  onSelect: (m: Memory) => void
}

const ContextPanel: React.FC<Props> = ({ pinned, recent, onSelect }) => {
  const formatMemoryPreview = (m: Memory) => {
    const text = m.content?.text ?? ''
    return text.length > 60 ? text.slice(0, 60) + '...' : text
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Pinned Memories</div>
        {pinned.length === 0 ? (
          <div className={styles.empty}>No pinned memories</div>
        ) : (
          <div className={styles.list}>
            {pinned.map(m => (
              <div 
                key={m.id} 
                className={styles.item}
                onClick={() => onSelect(m)}
              >
                <div className={styles.itemContent}>{formatMemoryPreview(m)}</div>
                <div className={styles.itemMeta}>
                  {m.kind} • {formatTime(m.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Recent Memories</div>
        {recent.length === 0 ? (
          <div className={styles.empty}>No recent memories</div>
        ) : (
          <div className={styles.list}>
            {recent.slice(0, 10).map(m => (
              <div 
                key={m.id} 
                className={styles.item}
                onClick={() => onSelect(m)}
              >
                <div className={styles.itemContent}>{formatMemoryPreview(m)}</div>
                <div className={styles.itemMeta}>
                  {m.kind} • {formatTime(m.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ContextPanel
