/**
 * Design Tokens - Shadows
 * 
 * Box shadows for elevation and focus states.
 */

export const shadow = {
  // Elevation shadows
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Inner shadow
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  
  // Focus ring
  focus: '0 0 0 2px rgba(166, 226, 46, 0.5)',
  focusError: '0 0 0 2px rgba(249, 38, 114, 0.5)',
  
  // None
  none: 'none',
} as const;

// Elevation system (combines shadows with z-index semantics)
export const elevation = {
  0: {
    shadow: shadow.none,
    // Base layer
  },
  1: {
    shadow: shadow.sm,
    // Cards, list items
  },
  2: {
    shadow: shadow.md,
    // Dropdowns, popovers
  },
  3: {
    shadow: shadow.lg,
    // Modals, dialogs
  },
  4: {
    shadow: shadow.xl,
    // Floating panels
  },
  5: {
    shadow: shadow['2xl'],
    // Highest elevation
  },
} as const;

// Z-index scale
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
  top: 9999,
} as const;

export type ShadowToken = keyof typeof shadow;
export type ElevationLevel = keyof typeof elevation;
export type ZIndexToken = keyof typeof zIndex;
