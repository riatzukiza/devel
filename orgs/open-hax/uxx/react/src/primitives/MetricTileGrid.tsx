import type { CSSProperties, ReactNode } from 'react';

import { tokens } from '@open-hax/uxx/tokens';

export interface MetricTileGridProps {
  readonly children: ReactNode;
  readonly minWidth?: number;
  readonly className?: string;
}

export function MetricTileGrid({ children, minWidth = 140, className }: MetricTileGridProps) {
  const style: CSSProperties = className
    ? { gap: `${tokens.spacing[2.5]}px` }
    : {
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
        gap: `${tokens.spacing[2.5]}px`,
      };

  return (
    <section
      data-component="metric-tile-grid"
      className={className}
      style={style}
    >
      {children}
    </section>
  );
}

export default MetricTileGrid;
