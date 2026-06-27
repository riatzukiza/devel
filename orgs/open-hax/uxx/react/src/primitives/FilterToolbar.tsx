import type { CSSProperties, ReactNode } from 'react';

import { tokens } from '@open-hax/uxx/tokens';

export interface FilterToolbarProps {
  readonly children: ReactNode;
  readonly dense?: boolean;
}

const baseStyles: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${tokens.spacing[2]}px`,
  padding: `${tokens.spacing[2]}px 0`,
};

const denseStyles: CSSProperties = {
  gap: `${tokens.spacing[1.5]}px`,
  padding: `${tokens.spacing[1]}px 0`,
};

export function FilterToolbar({ children, dense = false }: FilterToolbarProps) {
  return (
    <div
      data-component="filter-toolbar"
      data-dense={dense || undefined}
      style={{ ...baseStyles, ...(dense ? denseStyles : {}) }}
    >
      {children}
    </div>
  );
}

export default FilterToolbar;
