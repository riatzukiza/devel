import type { CSSProperties, ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

export interface CardFooterProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const baseStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: `${tokens.spacing[2]}px`,
  padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
  borderTop: `1px solid ${tokens.colors.border.default}`,
};

export function CardFooter({ children, style, className }: CardFooterProps) {
  return (
    <div data-component="card-footer" style={{ ...baseStyles, ...style }} className={className}>
      {children}
    </div>
  );
}

export default CardFooter;
