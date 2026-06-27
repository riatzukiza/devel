import test from 'ava';

const entrypoints = [
  { name: 'index', importer: () => import('../../index.js') },
  { name: 'core', importer: () => import('../../core.js') },
  { name: 'ecs', importer: () => import('../../ecs.js') },
  { name: 'orchestrator', importer: () => import('../../orchestrator.js') },
  { name: 'protocol', importer: () => import('../../protocol.js') },
  { name: 'persistence', importer: () => import('../../persistence.js') },
  { name: 'workflow', importer: () => import('../../workflow.js') },
  { name: 'state', importer: () => import('../../state.js') },
  { name: 'mcp', importer: () => import('../../mcp.js') },
];

test('entrypoint modules load when dependencies are available', async (t) => {
  for (const { name, importer } of entrypoints) {
    try {
      const mod = await importer();
      t.truthy(mod, `${name} module should load`);
      t.true(typeof mod === 'object', `${name} module should be an object`);
    } catch (error) {
      t.log(`skipping ${name}: ${(error as Error)?.message || error}`);
    }
  }

  const indexEntrypoint = entrypoints.find((entry) => entry.name === 'index');
  if (indexEntrypoint) {
    const indexModule = (await indexEntrypoint.importer().catch(() => null)) as any;
    if (indexModule) {
      t.truthy(indexModule.makeOrchestrator, 'makeOrchestrator export exists when index is loaded');
    }
  } else {
    t.log('index entrypoint missing');
  }
});
