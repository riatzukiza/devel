import type { ThemePack, ThemePackName } from './theme.js';
import { themePacks } from './theme.js';

export type EtaMuThemeColorValue = `#${string}` | '';

export type EtaMuThemeJson = {
  $schema: string;
  name: string;
  vars: Record<string, EtaMuThemeColorValue>;
  colors: {
    accent: EtaMuThemeColorValue;
    border: EtaMuThemeColorValue;
    borderAccent: EtaMuThemeColorValue;
    borderMuted: EtaMuThemeColorValue;
    success: EtaMuThemeColorValue;
    error: EtaMuThemeColorValue;
    warning: EtaMuThemeColorValue;
    muted: EtaMuThemeColorValue;
    dim: EtaMuThemeColorValue;
    text: EtaMuThemeColorValue;
    thinkingText: EtaMuThemeColorValue;
    selectedBg: EtaMuThemeColorValue;
    userMessageBg: EtaMuThemeColorValue;
    userMessageText: EtaMuThemeColorValue;
    customMessageBg: EtaMuThemeColorValue;
    customMessageText: EtaMuThemeColorValue;
    customMessageLabel: EtaMuThemeColorValue;
    toolPendingBg: EtaMuThemeColorValue;
    toolSuccessBg: EtaMuThemeColorValue;
    toolErrorBg: EtaMuThemeColorValue;
    toolTitle: EtaMuThemeColorValue;
    toolOutput: EtaMuThemeColorValue;
    mdHeading: EtaMuThemeColorValue;
    mdLink: EtaMuThemeColorValue;
    mdLinkUrl: EtaMuThemeColorValue;
    mdCode: EtaMuThemeColorValue;
    mdCodeBlock: EtaMuThemeColorValue;
    mdCodeBlockBorder: EtaMuThemeColorValue;
    mdQuote: EtaMuThemeColorValue;
    mdQuoteBorder: EtaMuThemeColorValue;
    mdHr: EtaMuThemeColorValue;
    mdListBullet: EtaMuThemeColorValue;
    toolDiffAdded: EtaMuThemeColorValue;
    toolDiffRemoved: EtaMuThemeColorValue;
    toolDiffContext: EtaMuThemeColorValue;
    syntaxComment: EtaMuThemeColorValue;
    syntaxKeyword: EtaMuThemeColorValue;
    syntaxFunction: EtaMuThemeColorValue;
    syntaxVariable: EtaMuThemeColorValue;
    syntaxString: EtaMuThemeColorValue;
    syntaxNumber: EtaMuThemeColorValue;
    syntaxType: EtaMuThemeColorValue;
    syntaxOperator: EtaMuThemeColorValue;
    syntaxPunctuation: EtaMuThemeColorValue;
    thinkingOff: EtaMuThemeColorValue;
    thinkingMinimal: EtaMuThemeColorValue;
    thinkingLow: EtaMuThemeColorValue;
    thinkingMedium: EtaMuThemeColorValue;
    thinkingHigh: EtaMuThemeColorValue;
    thinkingXhigh: EtaMuThemeColorValue;
    bashMode: EtaMuThemeColorValue;
  };
  export: {
    pageBg: EtaMuThemeColorValue;
    cardBg: EtaMuThemeColorValue;
    infoBg: EtaMuThemeColorValue;
  };
};

export const etaMuThemeSchemaUrl =
  'https://raw.githubusercontent.com/open-hax/eta-mu/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json';

function hex(value: string): EtaMuThemeColorValue {
  if (value === '' || value.startsWith('#')) {
    return value as EtaMuThemeColorValue;
  }

  return '';
}

export function getEtaMuThemeName(themeName: ThemePackName): `uxx-${ThemePackName}` {
  return `uxx-${themeName}`;
}

export function createEtaMuThemeJson(
  themeName: ThemePackName,
  themePack: ThemePack = themePacks[themeName],
): EtaMuThemeJson {
  const palette = themePack.palette;
  const colors = themePack.colors;

  return {
    $schema: etaMuThemeSchemaUrl,
    name: getEtaMuThemeName(themeName),
    vars: {
      background: hex(palette.bg.default),
      surface: hex(palette.bg.darker),
      panel: hex(palette.bg.tabInactive),
      selection: hex(palette.bg.selection),
      border: hex(colors.border.default),
      borderMuted: hex(colors.border.subtle),
      text: hex(palette.fg.default),
      textBright: hex(palette.fg.bright),
      textMuted: hex(palette.fg.muted),
      textDim: hex(palette.fg.subtle),
      accent: hex(colors.interactive.default),
      accentAlt: hex(palette.accent.magenta),
      success: hex(colors.semantic.success),
      error: hex(colors.semantic.error),
      warning: hex(colors.semantic.warning),
      info: hex(colors.semantic.info),
    },
    colors: {
      accent: hex(colors.interactive.default),
      border: hex(colors.border.default),
      borderAccent: hex(colors.border.focus),
      borderMuted: hex(colors.border.subtle),
      success: hex(colors.semantic.success),
      error: hex(colors.semantic.error),
      warning: hex(colors.semantic.warning),
      muted: hex(palette.fg.muted),
      dim: hex(palette.fg.subtle),
      text: hex(palette.fg.default),
      thinkingText: hex(palette.fg.soft),
      selectedBg: hex(palette.bg.selection),
      userMessageBg: hex(palette.bg.lighter),
      userMessageText: hex(palette.fg.default),
      customMessageBg: hex(palette.bg.tabInactive),
      customMessageText: hex(palette.fg.default),
      customMessageLabel: hex(palette.accent.magenta),
      toolPendingBg: hex(palette.bg.darker),
      toolSuccessBg: hex(palette.bg.tabInactive),
      toolErrorBg: hex(palette.bg.lighter),
      toolTitle: hex(palette.fg.bright),
      toolOutput: hex(palette.fg.soft),
      mdHeading: hex(palette.accent.yellow),
      mdLink: hex(palette.accent.blue),
      mdLinkUrl: hex(palette.fg.subtle),
      mdCode: hex(palette.accent.cyan),
      mdCodeBlock: hex(palette.accent.green),
      mdCodeBlockBorder: hex(colors.border.default),
      mdQuote: hex(palette.fg.soft),
      mdQuoteBorder: hex(colors.border.subtle),
      mdHr: hex(colors.border.default),
      mdListBullet: hex(colors.interactive.default),
      toolDiffAdded: hex(colors.semantic.success),
      toolDiffRemoved: hex(colors.semantic.error),
      toolDiffContext: hex(palette.fg.muted),
      syntaxComment: hex(palette.fg.muted),
      syntaxKeyword: hex(palette.accent.magenta),
      syntaxFunction: hex(palette.accent.yellow),
      syntaxVariable: hex(palette.accent.blue),
      syntaxString: hex(palette.accent.green),
      syntaxNumber: hex(palette.accent.orange),
      syntaxType: hex(palette.accent.cyan),
      syntaxOperator: hex(palette.fg.bright),
      syntaxPunctuation: hex(palette.fg.soft),
      thinkingOff: hex(palette.fg.subtle),
      thinkingMinimal: hex(palette.fg.muted),
      thinkingLow: hex(palette.accent.blue),
      thinkingMedium: hex(palette.accent.cyan),
      thinkingHigh: hex(palette.accent.magenta),
      thinkingXhigh: hex(palette.accent.red),
      bashMode: hex(colors.semantic.success),
    },
    export: {
      pageBg: hex(palette.bg.default),
      cardBg: hex(palette.bg.darker),
      infoBg: hex(palette.bg.lighter),
    },
  };
}

export const etaMuThemes = Object.fromEntries(
  (Object.keys(themePacks) as ThemePackName[]).map((name) => [name, createEtaMuThemeJson(name)]),
) as Record<ThemePackName, EtaMuThemeJson>;
