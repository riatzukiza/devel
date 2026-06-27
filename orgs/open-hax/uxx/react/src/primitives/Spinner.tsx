/**
 * Spinner Component
 * 
 * Implements the spinner.edn contract.
 * Loading indicator with customizable size and color.
 */

import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Color of the spinner (CSS color value) */
  color?: string;
  /** Stroke thickness of the spinner ring */
  thickness?: number;
  /** Accessible label for screen readers */
  label?: string;
}

// Size values in pixels
const sizeValues: Record<SpinnerSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

/**
 * Spinner component for loading states.
 * 
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" label="Loading content..." />
 * <Spinner size="sm" color={tokens.colors.accent.cyan} />
 * ```
 */
export function Spinner({
  size = 'md',
  color = 'currentColor',
  thickness = 2.5,
  label = 'Loading',
}: SpinnerProps) {
  const dimension = sizeValues[size];
  
  return (
    <svg
      data-component="spinner"
      data-size={size}
      role="status"
      aria-busy="true"
      aria-label={label}
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={thickness}
      strokeLinecap="round"
      style={{
        animation: 'devel-ui-spin 1s linear infinite',
      }}
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

export default Spinner;
