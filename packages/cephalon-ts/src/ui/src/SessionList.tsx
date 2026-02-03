import React, { useEffect, useState } from 'react'
import { getSessionStats, type SessionStats } from './api'
import styles from './SessionList.module.css'

interface SessionListProps {
  onSelectSession: (sessionId: string | null) => void
  selectedSessionId: string | null
}

const SessionList: React.FC<SessionListProps> = ({ onSelectSession, selectedSessionId }) => {
  const [sessions, setSessions] = useState<SessionStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true)
      try {
        const stats = await getSessionStats()
        setSessions(stats)
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
    const interval = setInterval(fetchSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  const getPriorityBadge = (priorityClass: string) => {
    switch (priorityClass) {
      case 'interactive':
        return <span className={`${styles.badge} ${styles.interactive}`}>Interactive</span>
      case 'operational':
        return <span className={`${styles.badge} ${styles.operational}`}>Operational</span>
      case 'maintenance':
        return <span className={`${styles.badge} ${styles.maintenance}`}>Maintenance</span>
      default:
        return <span className={`${styles.badge} ${styles.default}`}>{priorityClass}</span>
    }
  }

  const formatLastActivity = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (loading && sessions.length === 0) {
    return <div className={styles.loading}>Loading sessions...</div>
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Active Sessions ({sessions.length})</h3>
      <button
        className={`${styles.sessionItem} ${selectedSessionId === null ? styles.selected : ''}`}
        onClick={() => onSelectSession(null)}
      >
        <span className={styles.sessionName}>All Sessions</span>
        <span className={styles.sessionMeta}>{sessions.reduce((acc, s) => acc + s.memoryCount, 0)} memories</span>
      </button>
      {sessions.map((session) => (
        <button
          key={session.id}
          className={`${styles.sessionItem} ${selectedSessionId === session.id ? styles.selected : ''}`}
          onClick={() => onSelectSession(session.id)}
        >
          <div className={styles.sessionHeader}>
            <span className={styles.sessionName}>{session.id}</span>
            {getPriorityBadge(session.priorityClass)}
          </div>
          <div className={styles.sessionMeta}>
            {session.memoryCount} memories • {formatLastActivity(session.lastActivity)}
          </div>
          <div className={styles.sessionPersona}>
            {session.persona && session.persona.length > 40
              ? session.persona.substring(0, 40) + '...'
              : session.persona || 'No persona'}
          </div>
          <div className={styles.sessionCredits}>
            Credits: {session.credits}
          </div>
        </button>
      ))}
    </div>
  )
}

export default SessionList
