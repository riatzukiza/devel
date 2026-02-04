import React from 'react'
import styles from './MemoryTable.module.css'
import type { TableRow } from './api'

interface Props {
  data: { columns: string[]; rows: TableRow[] }
  selectedId: string | null
  onSelect: (id: string) => void
}

const MemoryTable: React.FC<Props> = ({ data, selectedId, onSelect }) => {
  const { columns, rows } = data

  if (!rows || rows.length === 0) {
    return <div className={styles.empty}>No memories to display.</div>
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col} className={styles.th}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr 
              key={row.id} 
              className={row.id === selectedId ? styles.selected : ''}
              onClick={() => onSelect(row.id)}
            >
              {columns.map(col => (
                <td key={col} className={styles.td}>
                  <div className={styles.cellContent}>
                    {row[col] || ''}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MemoryTable
