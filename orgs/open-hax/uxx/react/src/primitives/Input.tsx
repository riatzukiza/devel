/**
 * Input Component
 * 
 * Implements the input.edn contract.
 * Text input field with validation states, icons, and sizing.
 */

import { 
  forwardRef, 
  useState,
  type ChangeEvent, 
  type FocusEvent,
  type KeyboardEvent,
  type CSSProperties
} from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type InputType = 'text' | 'password' | 'email' | 'number' | 'search' | 'url' | 'tel';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'unstyled';

export interface InputProps {
  /** Type of input */
  type?: InputType;
  /** Current value */
  value?: string;
  /** Default value for uncontrolled input */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Size of the input */
  size?: InputSize;
  /** Visual style variant */
  variant?: InputVariant;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is read-only */
  readonly?: boolean;
  /** Whether the input is required */
  required?: boolean;
  /** Whether the input has an error */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Icon to display on the left */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right */
  rightIcon?: React.ReactNode;
  /** Change event handler */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Focus event handler */
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Blur event handler */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Keyboard event handler */
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Input name */
  name?: string;
  /** Input ID */
  id?: string;
  /** Auto focus */
  autoFocus?: boolean;
  /** Auto complete */
  autoComplete?: string;
  /** Max length */
  maxLength?: number;
  /** Min length */
  minLength?: number;
  /** Pattern */
  pattern?: string;
}

// Size styles
const sizeStyles: Record<InputSize, CSSProperties> = {
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

// Variant styles
const variantStyles: Record<InputVariant, CSSProperties> = {
  default: {
    backgroundColor: tokens.colors.background.default,
    border: `1px solid ${tokens.colors.border.default}`,
  },
  filled: {
    backgroundColor: tokens.colors.background.surface,
    border: '1px solid transparent',
  },
  unstyled: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
  },
};

// Base input styles
const baseStyles: CSSProperties = {
  width: '100%',
  fontFamily: tokens.fontFamily.sans,
  color: tokens.colors.text.default,
  borderRadius: tokens.radius.sm,
  outline: 'none',
  transition: tokens.transitions.colors,
};

// Error styles
const errorStyles: CSSProperties = {
  borderColor: tokens.colors.border.error,
};

// Disabled styles
const disabledStyles: CSSProperties = {
  backgroundColor: tokens.colors.background.surface,
  color: tokens.colors.text.muted,
  cursor: 'not-allowed',
  opacity: 0.7,
};

// Focus styles
const focusStyles: CSSProperties = {
  borderColor: tokens.colors.border.focus,
  boxShadow: `0 0 0 2px ${tokens.colors.alpha.blue._35}`,
};

// Icon wrapper styles
const iconWrapperStyles: CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: tokens.colors.text.muted,
  pointerEvents: 'none',
};

// Error message styles
const errorMessageStyles: CSSProperties = {
  fontSize: tokens.fontSize.xs,
  color: tokens.colors.border.error,
  marginTop: `${tokens.spacing[1]}px`,
};

/**
 * Text input field with validation states, icons, and sizing.
 * 
 * @example
 * ```tsx
 * <Input placeholder="Enter your name" />
 * 
 * <Input 
 *   type="email" 
 *   placeholder="Email" 
 *   leftIcon={<EmailIcon />}
 *   error
 *   errorMessage="Invalid email format"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      value,
      defaultValue,
      placeholder,
      size = 'md',
      variant = 'default',
      disabled = false,
      readonly = false,
      required = false,
      error = false,
      errorMessage,
      leftIcon,
      rightIcon,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      name,
      id,
      autoFocus,
      autoComplete,
      maxLength,
      minLength,
      pattern,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const inputStyles: CSSProperties = {
      ...baseStyles,
      ...variantStyles[variant],
      ...(variant !== 'unstyled' ? sizeStyles[size] : {}),
      ...(error ? errorStyles : {}),
      ...(disabled ? disabledStyles : {}),
      ...(isFocused && !disabled && variant !== 'unstyled' ? focusStyles : {}),
      paddingLeft: leftIcon && variant !== 'unstyled' ? '32px' : undefined,
      paddingRight: rightIcon && variant !== 'unstyled' ? '32px' : undefined,
    };

    const wrapperStyles: CSSProperties = {
      position: 'relative',
      width: '100%',
    };

    return (
      <div style={wrapperStyles}>
        {leftIcon && variant !== 'unstyled' && (
          <div style={{ ...iconWrapperStyles, left: `${tokens.spacing[2]}px` }}>
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          data-component="input"
          data-size={size}
          data-variant={variant}
          data-error={error || undefined}
          data-disabled={disabled || undefined}
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          name={name}
          id={id}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          style={inputStyles}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          aria-invalid={error}
          aria-describedby={error && errorMessage ? `${id}-error` : undefined}
        />
        {rightIcon && variant !== 'unstyled' && (
          <div style={{ ...iconWrapperStyles, right: `${tokens.spacing[2]}px` }}>
            {rightIcon}
          </div>
        )}
        {error && errorMessage && (
          <div 
            id={`${id}-error`}
            style={errorMessageStyles}
            role="alert"
          >
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
