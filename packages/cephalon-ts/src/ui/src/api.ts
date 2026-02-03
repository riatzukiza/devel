// Lightweight API wrappers for Cephalon Memory UI

export interface Memory {
  id: string
  timestamp: number
  sessionId: string
  role: string
  kind: string
  content: { text: string }
  retrieval: { pinned: boolean }
  source: { type: string; channelId?: string }
  cephalonId: string
}

export interface TableRow {
  id: string
  timestamp: string
  sessionId: string
  role: string
  kind: string
  content: string
  pinned: string
  source: string
  cephalonId: string
  dynamicColumns?: Record<string, string>
  dynamicColumnKeys?: string[]
}

export interface MemoryListResponse {
  memories: Memory[]
  total: number
  offset: number
  limit: number
}

export interface TableResponse {
  columns: string[]
  rows: TableRow[]
  total: number
  offset: number
  limit: number
}

export interface ContextResponse {
  recent: Memory[]
  pinned: Memory[]
  sessionCount: number
  totalCount: number
}

export interface SearchResponse {
  results: Array<{
    id: string
    metadata: Record<string, unknown>
    content: string
  }>
}

const API_BASE = '/api/memories'

// Count endpoint
export const getCount = async (): Promise<number> => {
  try {
    const res = await fetch(`${API_BASE}/count`)
    if (!res.ok) return 0
    const data = await res.json() as { count?: number }
    return data?.count ?? 0
  } catch {
    return 0
  }
}

// Context endpoint (pinned + recent)
export const getContext = async (): Promise<ContextResponse> => {
  try {
    const res = await fetch(`${API_BASE}/context`)
    if (!res.ok) return { recent: [], pinned: [], sessionCount: 0, totalCount: 0 }
    return await res.json() as ContextResponse
  } catch {
    return { recent: [], pinned: [], sessionCount: 0, totalCount: 0 }
  }
}

// List memories with pagination
export const getMemories = async (page: number = 1, limit: number = 20): Promise<MemoryListResponse> => {
  try {
    const offset = (page - 1) * limit
    const res = await fetch(`${API_BASE}/list?limit=${limit}&offset=${offset}`)
    if (!res.ok) return { memories: [], total: 0, offset: 0, limit }
    return await res.json() as MemoryListResponse
  } catch {
    return { memories: [], total: 0, offset: 0, limit }
  }
}

// Table data for table view
export const getTableData = async (page: number = 1, limit: number = 20): Promise<TableResponse> => {
  try {
    const offset = (page - 1) * limit
    const res = await fetch(`${API_BASE}/table?limit=${limit}&offset=${offset}`)
    if (!res.ok) return { columns: [], rows: [], total: 0, offset: 0, limit }
    return await res.json() as TableResponse
  } catch {
    return { columns: [], rows: [], total: 0, offset: 0, limit }
  }
}

// Single memory by ID
export const getMemory = async (id: string): Promise<Memory | null> => {
  try {
    const res = await fetch(`${API_BASE}/${id}`)
    if (!res.ok) return null
    const data = await res.json() as { memory?: Memory }
    return data?.memory ?? null
  } catch {
    return null
  }
}

// Semantic search
export const searchMemories = async (query: string, limit: number = 20): Promise<Memory[]> => {
  try {
    const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}&limit=${limit}`)
    if (!res.ok) return []
    const data = await res.json() as SearchResponse
    return data.results.map(r => ({
      id: r.id,
      timestamp: Date.now(),
      sessionId: 'search',
      role: 'user',
      kind: 'message',
      content: { text: r.content },
      retrieval: { pinned: false },
      source: { type: 'search' },
      cephalonId: 'search'
    }))
  } catch {
    return []
  }
}

// Pin a memory
export const pinMemory = async (id: string, priority: number = 10): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/${id}/pin`, {
      method: 'POST',
      body: JSON.stringify({ priority })
    })
    return res.ok
  } catch {
    return false
  }
}

// Unpin a memory
export const unpinMemory = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/${id}/unpin`, { method: 'POST' })
    return res.ok
  } catch {
    return false
  }
}
