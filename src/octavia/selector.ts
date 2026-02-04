import { AliasSet, DiscoveredCommand } from './types';

export interface ResolutionSuccess {
  readonly ok: true;
  readonly command: DiscoveredCommand;
  readonly alias: AliasSet;
}

export interface ResolutionAmbiguous {
  readonly ok: false;
  readonly type: 'ambiguous';
  readonly candidates: ReadonlyArray<{ command: DiscoveredCommand; alias: AliasSet }>;
}

export interface ResolutionNotFound {
  readonly ok: false;
  readonly type: 'not_found';
  readonly message: string;
}

export type ResolutionResult = ResolutionSuccess | ResolutionAmbiguous | ResolutionNotFound;

const normalizeToken = (token: string): string => token.replace(/\s+/g, ' ').trim().toLowerCase();

const tokensMatch = (aliasTokens: readonly string[], queryTokens: readonly string[]): boolean => {
  if (queryTokens.length === 0) {
    return false;
  }

  const normalizedAlias = aliasTokens.map(normalizeToken);
  const normalizedQuery = queryTokens.map(normalizeToken);

  if (normalizedQuery.length === 1 && normalizedAlias.length === 1) {
    return normalizedAlias[0] === normalizedQuery[0];
  }

  if (normalizedQuery.length > normalizedAlias.length) {
    return false;
  }

  for (let start = 0; start <= normalizedAlias.length - normalizedQuery.length; start += 1) {
    let matches = true;
    for (let offset = 0; offset < normalizedQuery.length; offset += 1) {
      if (normalizedAlias[start + offset] !== normalizedQuery[offset]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return true;
    }
  }

  return false;
};

const flattenSelectorTokens = (tokens: readonly string[]): string[] =>
  tokens
    .flatMap((token) => token.split(/[/:]/g))
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

export const resolveSelector = (
  selectorTokens: readonly string[],
  commands: readonly DiscoveredCommand[],
): ResolutionResult => {
  const normalizedTokens = flattenSelectorTokens(selectorTokens);
  if (normalizedTokens.length === 0) {
    return { ok: false, type: 'not_found', message: 'No selector provided' };
  }

  const matches: Array<{ command: DiscoveredCommand; alias: AliasSet }> = [];

  for (const command of commands) {
    for (const aliasSet of command.aliasSets) {
      if (tokensMatch(aliasSet.tokens, normalizedTokens)) {
        matches.push({ command, alias: aliasSet });
        break;
      }
    }
  }

  if (matches.length === 0) {
    return {
      ok: false,
      type: 'not_found',
      message: `No command matches selector "${normalizedTokens.join(' ')}"`,
    };
  }

  if (matches.length > 1) {
    return { ok: false, type: 'ambiguous', candidates: matches };
  }

  const [match] = matches;
  return { ok: true, command: match.command, alias: match.alias };
};
