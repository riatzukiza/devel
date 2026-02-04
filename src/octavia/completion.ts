import { DiscoveredCommand } from './types';

const uniqueAliasStrings = (commands: readonly DiscoveredCommand[]): string[] => {
  const aliases = new Set<string>();
  for (const command of commands) {
    for (const alias of command.aliasSets) {
      if (alias.tokens.length === 0) continue;
      aliases.add(alias.tokens.join('/'));
    }
    for (const sub of command.commanderSubcommands ?? []) {
      aliases.add(`${command.name}:${sub}`);
    }
  }
  return Array.from(aliases).sort();
};

export const buildBashCompletionScript = (commands: readonly DiscoveredCommand[]): string => {
  const aliasList = uniqueAliasStrings(commands);
  const aliasWords = aliasList.join(' ');
  const staticCommands = ['list', 'refresh', 'completion', 'which'];
  const staticWords = staticCommands.join(' ');

  return `#!/usr/bin/env bash
_octavia_complete() {
  local cur prev
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  local subcommands="${staticWords}"
  local aliases="${aliasWords}"

  if [[ \${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "${staticWords} ${aliasWords}" -- "$cur") )
    return
  fi

  if [[ \${COMP_WORDS[1]} == "list" || \${COMP_WORDS[1]} == "refresh" || \${COMP_WORDS[1]} == "completion" || \${COMP_WORDS[1]} == "which" ]]; then
    COMPREPLY=()
    return
  fi

  COMPREPLY=( $(compgen -W "$aliases" -- "$cur") )
}
complete -F _octavia_complete octavia
`;
};

