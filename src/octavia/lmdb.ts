import { createRequire } from 'node:module';
import path from 'node:path';

const requireFromHere = createRequire(__filename);

const resolveCacheModulePath = (): string =>
  path.resolve(
    __dirname,
    '..',
    '..',
    'orgs',
    'riatzukiza',
    'promethean',
    'packages',
    'lmdb-cache',
    'dist',
    'cache.js',
  );

interface NamespaceCache<TValue = unknown> {
  readonly withNamespace: (ns: string) => NamespaceCache<TValue>;
  readonly batch: (
    ops: ReadonlyArray<{ readonly type: 'put' | 'del'; readonly key: string; readonly value?: TValue }>,
  ) => Promise<void>;
  readonly close: () => Promise<void>;
}

interface LmdbModule {
  readonly openLmdbCache: (options: { readonly path?: string; readonly namespace?: string }) => NamespaceCache;
}

let cachedModule: LmdbModule | undefined;

const loadModule = (): LmdbModule => {
  if (cachedModule) {
    return cachedModule;
  }

  const resolvedPath = resolveCacheModulePath();
  try {
    cachedModule = requireFromHere(resolvedPath) as LmdbModule;
    return cachedModule;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to load Promethean LMDB cache from ${resolvedPath}. Run "pnpm --filter @promethean-os/lmdb-cache build" first. (${reason})`,
    );
  }
};

export const openOctaviaCache = (options: { readonly path?: string; readonly namespace?: string }): NamespaceCache => {
  const module = loadModule();
  return module.openLmdbCache(options);
};
