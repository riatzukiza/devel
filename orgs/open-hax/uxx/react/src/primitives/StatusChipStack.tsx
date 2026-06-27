import type { CSSProperties, ReactNode } from 'react';

import { tokens } from '@open-hax/uxx/tokens';

import { Badge, type BadgeVariant } from './Badge.js';

export interface StatusChipItem {
  readonly label: string;
  readonly variant?: BadgeVariant;
  readonly icon?: ReactNode;
}

export interface StatusChipStackProps {
  readonly items: readonly StatusChipItem[];
  readonly size?: 'xs' | 'sm' | 'md';
  readonly separator?: ReactNode;
}

const sizeGap: Record<string, number> = {
  xs: 4,
  sm: 6,
  md: 8,
};

export function StatusChipStack({ items, size = 'sm', separator = '·' }: StatusChipStackProps) {
  const style: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${sizeGap[size]}px`,
  };

  const sepStyle: CSSProperties = {
    color: tokens.colors.text.muted,
    fontSize: tokens.fontSize.xs,
    userSelect: 'none',
  };

  return (
    <div data-component="status-chip-stack" data-size={size} style={style}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: `${tokens.spacing[1]}px` }}>
          <Badge variant={item.variant ?? 'default'} size={size} iconStart={item.icon}>
            {item.label}
          </Badge>
          {index < items.length - 1 && <span style={sepStyle}>{separator}</span>}
        </span>
      ))}
    </div>
  );
}

export default StatusChipStack;
