// Lightweight Fastify server to serve API endpoints and React UI build
import Fastify from 'fastify'
import path from 'path'
import fastifyStatic from 'fastify-static'
import fastifyCors from 'fastify-cors'

const app = Fastify({ logger: true })

// Enable CORS for development
app.register(fastifyCors, { origin: true })

// API stubs (to be replaced with real logic later)
app.get('/api/memories/count', async () => ({ count: 0 }))
app.get('/api/memories/context', async () => ({ pinned: [], recent: [] }))
app.get('/api/memories/list', async () => ({ memories: [] }))
app.get('/api/memories/table', async () => ({ rows: [] }))
app.get('/api/memories/:id', async (req: any) => ({ id: req.params.id }))
app.get('/api/memories/search', async () => ({ memories: [] }))
app.post('/api/memories/:id/pin', async () => ({ ok: true }))
app.post('/api/memories/:id/unpin', async () => ({ ok: true }))

// UI build serving (static)
const uiDist = path.join(__dirname, 'ui', 'dist')
try {
  app.register(fastifyStatic, {
    root: uiDist,
    prefix: '/ui/',
  })
} catch (e) {
  // If UI not built yet, ignore
}

app.get('/', async (req, reply) => {
  reply.redirect('/ui/index.html')
})

const start = async () => {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
  try {
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`server listening on http://0.0.0.0:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

if (require.main === module) {
  start()
}

export default app
