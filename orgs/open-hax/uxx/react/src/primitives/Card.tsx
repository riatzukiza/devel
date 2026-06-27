/**
 * Card Component
 * 
 * Implements the card.edn contract.
 * Versatile card container with optional header, title, and footer sections.
 */

import { forwardRef, type ReactNode, type MouseEvent, type KeyboardEvent } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type CardVariant = 'default' | 'outlined' | 'elevated';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

export interface CardProps {
  /** Visual style variant */
  variant?: CardVariant;
  /** Whether card has interactive hover/focus states */
  interactive?: boolean;
  /** Internal padding size */
  padding?: CardPadding;
  /** Border radius size */
  radius?: CardRadius;
  /** Click handler for interactive cards */
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  /** Header slot */
  header?: ReactNode;
  /** Title text (rendered in header if no header slot) */
  title?: string;
  /** Extra header content (e.g., actions) */
  extra?: ReactNode;
  /** Main content */
  children?: ReactNode;
  /** Footer slot */
  footer?: ReactNode;
  /** Override inline styles */
  style?: React.CSSProperties;
}

// Variant styles using tokens
const variantStyles: Record<CardVariant, React.CSSProperties> = {
  default: {
    backgroundColor: tokens.colors.background.surface,
    border: `1px solid ${tokens.colors.border.default}`,
    boxShadow: tokens.shadow.sm,
  },
  outlined: {
    backgroundColor: 'transparent',
    border: `1px solid ${tokens.colors.border.default}`,
    boxShadow: tokens.shadow.none,
  },
  elevated: {
    backgroundColor: tokens.colors.background.elevated,
    border: `1px solid ${tokens.colors.border.subtle}`,
    boxShadow: tokens.shadow.md,
  },
};

// Padding styles using tokens
const paddingStyles: Record<CardPadding, React.CSSProperties> = {
  none: { padding: 0 },
  sm: { padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px` },
  md: { padding: `${tokens.spacing[4]}px ${tokens.spacing[5]}px` },
  lg: { padding: `${tokens.spacing[6]}px ${tokens.spacing[8]}px` },
};

// Radius styles using tokens
const radiusStyles: Record<CardRadius, string> = {
  none: tokens.radius.none,
  sm: tokens.radius.sm,
  md: tokens.radius.md,
  lg: tokens.radius.lg,
  full: tokens.radius.full,
};

// Base styles
const baseStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  transition: tokens.transitions.colors,
  fontFamily: tokens.fontFamily.sans,
  overflow: 'hidden',
};

// Header styles
const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
  borderBottom: `1px solid ${tokens.colors.border.default}`,
  fontWeight: tokens.fontWeight.semibold,
  fontSize: tokens.fontSize.lg,
};

// Body styles
const bodyStyles: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
};

// Footer styles
const footerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: `${tokens.spacing[2]}px`,
  padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
  borderTop: `1px solid ${tokens.colors.border.default}`,
};

/**
 * Card component for containing content with optional header and footer.
 * 
 * @example
 * ```tsx
 * <Card variant="elevated" title="Card Title">
 *   Main content goes here
 * </Card>
 * 
 * <Card interactive onClick={() => console.log('clicked')}>
 *   <Badge variant="success">Active</Badge>
 *   Card body
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
      {
      variant = 'default',
      interactive = false,
      padding = 'md',
      radius = 'md',
      header,
      title,
      extra,
      children,
      footer,
      onClick,
      style: overrideStyle,
    },
    ref
  ) => {
    const isInteractive = interactive || typeof onClick === 'function';
    
    const paddingValue = paddingStyles[padding].padding;
    
    const styles: React.CSSProperties = {
      ...baseStyles,
      ...variantStyles[variant],
      padding: header || footer ? undefined : paddingValue,
      borderRadius: radiusStyles[radius],
      cursor: isInteractive ? 'pointer' : 'default',
    };
    
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick?.({
          ...event,
          currentTarget: event.currentTarget,
        } as unknown as MouseEvent<HTMLDivElement>);
      }
    };
    
    const hasHeader = header !== undefined || title !== undefined || extra !== undefined;
    
    const bodyPadding = hasHeader || footer ? paddingStyles[padding].padding : undefined;
    
    return (
      <div
        ref={ref}
        data-component="card"
        data-variant={variant}
        data-interactive={isInteractive || undefined}
        role={isInteractive ? 'button' : 'region'}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={isInteractive ? onClick : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        style={{ ...styles, ...overrideStyle }}
      >
        {hasHeader && (
          <div style={headerStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
              {header}
              {title && !header && <span>{title}</span>}
            </div>
            {extra && <div>{extra}</div>}
          </div>
        )}
        
        <div style={{ ...bodyStyles, padding: bodyPadding }}>
          {children}
        </div>
        
        {footer !== undefined && (
          <div style={footerStyles}>{footer}</div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
