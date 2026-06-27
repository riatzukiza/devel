import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import {
  createThemePack,
  defaultThemeName,
  getThemeCssVariables,
  getThemeCssVars,
  resolveTheme,
  resolveThemeTokens,
  themePacks,
  type ThemeDefinition,
  type ThemeName,
  type ThemeOverride,
  type ThemePack,
  type ThemePackName,
  type ThemePreference,
} from '@open-hax/uxx/tokens';

export type ResolvedTheme = Omit<ThemeDefinition, 'palette' | 'colors'>
  & Pick<ThemePack, 'fontFamily' | 'fontSize' | 'shadow' | 'radius'>
  & {
    palette: ThemeDefinition['palette'];
    colors: ThemeDefinition['colors'];
  };

interface UxxThemeContextValue {
  theme: ThemePreference;
  themeName: ThemeName;
  resolvedTheme: ResolvedTheme;
}

function themePackForName(themeName: ThemeName) {
  return themePacks[themeName as ThemePackName] ?? themePacks[defaultThemeName as ThemePackName];
}

function createResolvedTheme(themeName: ThemeName, overrides?: ThemeOverride): ResolvedTheme {
  const baseResolvedTheme = resolveThemeTokens(themeName);
  const resolvedThemePack = createThemePack(themePackForName(themeName), overrides);

  return {
    ...baseResolvedTheme,
    palette: resolvedThemePack.palette as ThemeDefinition['palette'],
    colors: resolvedThemePack.colors as ThemeDefinition['colors'],
    fontFamily: resolvedThemePack.fontFamily,
    fontSize: resolvedThemePack.fontSize,
    shadow: resolvedThemePack.shadow,
    radius: resolvedThemePack.radius,
  };
}

const UxxThemeContext = createContext<UxxThemeContextValue>({
  theme: defaultThemeName,
  themeName: defaultThemeName,
  resolvedTheme: createResolvedTheme(defaultThemeName),
});

export interface ThemeProviderProps extends HTMLAttributes<HTMLElement> {
  theme?: ThemePreference;
  overrides?: ThemeOverride;
  children: ReactNode;
  style?: CSSProperties;
  as?: ElementType;
}

export function ThemeProvider({
  theme = defaultThemeName,
  overrides,
  children,
  className,
  style,
  as: Component = 'div',
  ...props
}: ThemeProviderProps) {
  const themeName = useMemo(() => resolveTheme(theme), [theme]);
  const resolvedTheme = useMemo(() => createResolvedTheme(themeName, overrides), [themeName, overrides]);
  const resolvedThemePack = useMemo(
    () => createThemePack(themePackForName(themeName), overrides),
    [themeName, overrides],
  );
  const cssVariables = useMemo(
    () => ({
      ...getThemeCssVars(resolvedThemePack),
      ...getThemeCssVariables(resolvedTheme),
    }) as CSSProperties,
    [resolvedThemePack, resolvedTheme],
  );

  const value = useMemo<UxxThemeContextValue>(
    () => ({ theme, themeName, resolvedTheme }),
    [theme, themeName, resolvedTheme],
  );

  return (
    <UxxThemeContext.Provider value={value}>
      <Component
        {...props}
        data-theme={themeName}
        data-uxx-theme={themeName}
        className={className ? `theme-${themeName} ${className}` : `theme-${themeName}`}
        style={{
          ...cssVariables,
          ...style,
        }}
      >
        {children}
      </Component>
    </UxxThemeContext.Provider>
  );
}

export function useUxxTheme(): UxxThemeContextValue {
  return useContext(UxxThemeContext);
}

export function useResolvedTheme(theme?: ThemePreference): ResolvedTheme {
  const context = useUxxTheme();
  return useMemo(() => {
    if (theme === undefined) {
      return context.resolvedTheme;
    }
    return createResolvedTheme(resolveTheme(theme));
  }, [context.resolvedTheme, theme]);
}

export function useThemeName(theme?: ThemePreference): ThemeName {
  return useResolvedTheme(theme).name as ThemeName;
}
