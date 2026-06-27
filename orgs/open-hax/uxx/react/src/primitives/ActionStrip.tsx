import type { CSSProperties, ReactNode } from 'react';

import { tokens } from '@open-hax/uxx/tokens';

export interface ActionStripProps {
  readonly children: ReactNode;
  readonly align?: 'start' | 'end' | 'center';
}

const alignMap: Record<string, CSSProperties['justifyContent']> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
};

export function ActionStrip({ children, align = 'end' }: ActionStripProps) {
  const style: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${tokens.spacing[2]}px`,
    justifyContent: alignMap[align],
  };

  return (
    <div data-component="action-strip" style={style}>
      {children}
    </div>
  );
}

export default ActionStrip;
