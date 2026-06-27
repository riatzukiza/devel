import path from 'node:path';
import { readFile } from 'node:fs/promises';

const ASSET_DEFS = {
  '/': { file: 'index.html', mime: 'text/html; charset=utf-8' },
  '/app.js': { file: 'app.js', mime: 'text/javascript; charset=utf-8' },
  '/workbench': { file: 'workbench.html', mime: 'text/html; charset=utf-8' },
  '/workbench.js': { file: 'workbench.js', mime: 'text/javascript; charset=utf-8' },
};

export const loadUiAssets = async (uiDir) => {
  const entries = await Promise.all(
    Object.entries(ASSET_DEFS).map(async ([routePath, def]) => {
      const content = await readFile(path.join(uiDir, def.file), 'utf8');
      return [routePath, { mime: def.mime, content }];
    })
  );

  return Object.fromEntries(entries);
};
