import type { CSSProperties, ReactNode } from 'react';

import { tokens } from '@open-hax/uxx/tokens';

export interface PanelHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly kicker?: string;
  readonly meta?: ReactNode;
  readonly actions?: ReactNode;
}

const rootStyles: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: `${tokens.spacing[3]}px`,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
};

const copyStyles: CSSProperties = {
  display: 'grid',
  gap: `${tokens.spacing[1]}px`,
  minWidth: 0,
};

const kickerStyles: CSSProperties = {
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontSize: tokens.fontSize.xs,
  color: tokens.colors.accent.cyan,
  fontWeight: tokens.fontWeight.semibold,
};

const titleStyles: CSSProperties = {
  margin: 0,
  fontSize: tokens.fontSize.xl,
  color: tokens.colors.text.default,
};

const descriptionStyles: CSSProperties = {
  margin: 0,
  color: tokens.colors.text.muted,
  fontSize: tokens.fontSize.sm,
  lineHeight: tokens.lineHeight.relaxed,
};

const actionsStyles: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${tokens.spacing[2]}px`,
  alignItems: 'center',
};

export function PanelHeader({ title, description, kicker, meta, actions }: PanelHeaderProps) {
  return (
    <div data-component="panel-header" style={rootStyles}>
      <div style={copyStyles}>
        {kicker ? <p style={kickerStyles}>{kicker}</p> : null}
        <h3 style={titleStyles}>{title}</h3>
        {description ? <p style={descriptionStyles}>{description}</p> : null}
        {meta}
      </div>
      {actions ? <div style={actionsStyles}>{actions}</div> : null}
    </div>
  );
}

export default PanelHeader;
