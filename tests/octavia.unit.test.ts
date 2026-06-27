import { describe, expect, test } from 'vitest';

import { resolveSelector } from '../src/octavia/selector';
import type { AliasSet, DiscoveredCommand } from '../src/octavia/types';

const makeCommand = (name: string, aliasSets: AliasSet[]): DiscoveredCommand => ({
  id: name,
  kind: 'binary',
  name,
  aliasSets,
  execution: { kind: 'binary', command: name },
});

describe('selector resolution', () => {
  const alias = (label: string): AliasSet => ({
    tokens: label.split('/'),
    label,
  });

  const commands = [
    makeCommand('foo', [alias('foo')]),
    makeCommand('foo-bar', [alias('foo/bar')]),
    makeCommand('baz', [alias('baz'), alias('unique')]),
  ];

  test('picks unique alias by name', () => {
    const resolution = resolveSelector(['baz'], commands);
    expect(resolution.ok).toBe(true);
    expect(resolution.ok && resolution.command.name).toBe('baz');
  });

  test('matches nested tokens', () => {
    const resolution = resolveSelector(['foo', 'bar'], commands);
    expect(resolution.ok).toBe(true);
    expect(resolution.ok && resolution.command.name).toBe('foo-bar');
  });

  test('rejects ambiguous selectors', () => {
    const resolution = resolveSelector(['foo'], commands);
    expect(resolution.ok).toBe(false);
    expect(resolution.type === 'ambiguous').toBe(true);
    if (resolution.type === 'ambiguous') {
      expect(resolution.candidates).toHaveLength(2);
    }
  });

  test('rejects missing selectors', () => {
    const resolution = resolveSelector(['missing'], commands);
    expect(resolution.ok).toBe(false);
    expect(resolution.type === 'not_found').toBe(true);
  });
});
