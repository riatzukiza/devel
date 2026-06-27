/**
 * Textarea Component
 *
 * Styled multi-line text input matching the Input component's visual style.
 */

import {
  forwardRef,
  type CSSProperties,
  type TextareaHTMLAttributes,
} from 'react';
import { tokens } from '@open-hax/uxx/tokens';

export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaVariant = 'default' | 'filled' | 'unstyled';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Size of the textarea */
  size?: TextareaSize;
  /** Visual style variant */
  variant?: TextareaVariant;
  /** Whether the textarea has an error */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
}

const sizeStyles: Record<TextareaSize, CSSProperties> = {
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

const variantStyles: Record<TextareaVariant, CSSProperties> = {
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
  display: 'block',
  width: '100%',
  borderRadius: tokens.radius.md,
  border: `1px solid ${tokens.colors.border.default}`,
  color: tokens.colors.text.default,
  fontFamily: tokens.fontFamily.sans,
  lineHeight: tokens.lineHeight.normal,
  resize: 'vertical',
  transition: tokens.transitions.colors,
};

const errorBorderStyles: CSSProperties = {
  borderColor: tokens.colors.border.error,
};

const disabledStyles: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      variant = 'default',
      error = false,
      errorMessage,
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
      <div data-component="textarea-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[1]}px` }}>
        <textarea
          ref={ref}
          data-component="textarea"
          data-size={size}
          data-variant={variant}
          data-error={error || undefined}
          disabled={disabled}
          style={combinedStyles}
          className={className}
          {...rest}
        />
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

Textarea.displayName = 'Textarea';

export default Textarea;
