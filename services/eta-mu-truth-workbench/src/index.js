import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = await createApp(config);

try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info({ port: config.port, host: config.host, vaultRoot: config.vaultRoot }, 'eta-mu listening');
} catch (error) {
  app.log.error(error, 'failed to start eta-mu');
  process.exitCode = 1;
}
