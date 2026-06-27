import React from 'react'
import styles from './MemoryDetail.module.css'
import type { Memory } from './api'

interface Props {
  memory: Memory | null
  onPin?: () => void
  onUnpin?: () => void
}

const MemoryDetail: React.FC<Props> = ({ memory, onPin, onUnpin }) => {
  if (!memory) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📄</div>
        <div>Select a memory to view details</div>
      </div>
    )
  }

  const text = memory.content?.text ?? ''
  const timestamp = new Date(memory.timestamp).toLocaleString()

  return (
    <div className={styles.detail}>
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles[`badge${memory.role.charAt(0).toUpperCase() + memory.role.slice(1)}`]}`}>
          {memory.role}
        </span>
        <span className={`${styles.badge} ${styles[`badge${memory.kind.charAt(0).toUpperCase() + memory.kind.slice(1)}`]}`}>
          {memory.kind}
        </span>
      </div>

      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.label}>ID</span>
          <span className={styles.value}>{memory.id}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.label}>Session</span>
          <span className={styles.value}>{memory.sessionId}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.label}>Timestamp</span>
          <span className={styles.value}>{timestamp}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.label}>Pinned</span>
          <span className={styles.value}>{memory.retrieval?.pinned ? 'Yes' : 'No'}</span>
        </div>
        {memory.source?.channelId && (
          <div className={styles.metaRow}>
            <span className={styles.label}>Channel</span>
            <span className={styles.value}>{memory.source.channelId}</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {text}
      </div>

      <div className={styles.actions}>
        {memory.retrieval?.pinned ? (
          <button className={styles.actionBtn} onClick={onUnpin}>
            Unpin
          </button>
        ) : (
          <button className={styles.actionBtn} onClick={onPin}>
            Pin
          </button>
        )}
      </div>
    </div>
  )
}

export default MemoryDetail
