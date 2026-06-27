import type { CSSProperties, ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

export interface ModalHeaderProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const baseStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${tokens.spacing[4]}px ${tokens.spacing[5]}px`,
  borderBottom: `1px solid ${tokens.colors.border.default}`,
  fontWeight: tokens.fontWeight.semibold,
  fontSize: tokens.fontSize.lg,
  gap: `${tokens.spacing[2]}px`,
};

export function ModalHeader({ children, style, className }: ModalHeaderProps) {
  return (
    <div data-component="modal-header" style={{ ...baseStyles, ...style }} className={className}>
      {children}
    </div>
  );
}

export default ModalHeader;
