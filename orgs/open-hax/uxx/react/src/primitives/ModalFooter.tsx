import type { CSSProperties, ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

export interface ModalFooterProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const baseStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: `${tokens.spacing[2]}px`,
  padding: `${tokens.spacing[3]}px ${tokens.spacing[5]}px`,
  borderTop: `1px solid ${tokens.colors.border.default}`,
};

export function ModalFooter({ children, style, className }: ModalFooterProps) {
  return (
    <div data-component="modal-footer" style={{ ...baseStyles, ...style }} className={className}>
      {children}
    </div>
  );
}

export default ModalFooter;
