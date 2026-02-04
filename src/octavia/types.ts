import type { SpawnOptionsWithoutStdio } from 'node:child_process';

export type CommandKind = 'file' | 'package-script' | 'binary';

export type RuntimeKind =
  | 'node'
  | 'bun'
  | 'bash'
  | 'python3'
  | 'sh'
  | 'shebang'
  | 'package-script'
  | 'binary';

export type ExecutionRecipe =
  | Readonly<{
      kind: 'file';
      absolutePath: string;
      workingDirectory: string;
      runtime: RuntimeKind;
      shebang?: string;
    }>
  | Readonly<{
      kind: 'package-script';
      packageDirectory: string;
      scriptName: string;
    }>
  | Readonly<{
      kind: 'binary';
      command: string;
      args?: readonly string[];
      spawnOptions?: SpawnOptionsWithoutStdio;
    }>;

export interface AliasSet {
  readonly tokens: readonly string[];
  readonly label: string;
}

export interface DiscoveredCommand {
  readonly id: string;
  readonly kind: CommandKind;
  readonly name: string;
  readonly relativePath?: string;
  readonly description?: string;
  readonly commanderSubcommands?: readonly string[];
  readonly aliasSets: readonly AliasSet[];
  readonly execution: ExecutionRecipe;
}

export interface IndexRecord {
  readonly id: string;
  readonly kind: CommandKind;
  readonly name: string;
  readonly relativePath?: string;
  readonly execution: ExecutionRecipe;
  readonly aliasSets: readonly AliasSet[];
  readonly commanderSubcommands?: readonly string[];
}

export interface SelectorResolution {
  readonly command: DiscoveredCommand;
  readonly reason: string;
}
