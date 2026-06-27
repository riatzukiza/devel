/**
 * Design Tokens - Radius
 *
 * Border radius scale for themeable component corners.
 */

export const radius = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

export type RadiusToken = keyof typeof radius;
