#!/usr/bin/env node
import process from 'node:process';

import { Command } from 'commander';

import packageJson from '../../package.json';
import { buildBashCompletionScript } from './completion';
import { discoverAndPersist, ensureIndex } from './indexer';
import { executeResolution } from './runner';
import { resolveSelector, type ResolutionResult } from './selector';
import { DiscoveredCommand, SelectorResolution } from './types';

const program = new Command();
const version = typeof packageJson.version === 'string' ? packageJson.version : '0.0.0';

const rawArgv = process.argv.slice(2);
const dashIndex = rawArgv.indexOf('--');
const forwardedArgs = dashIndex >= 0 ? rawArgv.slice(dashIndex + 1) : [];
const cliArgv = dashIndex >= 0 ? rawArgv.slice(0, dashIndex) : rawArgv;

const resolveWithFlexiblePrefix = (
  tokens: readonly string[],
  commands: readonly DiscoveredCommand[],
): { readonly resolution: ResolutionResult; readonly consumed: number } => {
  if (tokens.length === 0) {
    return {
      resolution: { ok: false, type: 'not_found', message: 'No selector provided' },
      consumed: 0,
    };
  }

  let lastError: ResolutionResult | undefined;

  for (let end = 1; end <= tokens.length; end += 1) {
    const candidateTokens = tokens.slice(0, end);
    const resolution = resolveSelector(candidateTokens, commands);
    if (resolution.ok) {
      return { resolution, consumed: end };
    }
    lastError = resolution;
  }

  return {
    resolution: lastError ?? { ok: false, type: 'not_found', message: 'No selector provided' },
    consumed: tokens.length,
  };
};

program
  .name('octavia')
  .description('Command surface area indexer + runner for Promethean/OpenCode workspaces')
  .version(version)
  .allowUnknownOption(true);

program
  .command('refresh')
  .description('Rebuild the Octavia index/cache from scratch')
  .action(async () => {
    const commands = await discoverAndPersist({ force: true });
    // eslint-disable-next-line no-console
    console.log(`Indexed ${commands.length} commands`);
  });

program
  .command('list')
  .description('List discovered commands and aliases')
  .option('--json', 'emit JSON output')
  .action(async (options: { readonly json?: boolean }) => {
    const commands = await ensureIndex();
    if (options.json) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(commands, null, 2));
      return;
    }
    // eslint-disable-next-line no-console
    console.log(`Discovered ${commands.length} commands:\n`);
    for (const command of commands) {
      const aliasPreviews = command.aliasSets
        .map((alias) => alias.label)
        .slice(0, 3)
        .join(', ');
      // eslint-disable-next-line no-console
      console.log(`- ${command.name} (${command.kind}) → ${aliasPreviews}`);
    }
  });

program
  .command('which')
  .description('Resolve a selector without executing it')
  .argument('<selector...>', 'Selector tokens/path segments')
  .action(async (selector: string[]) => {
    const commands = await ensureIndex();
    const { resolution } = resolveWithFlexiblePrefix(selector, commands);
    if (!resolution.ok) {
      if (resolution.type === 'ambiguous') {
        // eslint-disable-next-line no-console
        console.error('Selector is ambiguous. Candidates:');
        for (const candidate of resolution.candidates) {
          // eslint-disable-next-line no-console
          console.error(`- ${candidate.command.name} (${candidate.alias.label})`);
        }
        process.exitCode = 1;
        return;
      }
      // eslint-disable-next-line no-console
      console.error(resolution.message);
      process.exitCode = 1;
      return;
    }
    // eslint-disable-next-line no-console
    console.log(`${resolution.command.name} → ${resolution.alias.label}`);
  });

program
  .command('completion')
  .description('Emit bash completion script for octavia')
  .action(async () => {
    const commands = await ensureIndex();
    const script = buildBashCompletionScript(commands);
    // eslint-disable-next-line no-console
    console.log(script);
  });

program
  .arguments('[selector...]')
  .description('Run a discovered command via alias/path selector')
  .action(async (selector: string[]) => {
    if (selector.length === 0) {
      program.help();
      return;
    }
    const commands = await ensureIndex();
    const { resolution: resolutionResult, consumed } = resolveWithFlexiblePrefix(selector, commands);
    if (!resolutionResult.ok) {
      if (resolutionResult.type === 'ambiguous') {
        // eslint-disable-next-line no-console
        console.error('Selector is ambiguous. Candidates:');
        for (const candidate of resolutionResult.candidates) {
          // eslint-disable-next-line no-console
          console.error(`- ${candidate.command.name} (${candidate.alias.label})`);
        }
        process.exitCode = 1;
        return;
      }
      // eslint-disable-next-line no-console
      console.error(resolutionResult.message);
      process.exitCode = 1;
      return;
    }

    const resolution: SelectorResolution = {
      command: resolutionResult.command,
      reason: resolutionResult.alias.label,
    };

    const forwarded = [...selector.slice(consumed), ...forwardedArgs];
    const exitCode = await executeResolution(resolution, forwarded);
    process.exitCode = exitCode;
  });

void program.parseAsync(['node', 'octavia', ...cliArgv]);
