import type { CSSProperties, ReactNode } from 'react';

import { tokens } from '@open-hax/uxx/tokens';

import { Card, type CardVariant } from './Card.js';
import { Badge, type BadgeVariant } from './Badge.js';

export type SurfaceHeroTone = 'default' | 'info' | 'success' | 'warning' | 'error';

export interface SurfaceHeroStat {
  readonly label: string;
  readonly value: string | number;
  readonly tone?: SurfaceHeroTone;
}

export interface SurfaceHeroProps {
  readonly kicker?: string;
  readonly title: string;
  readonly description?: string;
  readonly stats?: readonly SurfaceHeroStat[];
  readonly actions?: ReactNode;
  readonly variant?: 'default' | 'elevated';
}

const rootStyles: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: `${tokens.spacing[4]}px`,
  alignItems: 'center',
};

const titleColumnStyles: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gap: `${tokens.spacing[1]}px`,
};

const kickerStyles: CSSProperties = {
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  fontSize: tokens.fontSize.xs,
  color: tokens.colors.accent.cyan,
  fontWeight: tokens.fontWeight.semibold,
};

const titleStyles: CSSProperties = {
  margin: 0,
  fontSize: tokens.fontSize['2xl'],
  lineHeight: tokens.lineHeight.tight,
  color: tokens.colors.text.default,
};

const descriptionStyles: CSSProperties = {
  margin: 0,
  color: tokens.colors.text.muted,
  fontSize: tokens.fontSize.base,
  lineHeight: tokens.lineHeight.relaxed,
};

const asideStyles: CSSProperties = {
  display: 'grid',
  gap: `${tokens.spacing[2]}px`,
  justifyItems: 'end',
  minWidth: '220px',
};

const statsWrapStyles: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${tokens.spacing[2]}px`,
  justifyContent: 'flex-end',
};

function toneToBadgeVariant(tone: SurfaceHeroTone | undefined): BadgeVariant {
  switch (tone) {
    case 'info':
      return 'info';
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
}

export function SurfaceHero({
  kicker,
  title,
  description,
  stats = [],
  actions,
  variant = 'elevated',
}: SurfaceHeroProps) {
  const cardVariant: CardVariant = variant === 'default' ? 'default' : 'elevated';

  return (
    <Card variant={cardVariant} padding="md" radius="lg">
      <div data-component="surface-hero" data-variant={variant} style={rootStyles}>
        <div style={titleColumnStyles}>
          {kicker ? <p style={kickerStyles}>{kicker}</p> : null}
          <h2 style={titleStyles}>{title}</h2>
          {description ? <p style={descriptionStyles}>{description}</p> : null}
        </div>

        {(stats.length > 0 || actions) ? (
          <div style={asideStyles}>
            {stats.length > 0 ? (
              <div style={statsWrapStyles}>
                {stats.map((stat) => (
                  <Badge key={`${stat.label}:${stat.value}`} variant={toneToBadgeVariant(stat.tone)}>
                    {`${stat.value}${stat.label ? ` ${stat.label}` : ''}`}
                  </Badge>
                ))}
              </div>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export default SurfaceHero;
