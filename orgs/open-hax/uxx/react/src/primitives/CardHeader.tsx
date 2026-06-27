import type { CSSProperties, ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

export interface CardHeaderProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const baseStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
  borderBottom: `1px solid ${tokens.colors.border.default}`,
  fontWeight: tokens.fontWeight.semibold,
  fontSize: tokens.fontSize.lg,
  gap: `${tokens.spacing[2]}px`,
};

export function CardHeader({ children, style, className }: CardHeaderProps) {
  return (
    <div data-component="card-header" style={{ ...baseStyles, ...style }} className={className}>
      {children}
    </div>
  );
}

export default CardHeader;
