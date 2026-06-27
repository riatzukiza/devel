import { monokai, nightOwl, proxyConsole, themes, toKebabCase } from './colors.js';
import { radius } from './radius.js';
import { shadow } from './shadows.js';
import { fontFamily, fontSize } from './typography.js';

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type WidenLiterals<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends object
      ? { [K in keyof T]: WidenLiterals<T[K]> }
      : T;

export type ThemePack = {
  colors: WidenLiterals<typeof themes.monokai.colors>;
  palette: WidenLiterals<typeof monokai>;
  fontFamily: WidenLiterals<typeof fontFamily>;
  fontSize: WidenLiterals<typeof fontSize>;
  shadow: WidenLiterals<typeof shadow>;
  radius: WidenLiterals<typeof radius>;
};

export type ThemeOverride = DeepPartial<ThemePack>;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepMerge<T extends Record<string, unknown>>(base: T, override?: DeepPartial<T>): T {
  if (!override) {
    return clone(base);
  }

  const output: Record<string, unknown> = clone(base);

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) {
      continue;
    }

    const current = output[key];

    if (isRecord(current) && isRecord(value)) {
      output[key] = deepMerge(current, value as DeepPartial<typeof current>);
      continue;
    }

    output[key] = value;
  }

  return output as T;
}

export function createThemePack(base: ThemePack, override?: ThemeOverride): ThemePack {
  return deepMerge(base, override);
}

export type ThemePackName = 'monokai' | 'night-owl' | 'proxy-console';

export const defaultThemePack: ThemePack = {
  colors: clone(themes.monokai.colors),
  palette: clone(monokai),
  fontFamily,
  fontSize,
  shadow,
  radius,
};

export const themePacks: Record<ThemePackName, ThemePack> = {
  monokai: defaultThemePack,
  'night-owl': createThemePack(defaultThemePack, {
    colors: clone(themes['night-owl'].colors),
    palette: clone(nightOwl),
    shadow: {
      focus: '0 0 0 2px rgba(130, 170, 255, 0.35)',
      focusError: '0 0 0 2px rgba(239, 83, 80, 0.35)',
    },
  }),
  'proxy-console': createThemePack(defaultThemePack, {
    colors: clone(themes['proxy-console'].colors),
    palette: clone(proxyConsole),
    fontFamily: {
      sans: [
        'IBM Plex Sans',
        'Segoe UI',
        'system-ui',
        'sans-serif',
      ].join(', '),
      mono: [
        'JetBrains Mono',
        'Fira Code',
        'monospace',
      ].join(', '),
    },
    shadow: {
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
      sm: '0 1px 3px rgba(0, 0, 0, 0.4)',
      md: '0 4px 12px rgba(0, 0, 0, 0.5)',
      lg: '0 10px 24px rgba(0, 0, 0, 0.55)',
      xl: '0 20px 36px rgba(0, 0, 0, 0.6)',
      '2xl': '0 28px 64px rgba(0, 0, 0, 0.65)',
      inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.28)',
      focus: '0 0 0 2px rgba(0, 212, 255, 0.35)',
      focusError: '0 0 0 2px rgba(255, 76, 76, 0.35)',
      none: 'none',
    },
    radius: {
      none: '0px',
      xs: '2px',
      sm: '4px',
      md: '4px',
      lg: '6px',
      xl: '8px',
      full: '9999px',
    },
  }),
};

export function getThemeCssVarName(path: ReadonlyArray<string>): `--uxx-${string}` {
  return `--uxx-${path.map(toKebabCase).join('-')}`;
}

function flattenThemeObject(
  value: Record<string, unknown>,
  path: string[] = []
): Record<`--uxx-${string}`, string> {
  const flattened = {} as Record<`--uxx-${string}`, string>;

  for (const [key, entry] of Object.entries(value)) {
    const nextPath = [...path, key];

    if (isRecord(entry)) {
      Object.assign(flattened, flattenThemeObject(entry, nextPath));
      continue;
    }

    flattened[getThemeCssVarName(nextPath)] = String(entry);
  }

  return flattened;
}

export function getThemeCssVars(theme: ThemePack): Record<`--uxx-${string}`, string> {
  return flattenThemeObject(theme as unknown as Record<string, unknown>);
}

export function createThemeCssVarRefs<T extends Record<string, unknown>>(
  theme: T,
  path: string[] = []
): T {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(theme)) {
    const nextPath = [...path, key];

    if (isRecord(value)) {
      output[key] = createThemeCssVarRefs(value, nextPath);
      continue;
    }

    output[key] = `var(${getThemeCssVarName(nextPath)}, ${String(value)})`;
  }

  return output as T;
}
