/**
 * Progress Component
 *
 * Implements the progress-enhancement.spec.md contract.
 * Enhanced progress indicator with gradients, segments, animations, and more.
 */

import {
  useMemo,
  type CSSProperties,
} from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type ProgressVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'pressure';

export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg';

export type ProgressValuePosition = 'inside' | 'right' | 'tooltip';

export interface ProgressGradient {
  /** Start color */
  from: string;
  /** End color */
  to: string;
  /** Gradient angle in degrees (default 90) */
  angle?: number;
}

export interface ProgressSegment {
  /** Segment value */
  value: number;
  /** Segment color */
  color?: string;
  /** Segment gradient (overrides color) */
  gradient?: string | ProgressGradient;
  /** Optional label for segment */
  label?: string;
}

export interface ProgressProps {
  /** Current progress value (0-100 or value/max) */
  value?: number;
  /** Maximum value */
  max?: number;
  /** Color variant */
  variant?: ProgressVariant;
  /** Height of the progress bar */
  size?: ProgressSize;
  /** Custom gradient fill (overrides variant color) */
  gradient?: string | ProgressGradient;
  /** Whether progress is indeterminate (loading) */
  indeterminate?: boolean;
  /** Whether to animate progress changes */
  animated?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Whether to show the percentage/value */
  showValue?: boolean;
  /** Position of value label */
  valuePosition?: ProgressValuePosition;
  /** Custom value formatter */
  formatValue?: (value: number, max: number) => string;
  /** Multi-segment progress */
  segments?: ProgressSegment[];
  /** Whether to stripe the fill */
  striped?: boolean;
  /** Whether stripes animate */
  stripedAnimated?: boolean;
  /** Label above/below bar */
  label?: string;
  /** Accessible label */
  ariaLabel?: string;
  /** Custom class name */
  className?: string;
}

// Size styles
const sizeStyles: Record<ProgressSize, CSSProperties> = {
  xs: { height: '2px' },
  sm: { height: '4px' },
  md: { height: '8px' },
  lg: { height: '12px' },
};

// Variant gradients
const variantGradients: Record<ProgressVariant, string> = {
  default: `linear-gradient(90deg, ${tokens.colors.alpha.blue._80}, ${tokens.colors.accent.cyan})`,
  success: `linear-gradient(90deg, ${tokens.colors.alpha.green._80}, ${tokens.colors.accent.green})`,
  warning: `linear-gradient(90deg, ${tokens.colors.alpha.orange._40}, ${tokens.colors.accent.orange})`,
  error: `linear-gradient(90deg, ${tokens.colors.alpha.red._45}, ${tokens.colors.accent.red})`,
  info: `linear-gradient(90deg, ${tokens.colors.alpha.blue._80}, ${tokens.colors.accent.blue})`,
  pressure: `linear-gradient(90deg, ${tokens.colors.alpha.blue._95}, ${tokens.colors.alpha.green._80}, ${tokens.colors.alpha.magenta._30})`,
};

// Track styles
const trackStyles: CSSProperties = {
  backgroundColor: tokens.colors.background.surface,
  borderRadius: tokens.radius.sm,
  overflow: 'hidden',
  width: '100%',
  position: 'relative',
};

// Bar styles
const baseBarStyles: CSSProperties = {
  height: '100%',
  borderRadius: tokens.radius.sm,
};

// Value label styles
const valueLabelStyles: CSSProperties = {
  fontSize: tokens.fontSize.xs,
  color: tokens.colors.text.muted,
  marginTop: `${tokens.spacing[1]}px`,
  textAlign: 'right',
};

// Label styles
const labelStyles: CSSProperties = {
  fontSize: tokens.fontSize.xs,
  color: tokens.colors.text.muted,
  marginBottom: `${tokens.spacing[1]}px`,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

// Indeterminate keyframes
const indeterminateKeyframes = `
@keyframes devel-progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
`;

// Striped keyframes
const stripedKeyframes = `
@keyframes devel-progress-striped {
  0% { background-position: 1rem 0; }
  100% { background-position: 0 0; }
}
`;

// Inject keyframes once
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = indeterminateKeyframes + stripedKeyframes;
  document.head.appendChild(styleSheet);
}

/**
 * Convert gradient object to CSS gradient string.
 */
function gradientToCss(gradient: string | ProgressGradient): string {
  if (typeof gradient === 'string') return gradient;
  return `linear-gradient(${gradient.angle || 90}deg, ${gradient.from}, ${gradient.to})`;
}

/**
 * Generate striped background pattern.
 */
function getStripedBackground(color: string): string {
  return `repeating-linear-gradient(
    45deg,
    ${color},
    ${color} 10px,
    ${tokens.colors.alpha.white._08} 10px,
    ${tokens.colors.alpha.white._08} 20px
  )`;
}

/**
 * Progress indicator with gradients, segments, and animations.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Progress value={60} />
 *
 * // With gradient
 * <Progress
 *   value={75}
 *   gradient={{ from: '#66d9ef', to: '#a6e22e' }}
 * />
 *
 * // Multi-segment
 * <Progress
 *   segments={[
 *     { value: 30, color: '#66d9ef', label: 'continuity' },
 *     { value: 25, color: '#ae81ff', label: 'click pressure' },
 *   ]}
 * />
 *
 * // Striped and animated
 * <Progress value={60} striped stripedAnimated />
 * ```
 */
export function Progress({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  gradient,
  indeterminate = false,
  animated = true,
  animationDuration = 300,
  showValue = false,
  valuePosition = 'right',
  formatValue,
  segments,
  striped = false,
  stripedAnimated = false,
  label,
  ariaLabel,
  className,
}: ProgressProps) {
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, (value / max) * 100));
  }, [value, max]);

  // Compute gradient CSS
  const gradientCss = useMemo(() => {
    if (gradient) return gradientToCss(gradient);
    return variantGradients[variant];
  }, [gradient, variant]);

  // Track style
  const trackStyle: CSSProperties = {
    ...trackStyles,
    ...sizeStyles[size],
  };

  // Single bar style
  const barStyle: CSSProperties = {
    ...baseBarStyles,
    background: striped ? getStripedBackground(tokens.colors.accent.cyan) : gradientCss,
    width: indeterminate ? '50%' : `${percentage}%`,
    transition: animated ? `width ${animationDuration}ms ease-out` : 'none',
    ...(indeterminate ? {
      position: 'absolute',
      top: 0,
      left: 0,
      animation: 'devel-progress-indeterminate 1.5s infinite ease-in-out',
    } : {}),
    ...(stripedAnimated ? {
      animation: 'devel-progress-striped 1s linear infinite',
    } : {}),
  };

  // Render segments if provided
  const renderSegments = () => {
    if (!segments || segments.length === 0) return null;

    return segments.map((segment, index) => {
      const segmentPercent = (segment.value / max) * 100;
      const segmentGradient = segment.gradient
        ? gradientToCss(segment.gradient)
        : segment.color || tokens.colors.accent.cyan;

      return (
        <div
          key={segment.label || index}
          style={{
            ...baseBarStyles,
            background: segmentGradient,
            width: `${segmentPercent}%`,
            transition: animated ? `width ${animationDuration}ms ease-out` : 'none',
          }}
          title={segment.label}
        />
      );
    });
  };

  // Format value display
  const formattedValue = useMemo(() => {
    if (formatValue) return formatValue(value, max);
    return `${Math.round(percentage)}%`;
  }, [formatValue, value, max, percentage]);

  // Value inside bar (only for lg size)
  const shouldShowInside = valuePosition === 'inside' && size === 'lg' && !indeterminate;
  const shouldShowRight = valuePosition === 'right' && showValue && !indeterminate;

  return (
    <div className={className}>
      {label && <div style={labelStyles}>{label}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: `${tokens.spacing[2]}px` }}>
        <div
          role="progressbar"
          data-component="progress"
          data-variant={variant}
          data-size={size}
          data-indeterminate={indeterminate || undefined}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={indeterminate ? undefined : value}
          aria-label={ariaLabel || label}
          style={trackStyle}
        >
          {segments ? renderSegments() : <div style={barStyle} />}
          {shouldShowInside && percentage > 10 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              right: `${tokens.spacing[2]}px`,
              transform: 'translateY(-50%)',
              fontSize: tokens.fontSize.xs,
              fontWeight: tokens.fontWeight.medium,
              color: tokens.colors.background.default,
            }}>
              {formattedValue}
            </div>
          )}
        </div>

        {shouldShowRight && (
          <span style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.text.muted }}>
            {formattedValue}
          </span>
        )}
      </div>

      {valuePosition === 'tooltip' && showValue && !indeterminate && (
        <div style={valueLabelStyles}>{formattedValue}</div>
      )}
    </div>
  );
}

export default Progress;
