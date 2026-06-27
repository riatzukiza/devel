import type { CSSProperties, ReactNode } from 'react';

import { tokens } from '@open-hax/uxx/tokens';

import { Card } from './Card.js';
import { Spinner } from './Spinner.js';

export type MetricTileVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

export interface MetricTileSparkPoint {
  readonly value: number;
  readonly label?: string;
}

export interface MetricTileProps {
  readonly label: string;
  readonly value: string | number | ReactNode;
  readonly detail?: string | ReactNode;
  readonly loading?: boolean;
  readonly variant?: MetricTileVariant;
  readonly sparkbar?: readonly MetricTileSparkPoint[];
}

const toneBorder: Record<MetricTileVariant, string> = {
  default: tokens.colors.border.default,
  info: tokens.colors.badge.info.fg,
  success: tokens.colors.badge.success.fg,
  warning: tokens.colors.badge.warning.fg,
  error: tokens.colors.badge.error.fg,
};

const rootStyles: CSSProperties = {
  display: 'grid',
  gap: `${tokens.spacing[1.5]}px`,
};

const labelStyles: CSSProperties = {
  color: tokens.colors.text.muted,
  fontSize: tokens.fontSize.sm,
};

const valueStyles: CSSProperties = {
  fontSize: tokens.fontSize['2xl'],
  fontWeight: tokens.fontWeight.semibold,
  color: tokens.colors.text.default,
  lineHeight: tokens.lineHeight.tight,
};

const detailStyles: CSSProperties = {
  color: tokens.colors.text.muted,
  fontSize: tokens.fontSize.sm,
};

const sparkbarContainerStyles: CSSProperties = {
  height: '32px',
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: 'minmax(0, 1fr)',
  alignItems: 'end',
  gap: `${tokens.spacing[1]}px`,
};

const sparkbarBarStyles: CSSProperties = {
  borderRadius: '9999px 9999px 3px 3px',
  background: `linear-gradient(180deg, ${tokens.colors.accent.blue}, ${tokens.colors.alpha.blue._35})`,
};

export function MetricTile({
  label,
  value,
  detail,
  loading = false,
  variant = 'default',
  sparkbar,
}: MetricTileProps) {
  const max = sparkbar ? sparkbar.reduce((current, point) => Math.max(current, point.value), 0) : 0;

  return (
    <Card
      variant="elevated"
      padding="md"
      style={{ borderColor: toneBorder[variant] }}
    >
      <div data-component="metric-tile" data-variant={variant} style={rootStyles}>
        <span style={labelStyles}>{label}</span>
        <strong style={valueStyles}>{loading ? <Spinner size="sm" /> : value}</strong>
        {detail ? <small style={detailStyles}>{detail}</small> : null}
        {sparkbar && sparkbar.length > 0 && (
          <div style={sparkbarContainerStyles} aria-hidden="true">
            {sparkbar.map((point, index) => {
              const height = max > 0 ? Math.max((point.value / max) * 100, 8) : 8;
              return (
                <span
                  key={point.label ?? index}
                  style={{ ...sparkbarBarStyles, height: `${height}%` }}
                />
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

export default MetricTile;
