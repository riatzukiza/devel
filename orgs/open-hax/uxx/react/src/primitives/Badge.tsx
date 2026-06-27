/**
 * Badge Component
 *
 * Implements the badge-enhancement.spec.md contract.
 * Enhanced compact status or category indicator with variants, pulse, and icons.
 */

import { type ReactNode, type CSSProperties } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'open'
  | 'closed'
  | 'merged'
  | 'alive'
  | 'dead'
  | 'running'
  | 'stopped';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Whether to show a status dot before the content */
  dot?: boolean;
  /** Whether dot should pulse (live/active state) */
  pulse?: boolean;
  /** Whether to use fully rounded (pill) corners */
  rounded?: boolean;
  /** Whether to use outline style instead of filled */
  outline?: boolean;
  /** Custom dot color (overrides variant) */
  dotColor?: string;
  /** Badge content */
  children?: ReactNode;
  /** Optional icon before text */
  iconStart?: ReactNode;
  /** Optional icon after text */
  iconEnd?: ReactNode;
  /** Custom class name */
  className?: string;
}

// Variant styles
const variantStyles: Record<BadgeVariant, { bg: string; fg: string }> = {
  default: {
    bg: tokens.colors.badge.default.bg,
    fg: tokens.colors.badge.default.fg,
  },
  success: {
    bg: tokens.colors.badge.success.bg,
    fg: tokens.colors.badge.success.fg,
  },
  warning: {
    bg: tokens.colors.badge.warning.bg,
    fg: tokens.colors.badge.warning.fg,
  },
  error: {
    bg: tokens.colors.badge.error.bg,
    fg: tokens.colors.badge.error.fg,
  },
  info: {
    bg: tokens.colors.badge.info.bg,
    fg: tokens.colors.badge.info.fg,
  },
  // Semantic variants
  open: {
    bg: tokens.colors.badge.success.bg,
    fg: tokens.colors.badge.success.fg,
  },
  closed: {
    bg: tokens.colors.badge.default.bg,
    fg: tokens.colors.badge.default.fg,
  },
  merged: {
    bg: tokens.colors.alpha.magenta._14,
    fg: tokens.colors.accent.magenta,
  },
  alive: {
    bg: tokens.colors.alpha.green._12,
    fg: tokens.colors.accent.green,
  },
  dead: {
    bg: tokens.colors.alpha.red._12,
    fg: tokens.colors.accent.red,
  },
  running: {
    bg: tokens.colors.alpha.blue._15,
    fg: tokens.colors.accent.blue,
  },
  stopped: {
    bg: tokens.colors.badge.default.bg,
    fg: tokens.colors.text.muted,
  },
};

// Size styles
const sizeStyles: Record<BadgeSize, CSSProperties> = {
  xs: {
    padding: '1px 4px',
    fontSize: '10px',
    gap: '2px',
  },
  sm: {
    padding: `${tokens.spacing[0.5]}px ${tokens.spacing[1.5]}px`,
    fontSize: tokens.fontSize.xs,
    gap: `${tokens.spacing[0.5]}px`,
  },
  md: {
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
    fontSize: tokens.fontSize.xs,
    gap: `${tokens.spacing[0.5]}px`,
  },
  lg: {
    padding: `${tokens.spacing[1.5]}px ${tokens.spacing[3]}px`,
    fontSize: tokens.fontSize.sm,
    gap: `${tokens.spacing[1]}px`,
  },
};

// Base styles
const baseStyles: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: tokens.fontWeight.medium,
  lineHeight: tokens.lineHeight.none,
  borderRadius: tokens.radius.sm,
  fontFamily: tokens.fontFamily.sans,
  whiteSpace: 'nowrap',
};

// Pulse keyframes
const pulseKeyframes = `
@keyframes devel-badge-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}
`;

// Inject keyframes once
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = pulseKeyframes;
  document.head.appendChild(styleSheet);
}

/**
 * Status dot indicator.
 */
function StatusDot({
  color,
  size,
  pulse,
}: {
  color: string;
  size: BadgeSize;
  pulse?: boolean;
}) {
  const dotSize = size === 'xs' ? 4 : size === 'sm' ? 6 : size === 'lg' ? 10 : 8;

  return (
    <span
      style={{
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        animation: pulse ? 'devel-badge-pulse 2s ease-in-out infinite' : undefined,
      }}
    />
  );
}

/**
 * Badge component for status and category indicators.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Badge variant="success">Active</Badge>
 *
 * // With dot indicator
 * <Badge variant="warning" dot>Running</Badge>
 *
 * // Pulsing dot for live states
 * <Badge variant="success" dot pulse>Live</Badge>
 *
 * // Semantic variants
 * <Badge variant="open">Open</Badge>
 * <Badge variant="merged">Merged</Badge>
 * <Badge variant="alive">Alive</Badge>
 *
 * // With icons
 * <Badge variant="success" iconStart={<CheckIcon />}>Verified</Badge>
 * ```
 */
export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  rounded = false,
  outline = false,
  dotColor,
  children,
  iconStart,
  iconEnd,
  className,
}: BadgeProps) {
  const { bg, fg } = variantStyles[variant];

  const styles: CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    backgroundColor: outline ? 'transparent' : bg,
    color: outline ? bg : fg,
    border: outline ? `1px solid ${bg}` : 'none',
    borderRadius: rounded ? tokens.radius.full : tokens.radius.sm,
  };

  const dotFg = dotColor || (outline ? bg : fg);

  return (
    <span
      data-component="badge"
      data-variant={variant}
      data-size={size}
      data-dot={dot || undefined}
      data-pulse={pulse || undefined}
      data-rounded={rounded || undefined}
      data-outline={outline || undefined}
      role="status"
      aria-label={variant}
      style={styles}
      className={className}
    >
      {dot && <StatusDot color={dotFg} size={size} pulse={pulse} />}
      {iconStart}
      {children}
      {iconEnd}
    </span>
  );
}

export default Badge;
