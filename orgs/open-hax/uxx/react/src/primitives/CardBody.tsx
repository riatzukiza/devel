import type { CSSProperties, ReactNode } from 'react';

export interface CardBodyProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const baseStyles: CSSProperties = {
  flex: 1,
  minHeight: 0,
};

export function CardBody({ children, style, className }: CardBodyProps) {
  return (
    <div data-component="card-body" style={{ ...baseStyles, ...style }} className={className}>
      {children}
    </div>
  );
}

export default CardBody;
