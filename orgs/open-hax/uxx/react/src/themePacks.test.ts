import { describe, expect, it } from 'vitest';
import {
  createEtaMuThemeJson,
  createThemePack,
  etaMuThemes,
  getThemeCssVars,
  themePacks,
  tokens,
} from '@open-hax/uxx/tokens';

describe('theme packs', () => {
  it('exports the proxy console preset', () => {
    expect(themePacks['proxy-console'].colors.background.default).toBe('#0A0C0F');
    expect(themePacks['proxy-console'].colors.accent.cyan).toBe('#00D4FF');
    expect(themePacks['proxy-console'].palette.accent.cyan).toBe('#00D4FF');
    expect(themePacks['proxy-console'].fontFamily.sans).toContain('IBM Plex Sans');
    expect(themePacks['proxy-console'].radius.md).toBe('4px');
  });

  it('deep merges overrides onto a base pack', () => {
    const custom = createThemePack(themePacks['proxy-console'], {
      colors: {
        accent: {
          cyan: '#16E0FF',
        },
      },
      radius: {
        md: '8px',
      },
    });

    expect(custom.colors.accent.cyan).toBe('#16E0FF');
    expect(custom.colors.background.default).toBe(themePacks['proxy-console'].colors.background.default);
    expect(custom.radius.md).toBe('8px');
    expect(custom.radius.sm).toBe(themePacks['proxy-console'].radius.sm);
  });

  it('serializes theme packs to uxx css variables', () => {
    const cssVars = getThemeCssVars(themePacks['proxy-console']);

    expect(cssVars['--uxx-colors-background-default']).toBe('#0A0C0F');
    expect(cssVars['--uxx-colors-button-primary-bg']).toBe('#00D4FF');
    expect(cssVars['--uxx-font-family-sans']).toContain('IBM Plex Sans');
    expect(cssVars['--uxx-radius-md']).toBe('4px');
  });

  it('adapts theme packs into Eta Mu terminal themes', () => {
    const etaMuTheme = createEtaMuThemeJson('proxy-console');

    expect(etaMuTheme.name).toBe('uxx-proxy-console');
    expect(etaMuTheme.colors.accent).toBe('#00D4FF');
    expect(etaMuTheme.colors.success).toBe('#00E5A0');
    expect(Object.keys(etaMuTheme.colors)).toHaveLength(51);
    expect(etaMuThemes['night-owl'].name).toBe('uxx-night-owl');
  });

  it('exposes runtime token references for themeable categories', () => {
    expect(tokens.colors.background.default).toContain('var(--uxx-colors-background-default');
    expect(tokens.fontFamily.sans).toContain('var(--uxx-font-family-sans');
    expect(tokens.fontSize.inlineCode).toContain('var(--uxx-font-size-inline-code');
    expect(tokens.shadow.md).toContain('var(--uxx-shadow-md');
    expect(tokens.radius.md).toContain('var(--uxx-radius-md');
  });
});
