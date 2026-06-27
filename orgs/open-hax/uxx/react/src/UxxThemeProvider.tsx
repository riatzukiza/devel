import type { ThemeProviderProps } from './theme.js';
import { ThemeProvider } from './theme.js';

export type UxxThemeProviderProps = ThemeProviderProps;

/**
 * Backward-compatible alias for ThemeProvider.
 */
export function UxxThemeProvider(props: UxxThemeProviderProps) {
  return <ThemeProvider {...props} />;
}

export default UxxThemeProvider;
