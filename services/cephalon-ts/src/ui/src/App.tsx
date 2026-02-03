import React, { useEffect, useState, useCallback } from 'react'
import styles from './styles.module.css'
import Header from './Header'
import MemoryList from './MemoryList'
import MemoryTable from './MemoryTable'
import MemoryDetail from './MemoryDetail'
import ContextPanel from './ContextPanel'
import SearchBar from './SearchBar'
import ViewToggle from './ViewToggle'
import Pagination from './Pagination'
import { 
  getCount, 
  getContext, 
  getMemories, 
  getTableData,
  searchMemories,
  pinMemory,
  unpinMemory,
  getMemory,
  type Memory,
  type TableRow,
  type ContextResponse 
} from './api'

const ITEMS_PER_PAGE = 20

const App: React.FC = () => {
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [count, setCount] = useState<number>(0)
  const [context, setContext] = useState<ContextResponse>({ 
    pinned: [], 
    recent: [], 
    sessionCount: 0, 
    totalCount: 0 
  })
  const [memories, setMemories] = useState<Memory[]>([])
  const [tableData, setTableData] = useState<{ columns: string[]; rows: TableRow[] }>({ columns: [], rows: [] })
  const [selected, setSelected] = useState<Memory | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      const [c, ctx] = await Promise.all([getCount(), getContext()])
      setCount(c)
      setContext(ctx)
      
      if (view === 'cards') {
        const list = await getMemories(page, ITEMS_PER_PAGE)
        setMemories(list.memories)
      } else {
        const table = await getTableData(page, ITEMS_PER_PAGE)
        setTableData({ columns: table.columns, rows: table.rows })
      }
    } finally {
      setLoading(false)
    }
  }, [page, view])

  const refreshContext = useCallback(async () => {
    const ctx = await getContext()
    setContext(ctx)
  }, [])

  // Initial load and interval refresh
  useEffect(() => {
    refreshAll()
    const interval = setInterval(refreshContext, 5000)
    return () => clearInterval(interval)
  }, [refreshAll, refreshContext])

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      refreshAll()
      return
    }
    
    setLoading(true)
    try {
      const results = await searchMemories(query)
      setMemories(results)
      setCount(results.length)
    } finally {
      setLoading(false)
    }
  }

  const handlePin = async (id: string) => {
    await pinMemory(id)
    refreshAll()
    if (selected?.id === id) {
      const updated = await getMemory(id)
      setSelected(updated)
    }
  }

  const handleUnpin = async (id: string) => {
    await unpinMemory(id)
    refreshAll()
    if (selected?.id === id) {
      const updated = await getMemory(id)
      setSelected(updated)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <div className={styles.root}>
      <Header 
        total={context.totalCount} 
        pinned={context.pinned.length} 
        sessions={context.sessionCount} 
      />
      <div className={styles.toolbar}>
        <SearchBar onSearch={handleSearch} />
        <ViewToggle view={view} onChange={setView} />
      </div>
      <div className={styles.content}>
        <main className={styles.mainPanel}>
          {loading ? (
            <div className={styles.loading}>Loading memories...</div>
          ) : view === 'cards' ? (
            <MemoryList 
              memories={memories} 
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              onPin={handlePin}
              onUnpin={handleUnpin}
            />
          ) : (
            <MemoryTable 
              data={tableData}
              selectedId={selected?.id ?? null}
              onSelect={async (id) => {
                const memory = await getMemory(id)
                setSelected(memory)
              }}
            />
          )}
          <Pagination 
            page={page} 
            onPageChange={handlePageChange}
            totalPages={Math.max(1, Math.ceil(count / ITEMS_PER_PAGE))}
          />
        </main>
        <aside className={styles.sidePanel}>
          <MemoryDetail 
            memory={selected} 
            onPin={selected ? () => handlePin(selected.id) : undefined}
            onUnpin={selected ? () => handleUnpin(selected.id) : undefined}
          />
          <ContextPanel 
            pinned={context.pinned}
            recent={context.recent}
            onSelect={setSelected}
          />
        </aside>
      </div>
    </div>
  )
}

export default App
