import { spawn } from 'node:child_process';
import path from 'node:path';

import { ExecutionRecipe, SelectorResolution } from './types';

const runSpawn = (
  command: string,
  args: ReadonlyArray<string>,
  options: Readonly<Parameters<typeof spawn>[2]> = {},
): Promise<number> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('close', (code) => {
      resolve(code ?? 0);
    });
    child.on('error', (error) => {
      reject(error);
    });
  });

const runFile = async (recipe: Extract<ExecutionRecipe, { kind: 'file' }>, forwarded: string[]): Promise<number> => {
  if (recipe.shebang) {
    const shebangCommand = recipe.shebang.replace(/^#!\s*/, '').trim();
    const [binary, ...rest] = shebangCommand.split(/\s+/);
    const args = [...rest, recipe.absolutePath, ...forwarded];
    return runSpawn(binary, args, { cwd: recipe.workingDirectory });
  }

  switch (recipe.runtime) {
    case 'node':
      return runSpawn('node', [recipe.absolutePath, ...forwarded], {
        cwd: recipe.workingDirectory,
      });
    case 'bun':
      return runSpawn('bun', [recipe.absolutePath, ...forwarded], {
        cwd: recipe.workingDirectory,
      });
    case 'bash':
      return runSpawn('bash', [recipe.absolutePath, ...forwarded], {
        cwd: recipe.workingDirectory,
      });
    case 'python3':
      return runSpawn('python3', [recipe.absolutePath, ...forwarded], {
        cwd: recipe.workingDirectory,
      });
    case 'sh':
      return runSpawn('sh', [recipe.absolutePath, ...forwarded], {
        cwd: recipe.workingDirectory,
      });
    default:
      return runSpawn(recipe.runtime, [recipe.absolutePath, ...forwarded], {
        cwd: recipe.workingDirectory,
      });
  }
};

const runPackageScript = async (
  recipe: Extract<ExecutionRecipe, { kind: 'package-script' }>,
  forwarded: string[],
): Promise<number> => {
  const scriptArgs = forwarded.length > 0 ? ['--', ...forwarded] : [];
  const args = ['--dir', recipe.packageDirectory, 'run', recipe.scriptName, ...scriptArgs];
  return runSpawn('pnpm', args, { cwd: recipe.packageDirectory });
};

const runBinary = async (
  recipe: Extract<ExecutionRecipe, { kind: 'binary' }>,
  forwarded: string[],
): Promise<number> => {
  const args = [...(recipe.args ?? []), ...forwarded];
  return runSpawn(recipe.command, args, recipe.spawnOptions);
};

export const executeResolution = async (
  resolution: SelectorResolution,
  forwarded: string[],
): Promise<number> => {
  const recipe = resolution.command.execution;
  switch (recipe.kind) {
    case 'file':
      return runFile(recipe, forwarded);
    case 'package-script':
      return runPackageScript(recipe, forwarded);
    case 'binary':
      return runBinary(recipe, forwarded);
    default:
      throw new Error(`Unsupported execution recipe: ${JSON.stringify(recipe)}`);
  }
};
