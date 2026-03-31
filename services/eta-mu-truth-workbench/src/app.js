import Fastify from 'fastify';

import { loadUiAssets } from './assets.js';
import { createControlPlaneService } from './control-plane.js';
import { createTruthService } from './truth-service.js';

export const createApp = async (config) => {
  const app = Fastify({
    logger: true,
  });

  const assets = await loadUiAssets(config.uiDir);
  const truth = createTruthService(config);
  const controlPlane = createControlPlaneService({
    githubToken: config.githubToken,
    receiptsPath: config.controlPlaneReceiptsPath,
    automationEnabled: config.automationEnabled,
    automationIntervalMs: config.automationIntervalMs,
    automationVaults: config.automationVaults,
    logger: app.log,
  });
  let stopAutomation = null;

  app.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', request.headers.origin ?? '*');
    reply.header('Vary', 'Origin');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Accept, X-GitHub-Event, X-GitLab-Event');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  });

  app.options('/*', async (_request, reply) => {
    reply.code(204).send();
  });

  const sendAsset = async (reply, routePath) => {
    const asset = assets[routePath];
    if (!asset) {
      reply.code(404).send({ error: 'not_found' });
      return;
    }

    reply.type(asset.mime).send(asset.content);
  };

  app.get('/', async (_request, reply) => sendAsset(reply, '/'));
  app.get('/workbench', async (_request, reply) => sendAsset(reply, '/workbench'));
  app.get('/app.js', async (_request, reply) => sendAsset(reply, '/app.js'));
  app.get('/workbench.js', async (_request, reply) => sendAsset(reply, '/workbench.js'));

  app.get('/health', async () => ({ ok: true, service: 'eta-mu' }));

  app.get('/auth/callback', async (request) => {
    const { code = '', state = '' } = request.query ?? {};
    app.log.info({ code: Boolean(code), state: String(state || '') }, 'auth callback received');
    return {
      ok: true,
      message: 'auth/callback received',
      code: code ? 'received' : 'missing',
      state: state || 'missing',
    };
  });

  app.post('/webhook', async (request) => {
    const event = request.headers['x-github-event'] ?? request.headers['x-gitlab-event'] ?? 'unknown';
    app.log.info({ event, hasBody: Boolean(request.body) }, 'webhook received');
    return {
      ok: true,
      message: 'webhook received',
      event,
    };
  });

  app.get('/api/info', async () => truth.getInfo());
  app.get('/api/site/overview', async () => truth.getSiteOverview());
  app.get('/api/truth/view', async () => truth.getTruthView());
  app.post('/api/rebuild', async () => truth.rebuild());
  app.get('/api/search', async (request) => truth.search(request.query?.q, request.query?.limit));

  app.post('/api/truth/resolve-wikilink', async (request, reply) => {
    try {
      return await truth.resolveWikilink({
        targetKey: request.body?.target_key,
        dstEntityId: request.body?.dst_entity_id,
      });
    } catch (error) {
      const statusCode = error?.statusCode ?? 500;
      reply.code(statusCode).send({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/control-plane/vaults', async () => ({
    vaults: await controlPlane.listVaultStates(),
  }));

  app.get('/api/control-plane/receipts', async (request) => ({
    receipts: await controlPlane.listReceipts(request.query?.limit),
  }));

  app.get('/api/control-plane/:vaultId', async (request, reply) => {
    const state = await controlPlane.getVaultState(request.params?.vaultId);
    if (!state) {
      reply.code(404).send({ error: 'not_found' });
      return;
    }
    reply.send(state);
  });

  app.setNotFoundHandler(async (_request, reply) => {
    reply.code(404).send({ error: 'not_found' });
  });

  app.addHook('onReady', async () => {
    stopAutomation = controlPlane.startAutomationLoop();
  });

  app.addHook('onClose', async () => {
    stopAutomation?.();
  });

  return app;
};
