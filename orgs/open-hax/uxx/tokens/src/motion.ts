/**
 * Design Tokens - Motion
 * 
 * Animation durations, easings, and spring configurations.
 */

export const duration = {
  instant: 0,
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '700ms',
} as const;

export const easing = {
  // Standard easings
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Material Design inspired
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  
  // Spring-like
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const;

// Motion presets for components
export const motion = {
  // Fade
  fade: {
    enter: {
      duration: duration.fast,
      easing: easing.easeOut,
    },
    exit: {
      duration: duration.fast,
      easing: easing.easeIn,
    },
  },
  
  // Slide
  slide: {
    enter: {
      duration: duration.normal,
      easing: easing.decelerate,
    },
    exit: {
      duration: duration.normal,
      easing: easing.accelerate,
    },
  },
  
  // Scale
  scale: {
    enter: {
      duration: duration.normal,
      easing: easing.bounce,
    },
    exit: {
      duration: duration.fast,
      easing: easing.easeIn,
    },
  },
  
  // Expand/Collapse
  expand: {
    duration: duration.normal,
    easing: easing.easeInOut,
  },
  
  // Focus ring
  focus: {
    duration: duration.instant,
    easing: easing.linear,
  },
  
  // Button press
  press: {
    duration: duration.fast,
    easing: easing.easeOut,
  },
  
  // Tooltip
  tooltip: {
    enter: {
      duration: duration.fast,
      easing: easing.easeOut,
    },
    exit: {
      duration: duration.instant,
      easing: easing.linear,
    },
  },
} as const;

// Transition presets
export const transitions = {
  all: `all ${duration.normal} ${easing.easeInOut}`,
  colors: `color, background-color, border-color ${duration.fast} ${easing.easeInOut}`,
  opacity: `opacity ${duration.fast} ${easing.easeInOut}`,
  transform: `transform ${duration.normal} ${easing.easeInOut}`,
  shadow: `box-shadow ${duration.normal} ${easing.easeInOut}`,
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
