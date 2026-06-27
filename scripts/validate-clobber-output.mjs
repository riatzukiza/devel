import { existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);

const COMMAND_SCRIPTS = new Set([
  'node',
  'npm',
  'pnpm',
  'bun',
  'bunx',
  'npx',
  'yarn',
]);

const configPath = resolve(process.cwd(), '.clobber/index.cjs');

const loadConfig = () => {
  try {
    return require(configPath);
  } catch (error) {
    throw new Error(`Failed to load ${configPath}: ${error.message}`);
  }
};

const normalizeApps = (config) => {
  if (!config || typeof config !== 'object') {
    throw new Error('Clobber output must export an object');
  }
  const apps = Array.isArray(config.apps) ? config.apps : null;
  if (!apps) {
    throw new Error('Clobber output must export {apps: [...]}');
  }
  return apps;
};

const isPathLike = (value) =>
  typeof value === 'string' && (value.startsWith('.') || value.startsWith('/'));

const resolveScriptPath = (script, cwd, args) => {
  if (COMMAND_SCRIPTS.has(script)) {
    const firstArg = Array.isArray(args) ? args[0] : undefined;
    if (isPathLike(firstArg)) {
      return resolve(cwd ?? process.cwd(), firstArg);
    }
    return null;
  }
  if (isPathLike(script)) {
    return resolve(cwd ?? process.cwd(), script);
  }
  return null;
};

const resolveCwd = (cwd) => (cwd ? resolve(cwd) : null);

const cwdExists = (cwd) => {
  if (!cwd) return false;
  if (!existsSync(cwd)) return false;
  return statSync(cwd).isDirectory();
};

const validatePath = (path) => {
  if (!existsSync(path)) {
    return `Missing script path: ${path}`;
  }
  const stats = statSync(path);
  if (!stats.isFile()) {
    return `Script path is not a file: ${path}`;
  }
  return null;
};

const validateApps = (apps) => {
  const errors = [];
  const names = new Set();

  apps.forEach((app, index) => {
    if (!app || typeof app !== 'object') {
      errors.push(`App at index ${index} is not an object`);
      return;
    }

    const name = app.name;
    if (!name || typeof name !== 'string') {
      errors.push(`App at index ${index} is missing a valid name`);
    } else if (names.has(name)) {
      errors.push(`Duplicate app name: ${name}`);
    } else {
      names.add(name);
    }

    const script = app.script;
    if (!script || typeof script !== 'string') {
      errors.push(`App ${name ?? `#${index}`} is missing a valid script`);
      return;
    }

    const cwdPath = resolveCwd(app.cwd);
    const scriptPath = resolveScriptPath(script, cwdPath, app.args);
    if (scriptPath) {
      if (cwdPath && !cwdExists(cwdPath)) {
        console.warn(`Skipping ${name ?? `#${index}`}: cwd not found (${cwdPath})`);
        return;
      }
      const pathError = validatePath(scriptPath);
      if (pathError) {
        errors.push(`App ${name ?? `#${index}`}: ${pathError}`);
      }
    }
  });

  return errors;
};

const main = () => {
  const config = loadConfig();
  const apps = normalizeApps(config);
  const errors = validateApps(apps);

  if (errors.length > 0) {
    console.error('Clobber output validation failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Clobber output validation passed (${apps.length} apps).`);
};

main();
