/**
 * Select Component
 *
 * Styled dropdown select matching the Input component's visual style.
 */

import {
  forwardRef,
  type CSSProperties,
  type SelectHTMLAttributes,
} from 'react';
import { tokens } from '@open-hax/uxx/tokens';

export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectVariant = 'default' | 'filled' | 'unstyled';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Size of the select */
  size?: SelectSize;
  /** Visual style variant */
  variant?: SelectVariant;
  /** Whether the select has an error */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Options to render */
  options?: readonly SelectOption[];
  /** Placeholder option text (renders as first disabled option) */
  placeholder?: string;
}

const sizeStyles: Record<SelectSize, CSSProperties> = {
  sm: {
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
    fontSize: tokens.fontSize.sm,
  },
  md: {
    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
    fontSize: tokens.fontSize.base,
  },
  lg: {
    padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
    fontSize: tokens.fontSize.lg,
  },
};

const variantStyles: Record<SelectVariant, CSSProperties> = {
  default: {
    backgroundColor: 'transparent',
  },
  filled: {
    backgroundColor: tokens.colors.background.surface,
  },
  unstyled: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
  },
};

const baseStyles: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: tokens.radius.md,
  border: `1px solid ${tokens.colors.border.default}`,
  color: tokens.colors.text.default,
  fontFamily: tokens.fontFamily.sans,
  lineHeight: tokens.lineHeight.normal,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%2375715e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: `right ${tokens.spacing[2]}px center`,
  paddingRight: `${tokens.spacing[6]}px`,
  transition: tokens.transitions.colors,
};

const errorBorderStyles: CSSProperties = {
  borderColor: tokens.colors.border.error,
};

const disabledStyles: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      variant = 'default',
      error = false,
      errorMessage,
      options,
      placeholder,
      children,
      className,
      disabled,
      style,
      ...rest
    },
    ref,
  ) => {
    const combinedStyles: CSSProperties = {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(error ? errorBorderStyles : {}),
      ...(disabled ? disabledStyles : {}),
      ...style,
    };

    return (
      <div data-component="select-wrapper" style={{ display: 'inline-flex', flexDirection: 'column', gap: `${tokens.spacing[1]}px` }}>
        <select
          ref={ref}
          data-component="select"
          data-size={size}
          data-variant={variant}
          data-error={error || undefined}
          disabled={disabled}
          style={combinedStyles}
          className={className}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        {error && errorMessage && (
          <span
            style={{
              fontSize: tokens.fontSize.xs,
              color: tokens.colors.accent.red,
            }}
          >
            {errorMessage}
          </span>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;
