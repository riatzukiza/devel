/**
 * Design Tokens - Spacing
 * 
 * 4px base unit scale for consistent spacing across components.
 */

const BASE_UNIT = 4;

export const spacing = {
  // Scale (multipliers of base unit)
  0: 0,
  px: 1,
  0.5: BASE_UNIT * 0.5,   // 2px
  1: BASE_UNIT * 1,       // 4px
  1.5: BASE_UNIT * 1.5,   // 6px
  2: BASE_UNIT * 2,       // 8px
  2.5: BASE_UNIT * 2.5,   // 10px
  3: BASE_UNIT * 3,       // 12px
  3.5: BASE_UNIT * 3.5,   // 14px
  4: BASE_UNIT * 4,       // 16px
  5: BASE_UNIT * 5,       // 20px
  6: BASE_UNIT * 6,       // 24px
  7: BASE_UNIT * 7,       // 28px
  8: BASE_UNIT * 8,       // 32px
  9: BASE_UNIT * 9,       // 36px
  10: BASE_UNIT * 10,     // 40px
  11: BASE_UNIT * 11,     // 44px
  12: BASE_UNIT * 12,     // 48px
  14: BASE_UNIT * 14,     // 56px
  16: BASE_UNIT * 16,     // 64px
  20: BASE_UNIT * 20,     // 80px
  24: BASE_UNIT * 24,     // 96px
  28: BASE_UNIT * 28,     // 112px
  32: BASE_UNIT * 32,     // 128px
} as const;

// Semantic spacing aliases
export const space = {
  // Component internals
  gap: {
    xs: spacing[1],    // 4px
    sm: spacing[2],    // 8px
    md: spacing[3],    // 12px
    lg: spacing[4],    // 16px
    xl: spacing[6],    // 24px
  },
  
  // Padding
  padding: {
    xs: spacing[1],    // 4px
    sm: spacing[2],    // 8px
    md: spacing[3],    // 12px
    lg: spacing[4],    // 16px
    xl: spacing[6],    // 24px
  },
  
  // Margins
  margin: {
    xs: spacing[1],    // 4px
    sm: spacing[2],    // 8px
    md: spacing[4],    // 16px
    lg: spacing[6],    // 24px
    xl: spacing[8],    // 32px
  },
  
  // Layout (using direct values for uncommon sizes)
  layout: {
    sidebar: 224,     // custom value for sidebar width
    header: 56,          // custom value for header height
    footer: 48,           // custom value for footer height
    content: 32,         // custom value for content area
  },
} as const;

export type SpacingToken = keyof typeof spacing;
