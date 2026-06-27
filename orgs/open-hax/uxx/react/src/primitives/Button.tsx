/**
 * Button Component
 * 
 * Implements the button.edn contract.
 * Provides consistent button styling across React applications.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'className'> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state - shows spinner and disables click */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon before text */
  iconStart?: ReactNode;
  /** Icon after text */
  iconEnd?: ReactNode;
  /** Button content */
  children?: ReactNode;
}

// Variant styles using tokens
const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: tokens.colors.button.primary.bg,
    color: tokens.colors.button.primary.fg,
    border: 'none',
  },
  secondary: {
    backgroundColor: tokens.colors.button.secondary.bg,
    color: tokens.colors.button.secondary.fg,
    border: `1px solid ${tokens.colors.border.default}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: tokens.colors.button.ghost.fg,
    border: 'none',
  },
  danger: {
    backgroundColor: tokens.colors.button.danger.bg,
    color: tokens.colors.button.danger.fg,
    border: 'none',
  },
};

// Size styles using tokens
const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: `${tokens.spacing[1.5]}px ${tokens.spacing[3]}px`,
    fontSize: tokens.typography.bodySm.fontSize,
    gap: `${tokens.spacing[1]}px`,
  },
  md: {
    padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
    fontSize: tokens.typography.body.fontSize,
    gap: `${tokens.spacing[2]}px`,
  },
  lg: {
    padding: `${tokens.spacing[3]}px ${tokens.spacing[6]}px`,
    fontSize: tokens.typography.body.fontSize,
    gap: `${tokens.spacing[2]}px`,
  },
};

// Base styles
const baseStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: tokens.fontWeight.medium,
  lineHeight: tokens.lineHeight.none,
  borderRadius: tokens.radius.md,
  cursor: 'pointer',
  transition: tokens.transitions.colors,
  outline: 'none',
  fontFamily: tokens.fontFamily.sans,
};

// Loading spinner component
function LoadingSpinner({ size }: { size: ButtonSize }) {
  const spinnerSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  
  return (
    <svg
      width={spinnerSize}
      height={spinnerSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

/**
 * Button component with variants, sizes, and loading state.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={() => alert('Clicked!')}>
 *   Click me
 * </Button>
 * 
 * <Button variant="danger" loading>
 *   Deleting...
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      iconStart,
      iconEnd,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    
    const styles: React.CSSProperties = {
      ...baseStyles,
      ...variantStyles[variant],
      ...sizeStyles[size],
      width: fullWidth ? '100%' : undefined,
      opacity: isDisabled ? 0.6 : 1,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
    };
    
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        data-component="button"
        data-variant={variant}
        data-size={size}
        data-loading={loading || undefined}
        data-full-width={fullWidth || undefined}
        aria-busy={loading}
        style={styles}
        {...props}
      >
        {loading && <LoadingSpinner size={size} />}
        {!loading && iconStart}
        {children}
        {!loading && iconEnd}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
