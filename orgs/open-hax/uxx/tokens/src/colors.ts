/**
 * Design Tokens - Colors
 *
 * Multi-theme token registry for UXX.
 *
 * Monokai remains the default theme for backward compatibility.
 * Add new themes by defining a base palette and registering it with
 * `createThemeDefinition(...)`.
 */

type HexColor = `#${string}`;

export interface ThemePalette {
  bg: {
    default: HexColor;
    darker: HexColor;
    lighter: HexColor;
    selection: HexColor;
    tabInactive: HexColor;
    groupBorder: HexColor;
  };
  fg: {
    default: HexColor;
    bright: HexColor;
    panel: HexColor;
    soft: HexColor;
    muted: HexColor;
    subtle: HexColor;
  };
  accent: {
    yellow: HexColor;
    orange: HexColor;
    red: HexColor;
    magenta: HexColor;
    blue: HexColor;
    cyan: HexColor;
    green: HexColor;
  };
  semantic: {
    error: HexColor;
    warning: HexColor;
    success: HexColor;
    info: HexColor;
  };
}

function normalizeHex(hex: string): string {
  const raw = hex.replace('#', '').trim();
  if (raw.length === 3) {
    return raw.split('').map((char) => `${char}${char}`).join('');
  }
  return raw;
}

function alphaToString(alpha: number): string {
  const rounded = Number(alpha.toFixed(2));
  return String(rounded);
}

export function withAlpha(hex: string, alpha: number): string {
  const normalized = normalizeHex(hex);
  if (normalized.length !== 6) {
    return hex;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alphaToString(alpha)})`;
}

function mergeThemeObjects<T extends Record<string, unknown>>(
  base: T,
  overrides?: Record<string, unknown>,
): T {
  if (!overrides) {
    return base;
  }

  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    const current = result[key];

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      result[key] = mergeThemeObjects(
        current as Record<string, unknown>,
        value as Record<string, unknown>,
      );
      continue;
    }

    result[key] = value;
  }

  return result as T;
}

function createThemeColors(
  palette: ThemePalette,
  overrides?: Record<string, unknown>,
) {
  const base = {
    background: {
      default: palette.bg.default,
      surface: palette.bg.darker,
      elevated: palette.bg.tabInactive,
      highlight: palette.bg.lighter,
      overlay: 'rgba(0, 0, 0, 0.6)',
      hover: withAlpha(palette.accent.cyan, 0.08),
    },

    selection: {
      default: withAlpha(palette.bg.selection, 0.5),
    },

    text: {
      default: palette.fg.default,
      bright: palette.fg.bright,
      panel: palette.fg.panel,
      soft: palette.fg.soft,
      muted: palette.fg.muted,
      subtle: palette.fg.subtle,
      inverse: palette.bg.default,
      secondary: palette.fg.muted,
      accent: palette.accent.cyan,
    },

    interactive: {
      default: palette.accent.cyan,
      hover: withAlpha(palette.accent.cyan, 0.88),
      active: withAlpha(palette.accent.cyan, 0.72),
      disabled: palette.fg.muted,
    },

    button: {
      primary: {
        bg: palette.accent.cyan,
        fg: palette.bg.default,
        hover: withAlpha(palette.accent.cyan, 0.88),
        active: withAlpha(palette.accent.cyan, 0.72),
      },
      secondary: {
        bg: palette.bg.selection,
        fg: palette.fg.default,
        hover: withAlpha(palette.bg.selection, 0.88),
        active: withAlpha(palette.bg.selection, 0.72),
      },
      ghost: {
        bg: 'transparent',
        fg: palette.fg.default,
        hover: withAlpha(palette.fg.default, 0.08),
        active: withAlpha(palette.fg.default, 0.14),
      },
      danger: {
        bg: palette.accent.red,
        fg: palette.fg.default,
        hover: withAlpha(palette.accent.red, 0.88),
        active: withAlpha(palette.accent.red, 0.72),
      },
    },

    badge: {
      default: {
        bg: palette.fg.muted,
        fg: palette.fg.default,
      },
      success: {
        bg: withAlpha(palette.accent.green, 0.15),
        fg: palette.accent.green,
      },
      warning: {
        bg: withAlpha(palette.accent.orange, 0.15),
        fg: palette.accent.orange,
      },
      error: {
        bg: withAlpha(palette.accent.red, 0.15),
        fg: palette.accent.red,
      },
      info: {
        bg: withAlpha(palette.accent.blue, 0.15),
        fg: palette.accent.blue,
      },
    },

    border: {
      default: palette.bg.groupBorder,
      subtle: palette.fg.subtle,
      focus: palette.accent.cyan,
      error: palette.accent.red,
    },

    accent: palette.accent,

    semantic: {
      error: palette.semantic.error,
      warning: palette.semantic.warning,
      success: palette.semantic.success,
      info: palette.semantic.info,
    },

    status: {
      alive: palette.accent.green,
      dead: palette.accent.red,
      open: palette.accent.green,
      closed: palette.fg.muted,
      merged: palette.accent.magenta,
      sleeping: palette.accent.blue,
      eating: palette.accent.orange,
      working: palette.accent.yellow,
    },

    chart: {
      segment0: palette.accent.blue,
      segment1: palette.accent.green,
      segment2: palette.accent.yellow,
      segment3: palette.accent.orange,
      segment4: palette.accent.magenta,
      segment5: palette.fg.soft,
    },

    fill: {
      good: { start: palette.accent.green, end: withAlpha(palette.accent.green, 0.55) },
      warn: { start: palette.accent.orange, end: withAlpha(palette.accent.orange, 0.55) },
      danger: { start: palette.accent.red, end: withAlpha(palette.accent.red, 0.55) },
      neutral: { start: palette.accent.blue, end: withAlpha(palette.accent.blue, 0.55) },
    },

    surface: {
      panel: withAlpha(palette.bg.darker, 0.82),
      card: withAlpha(palette.bg.tabInactive, 0.65),
      cardAlt: withAlpha(palette.bg.lighter, 0.55),
      input: withAlpha(palette.bg.selection, 0.78),
      nav: withAlpha(palette.bg.darker, 0.6),
    },

    alpha: {
      green: {
        _08: withAlpha(palette.accent.green, 0.08),
        _12: withAlpha(palette.accent.green, 0.12),
        _14: withAlpha(palette.accent.green, 0.14),
        _15: withAlpha(palette.accent.green, 0.15),
        _16: withAlpha(palette.accent.green, 0.16),
        _25: withAlpha(palette.accent.green, 0.25),
        _28: withAlpha(palette.accent.green, 0.28),
        _30: withAlpha(palette.accent.green, 0.3),
        _35: withAlpha(palette.accent.green, 0.35),
        _38: withAlpha(palette.accent.green, 0.38),
        _40: withAlpha(palette.accent.green, 0.4),
        _45: withAlpha(palette.accent.green, 0.45),
        _50: withAlpha(palette.accent.green, 0.5),
        _55: withAlpha(palette.accent.green, 0.55),
        _60: withAlpha(palette.accent.green, 0.6),
        _80: withAlpha(palette.accent.green, 0.8),
      },
      red: {
        _12: withAlpha(palette.accent.red, 0.12),
        _14: withAlpha(palette.accent.red, 0.14),
        _15: withAlpha(palette.accent.red, 0.15),
        _25: withAlpha(palette.accent.red, 0.25),
        _30: withAlpha(palette.accent.red, 0.3),
        _38: withAlpha(palette.accent.red, 0.38),
        _40: withAlpha(palette.accent.red, 0.4),
        _45: withAlpha(palette.accent.red, 0.45),
        _46: withAlpha(palette.accent.red, 0.46),
        _50: withAlpha(palette.accent.red, 0.5),
      },
      orange: {
        _12: withAlpha(palette.accent.orange, 0.12),
        _15: withAlpha(palette.accent.orange, 0.15),
        _32: withAlpha(palette.accent.orange, 0.32),
        _35: withAlpha(palette.accent.orange, 0.35),
        _40: withAlpha(palette.accent.orange, 0.4),
      },
      blue: {
        _15: withAlpha(palette.accent.blue, 0.15),
        _20: withAlpha(palette.accent.blue, 0.2),
        _35: withAlpha(palette.accent.blue, 0.35),
        _45: withAlpha(palette.accent.blue, 0.45),
        _80: withAlpha(palette.accent.blue, 0.8),
        _95: withAlpha(palette.accent.blue, 0.95),
      },
      magenta: {
        _08: withAlpha(palette.accent.magenta, 0.08),
        _14: withAlpha(palette.accent.magenta, 0.14),
        _30: withAlpha(palette.accent.magenta, 0.3),
      },
      yellow: {
        _06: withAlpha(palette.accent.yellow, 0.06),
      },
      bg: {
        _08: withAlpha(palette.bg.selection, 0.08),
        _10: withAlpha(palette.bg.selection, 0.1),
        _12: withAlpha(palette.bg.selection, 0.12),
        _14: withAlpha(palette.bg.selection, 0.14),
        _16: withAlpha(palette.bg.selection, 0.16),
        _18: withAlpha(palette.bg.selection, 0.18),
        _24: withAlpha(palette.bg.lighter, 0.24),
        _25: withAlpha(palette.bg.selection, 0.25),
        _28: withAlpha(palette.bg.selection, 0.28),
        _30: withAlpha(palette.bg.selection, 0.3),
        _46: withAlpha(palette.bg.darker, 0.46),
        _55: withAlpha(palette.bg.selection, 0.55),
        _60: withAlpha(palette.bg.darker, 0.6),
        _62: withAlpha(palette.bg.darker, 0.62),
        _68: withAlpha(palette.bg.darker, 0.68),
        _70: withAlpha(palette.bg.selection, 0.7),
        _72: withAlpha(palette.bg.darker, 0.72),
        _80: withAlpha(palette.bg.darker, 0.8),
        _85: withAlpha(palette.bg.lighter, 0.85),
        _88: withAlpha(palette.bg.lighter, 0.88),
        _88b: withAlpha(palette.bg.default, 0.88),
        _90: withAlpha(palette.bg.darker, 0.9),
        _95: withAlpha(palette.bg.darker, 0.95),
      },
      warningBg: withAlpha(palette.accent.orange, 0.2),
      errorBg: withAlpha(palette.accent.red, 0.42),
      errorBgSolid: withAlpha(palette.accent.red, 0.9),
      federationError: withAlpha(palette.accent.red, 0.22),
      white: {
        _08: 'rgba(255, 255, 255, 0.08)',
      },
      shadow: 'rgba(0, 0, 0, 0.35)',
      shadowLight: 'rgba(0, 0, 0, 0.3)',
      shadowDeep: 'rgba(15, 23, 42, 0.22)',
    },
  } as const;

  return mergeThemeObjects(base, overrides);
}

export type ThemeColors = ReturnType<typeof createThemeColors>;
export type ThemeCssVariables = Record<string, string>;

export function toKebabCase(value: string): string {
  return value.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function createCssVarReference(path: string[], fallback: string): string {
  return `var(--uxx-${path.map(toKebabCase).join('-')}, ${fallback})`;
}

function createCssVarMirror<T>(value: T, path: string[] = []): T {
  if (typeof value === 'string') {
    return createCssVarReference(path, value) as T;
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).map(([key, child]) => [
      key,
      createCssVarMirror(child, [...path, key]),
    ]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function flattenThemeCssVariables(
  value: unknown,
  path: string[] = [],
  result: ThemeCssVariables = {},
): ThemeCssVariables {
  if (typeof value === 'string') {
    result[`--uxx-${path.map(toKebabCase).join('-')}`] = value;
    return result;
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      flattenThemeCssVariables(child, [...path, key], result);
    }
  }

  return result;
}

function flattenThemeTokenAliasVariables(
  value: unknown,
  path: string[] = [],
  result: ThemeCssVariables = {},
): ThemeCssVariables {
  if (typeof value === 'string') {
    result[`--token-${path.join('-')}`] = value;
    return result;
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      flattenThemeTokenAliasVariables(child, [...path, key], result);
    }
  }

  return result;
}

export interface ThemeDefinition {
  name: string;
  label: string;
  appearance: 'dark' | 'light';
  palette: ThemePalette;
  colors: ThemeColors;
}

export function createThemeDefinition(
  name: string,
  label: string,
  palette: ThemePalette,
  options?: {
    appearance?: 'dark' | 'light';
    colorOverrides?: Record<string, unknown>;
  },
): ThemeDefinition {
  return {
    name,
    label,
    appearance: options?.appearance ?? 'dark',
    palette,
    colors: createThemeColors(palette, options?.colorOverrides),
  };
}

// Monokai Classic Base Palette (from official VS Code theme)
export const monokai = {
  bg: {
    default: '#272822',
    darker: '#1e1f1c',
    lighter: '#3e3d32',
    selection: '#414339',
    tabInactive: '#34352f',
    groupBorder: '#34352f',
  },
  fg: {
    default: '#f8f8f2',
    bright: '#f8f8f2',
    panel: '#cccccc',
    soft: '#90908a',
    muted: '#75715e',
    subtle: '#464741',
  },
  accent: {
    yellow: '#e6db74',
    orange: '#fd971f',
    red: '#f92672',
    magenta: '#ae81ff',
    blue: '#66d9ef',
    cyan: '#66d9ef',
    green: '#a6e22e',
  },
  semantic: {
    error: '#f92672',
    warning: '#fd971f',
    success: '#a6e22e',
    info: '#66d9ef',
  },
} as const satisfies ThemePalette;

export const nightOwl = {
  bg: {
    default: '#011627',
    darker: '#01111d',
    lighter: '#0b2942',
    selection: '#1d3b53',
    tabInactive: '#0b253a',
    groupBorder: '#5f7e97',
  },
  fg: {
    default: '#d6deeb',
    bright: '#ffffff',
    panel: '#d2dee7',
    soft: '#89a4bb',
    muted: '#5f7e97',
    subtle: '#4b6479',
  },
  accent: {
    yellow: '#ffeb95',
    orange: '#F78C6C',
    red: '#EF5350',
    magenta: '#c792ea',
    blue: '#82AAFF',
    cyan: '#80CBC4',
    green: '#c5e478',
  },
  semantic: {
    error: '#EF5350',
    warning: '#FFCA28',
    success: '#c5e478',
    info: '#82AAFF',
  },
} as const satisfies ThemePalette;

export const proxyConsole = {
  bg: {
    default: '#0A0C0F',
    darker: '#0F1318',
    lighter: '#1E2530',
    selection: '#131820',
    tabInactive: '#131820',
    groupBorder: '#1E2530',
  },
  fg: {
    default: '#E8ECF1',
    bright: '#F4F7FB',
    panel: '#D6DCE6',
    soft: '#A6B1C2',
    muted: '#8A94A6',
    subtle: '#5A6478',
  },
  accent: {
    yellow: '#F5A623',
    orange: '#F5A623',
    red: '#FF4C4C',
    magenta: '#9B8CFF',
    blue: '#00D4FF',
    cyan: '#00D4FF',
    green: '#00E5A0',
  },
  semantic: {
    error: '#FF4C4C',
    warning: '#F5A623',
    success: '#00E5A0',
    info: '#00D4FF',
  },
} as const satisfies ThemePalette;

export const themes = {
  monokai: createThemeDefinition('monokai', 'Monokai', monokai, {
    appearance: 'dark',
    colorOverrides: {
      selection: {
        default: 'rgba(135, 139, 145, 0.5)',
      },
      interactive: {
        default: monokai.accent.green,
        hover: '#8fce26',
        active: '#7cb824',
        disabled: monokai.fg.muted,
      },
      button: {
        primary: {
          bg: monokai.fg.muted,
          fg: monokai.fg.default,
          hover: '#8a856e',
          active: '#6a6654',
        },
        secondary: {
          bg: monokai.bg.selection,
          fg: monokai.fg.default,
          hover: '#505248',
          active: '#3a3c33',
        },
        ghost: {
          bg: 'transparent',
          fg: monokai.fg.default,
          hover: monokai.bg.selection,
          active: monokai.bg.tabInactive,
        },
        danger: {
          bg: monokai.accent.red,
          fg: monokai.fg.default,
          hover: '#e61b63',
          active: '#d1155c',
        },
      },
      border: {
        focus: '#99947c',
      },
      chart: {
        segment5: '#7ca3b5',
      },
      fill: {
        good: { start: monokai.accent.green, end: '#78efb7' },
        warn: { start: monokai.accent.orange, end: '#ffd280' },
        danger: { start: monokai.accent.red, end: '#ff9e92' },
        neutral: { start: '#7aa7bd', end: '#98bfd0' },
      },
      alpha: {
        warningBg: 'rgba(58, 41, 16, 0.88)',
        errorBg: 'rgba(70, 24, 24, 0.42)',
        errorBgSolid: 'rgba(70, 24, 24, 0.9)',
        federationError: 'rgba(127, 29, 29, 0.22)',
      },
    },
  }),
  'night-owl': createThemeDefinition('night-owl', 'Night Owl', nightOwl, {
    appearance: 'dark',
    colorOverrides: {
      interactive: {
        default: nightOwl.accent.cyan,
        hover: '#7fdbca',
        active: '#21c7a8',
        disabled: nightOwl.fg.muted,
      },
      button: {
        primary: {
          bg: '#7e57c2cc',
          fg: '#ffffffcc',
          hover: '#7e57c2',
          active: '#6747a4',
        },
        secondary: {
          bg: nightOwl.bg.selection,
          fg: nightOwl.fg.default,
          hover: '#234d708c',
          active: '#0e293f',
        },
        ghost: {
          bg: 'transparent',
          fg: nightOwl.fg.default,
          hover: withAlpha(nightOwl.bg.selection, 0.55),
          active: nightOwl.bg.lighter,
        },
        danger: {
          bg: nightOwl.accent.red,
          fg: '#ffffffcc',
          hover: '#ec5f67',
          active: '#d3423e',
        },
      },
      badge: {
        default: {
          bg: nightOwl.fg.muted,
          fg: '#ffffff',
        },
      },
      border: {
        default: nightOwl.bg.groupBorder,
        subtle: nightOwl.fg.subtle,
        focus: nightOwl.accent.blue,
      },
      chart: {
        segment5: '#5f7e97',
      },
      fill: {
        good: { start: nightOwl.accent.green, end: '#d9f5dd' },
        warn: { start: nightOwl.accent.orange, end: '#ffcb8b' },
        danger: { start: nightOwl.accent.red, end: '#ff869a' },
        neutral: { start: nightOwl.accent.blue, end: '#c5e4fd' },
      },
      alpha: {
        warningBg: '#675700F2',
        errorBg: 'rgba(171, 3, 0, 0.42)',
        errorBgSolid: '#AB0300F2',
        federationError: withAlpha(nightOwl.accent.red, 0.22),
        shadow: 'rgba(1, 22, 39, 0.35)',
        shadowLight: 'rgba(1, 11, 20, 0.3)',
        shadowDeep: 'rgba(1, 17, 29, 0.45)',
      },
    },
  }),
  'proxy-console': createThemeDefinition('proxy-console', 'Proxy Console', proxyConsole, {
    appearance: 'dark',
    colorOverrides: {
      interactive: {
        default: proxyConsole.accent.cyan,
        hover: '#34DEFF',
        active: '#00B8DE',
        disabled: proxyConsole.fg.subtle,
      },
      button: {
        primary: {
          bg: '#00D4FF',
          fg: '#0A0C0F',
          hover: '#34DEFF',
          active: '#00B8DE',
        },
        secondary: {
          bg: '#0F1318',
          fg: '#E8ECF1',
          hover: '#131820',
          active: '#1A212C',
        },
        ghost: {
          bg: 'transparent',
          fg: '#E8ECF1',
          hover: withAlpha(proxyConsole.accent.cyan, 0.12),
          active: withAlpha(proxyConsole.accent.cyan, 0.18),
        },
        danger: {
          bg: '#FF4C4C',
          fg: '#FDFEFF',
          hover: '#FF6666',
          active: '#E64545',
        },
      },
      badge: {
        default: {
          bg: withAlpha(proxyConsole.fg.subtle, 0.2),
          fg: '#E8ECF1',
        },
        success: {
          bg: withAlpha(proxyConsole.accent.green, 0.12),
          fg: '#00E5A0',
        },
        warning: {
          bg: withAlpha(proxyConsole.accent.orange, 0.12),
          fg: '#F5A623',
        },
        error: {
          bg: withAlpha(proxyConsole.accent.red, 0.12),
          fg: '#FF4C4C',
        },
        info: {
          bg: withAlpha(proxyConsole.accent.cyan, 0.12),
          fg: '#00D4FF',
        },
      },
      border: {
        default: '#1E2530',
        subtle: '#171C25',
        focus: '#00D4FF',
        error: '#FF4C4C',
      },
      chart: {
        segment0: '#00D4FF',
        segment1: '#00E5A0',
        segment2: '#F5A623',
        segment3: '#FF4C4C',
        segment4: '#9B8CFF',
        segment5: '#7A90AA',
      },
      fill: {
        good: { start: '#00E5A0', end: '#57F0C0' },
        warn: { start: '#F5A623', end: '#FFD07A' },
        danger: { start: '#FF4C4C', end: '#FF8C8C' },
        neutral: { start: '#00D4FF', end: '#8EEBFF' },
      },
      surface: {
        panel: withAlpha(proxyConsole.bg.darker, 0.92),
        card: withAlpha(proxyConsole.bg.tabInactive, 0.82),
        cardAlt: withAlpha(proxyConsole.bg.lighter, 0.62),
        input: withAlpha('#0A0D11', 0.95),
        nav: withAlpha(proxyConsole.bg.default, 0.88),
      },
      alpha: {
        green: {
          _08: withAlpha(proxyConsole.accent.green, 0.08),
          _12: withAlpha(proxyConsole.accent.green, 0.12),
          _14: withAlpha(proxyConsole.accent.green, 0.14),
          _15: withAlpha(proxyConsole.accent.green, 0.15),
          _16: withAlpha(proxyConsole.accent.green, 0.16),
          _25: withAlpha(proxyConsole.accent.green, 0.25),
          _28: withAlpha(proxyConsole.accent.green, 0.28),
          _30: withAlpha(proxyConsole.accent.green, 0.3),
          _35: withAlpha(proxyConsole.accent.green, 0.35),
          _38: withAlpha(proxyConsole.accent.green, 0.38),
          _40: withAlpha(proxyConsole.accent.green, 0.4),
          _45: withAlpha(proxyConsole.accent.green, 0.45),
          _50: withAlpha(proxyConsole.accent.green, 0.5),
          _55: withAlpha(proxyConsole.accent.green, 0.55),
          _60: withAlpha(proxyConsole.accent.green, 0.6),
          _80: withAlpha(proxyConsole.accent.green, 0.8),
        },
        red: {
          _12: withAlpha(proxyConsole.accent.red, 0.12),
          _14: withAlpha(proxyConsole.accent.red, 0.14),
          _15: withAlpha(proxyConsole.accent.red, 0.15),
          _25: withAlpha(proxyConsole.accent.red, 0.25),
          _30: withAlpha(proxyConsole.accent.red, 0.3),
          _38: withAlpha(proxyConsole.accent.red, 0.38),
          _40: withAlpha(proxyConsole.accent.red, 0.4),
          _45: withAlpha(proxyConsole.accent.red, 0.45),
          _46: withAlpha(proxyConsole.accent.red, 0.46),
          _50: withAlpha(proxyConsole.accent.red, 0.5),
        },
        orange: {
          _12: withAlpha(proxyConsole.accent.orange, 0.12),
          _15: withAlpha(proxyConsole.accent.orange, 0.15),
          _32: withAlpha(proxyConsole.accent.orange, 0.32),
          _35: withAlpha(proxyConsole.accent.orange, 0.35),
          _40: withAlpha(proxyConsole.accent.orange, 0.4),
        },
        blue: {
          _15: withAlpha(proxyConsole.accent.blue, 0.15),
          _20: withAlpha(proxyConsole.accent.blue, 0.2),
          _35: withAlpha(proxyConsole.accent.blue, 0.35),
          _45: withAlpha(proxyConsole.accent.blue, 0.45),
          _80: withAlpha(proxyConsole.accent.blue, 0.8),
          _95: withAlpha(proxyConsole.accent.blue, 0.95),
        },
        magenta: {
          _08: withAlpha(proxyConsole.accent.magenta, 0.08),
          _14: withAlpha(proxyConsole.accent.magenta, 0.14),
          _30: withAlpha(proxyConsole.accent.magenta, 0.3),
        },
        yellow: {
          _06: withAlpha(proxyConsole.accent.yellow, 0.06),
        },
        bg: {
          _08: withAlpha(proxyConsole.bg.tabInactive, 0.08),
          _10: withAlpha(proxyConsole.bg.tabInactive, 0.1),
          _12: withAlpha(proxyConsole.bg.tabInactive, 0.12),
          _14: withAlpha(proxyConsole.bg.tabInactive, 0.14),
          _16: withAlpha(proxyConsole.bg.tabInactive, 0.16),
          _18: withAlpha(proxyConsole.bg.tabInactive, 0.18),
          _24: withAlpha(proxyConsole.bg.tabInactive, 0.24),
          _25: withAlpha(proxyConsole.bg.tabInactive, 0.25),
          _28: withAlpha(proxyConsole.bg.tabInactive, 0.28),
          _30: withAlpha(proxyConsole.bg.tabInactive, 0.3),
          _46: withAlpha(proxyConsole.bg.default, 0.46),
          _55: withAlpha(proxyConsole.bg.tabInactive, 0.55),
          _60: withAlpha(proxyConsole.bg.default, 0.6),
          _62: withAlpha(proxyConsole.bg.default, 0.62),
          _68: withAlpha(proxyConsole.bg.default, 0.68),
          _70: withAlpha(proxyConsole.bg.tabInactive, 0.7),
          _72: withAlpha(proxyConsole.bg.default, 0.72),
          _80: withAlpha(proxyConsole.bg.default, 0.8),
          _85: withAlpha(proxyConsole.bg.tabInactive, 0.85),
          _88: withAlpha(proxyConsole.bg.tabInactive, 0.88),
          _88b: withAlpha(proxyConsole.bg.default, 0.88),
          _90: withAlpha(proxyConsole.bg.default, 0.9),
          _95: withAlpha(proxyConsole.bg.default, 0.95),
        },
        warningBg: withAlpha('#442E0C', 0.88),
        errorBg: withAlpha('#5A1C1C', 0.42),
        errorBgSolid: withAlpha('#5A1C1C', 0.9),
        federationError: withAlpha('#7F1D1D', 0.22),
        white: {
          _08: withAlpha('#FFFFFF', 0.08),
        },
        shadow: withAlpha('#000000', 0.4),
        shadowLight: withAlpha('#000000', 0.3),
        shadowDeep: withAlpha('#000000', 0.5),
      },
    },
  }),
} as const;

export type ThemeName = keyof typeof themes;
export type ThemePreference = ThemeName | 'dark' | 'light' | 'auto';

export const defaultThemeName: ThemeName = 'monokai';

function themeByAppearance(appearance: 'dark' | 'light'): ThemeDefinition {
  return (
    Object.values(themes).find((theme) => theme.appearance === appearance) ??
    themes[defaultThemeName]
  );
}

export function resolveTheme(theme: ThemePreference = defaultThemeName): ThemeName {
  if (theme === 'dark') {
    return themeByAppearance('dark').name as ThemeName;
  }

  if (theme === 'light') {
    return themeByAppearance('light').name as ThemeName;
  }

  if (theme === 'auto') {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: light)').matches
        ? themeByAppearance('light').name as ThemeName
        : themeByAppearance('dark').name as ThemeName;
    }
    return defaultThemeName;
  }

  return theme;
}

export function getTheme(themeName: ThemeName = defaultThemeName): ThemeDefinition {
  return themes[themeName];
}

export function resolveThemeTokens(theme: ThemePreference = defaultThemeName): ThemeDefinition {
  return getTheme(resolveTheme(theme));
}

export function getThemeCssVariables(
  theme: ThemePreference | ThemeName | ThemeDefinition = defaultThemeName,
): ThemeCssVariables {
  const resolved = typeof theme === 'object' && theme !== null && 'colors' in theme
    ? theme
    : resolveThemeTokens(theme as ThemePreference);

  return {
    ...flattenThemeCssVariables(resolved.colors, ['colors']),
    ...flattenThemeTokenAliasVariables(resolved.colors, ['colors']),
  };
}

// Backward-compatible default exports
export const colors = createCssVarMirror(themes[defaultThemeName].colors, ['colors']);

export type ColorToken = keyof typeof colors;
export type MonokaiColor = typeof monokai;
export type NightOwlColor = typeof nightOwl;
export type ProxyConsoleColor = typeof proxyConsole;
