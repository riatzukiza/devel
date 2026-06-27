import type { CSSProperties, ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

export interface ModalBodyProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const baseStyles: CSSProperties = {
  flex: 1,
  padding: `${tokens.spacing[4]}px ${tokens.spacing[5]}px`,
  overflowY: 'auto',
};

export function ModalBody({ children, style, className }: ModalBodyProps) {
  return (
    <div data-component="modal-body" style={{ ...baseStyles, ...style }} className={className}>
      {children}
    </div>
  );
}

export default ModalBody;
