import type { CSSProperties, ReactNode } from 'react';

import { tokens } from '@open-hax/uxx/tokens';

import { Spinner } from './Spinner.js';

export interface DataTableColumn<T> {
  readonly key: string;
  readonly header: string;
  readonly render?: (row: T) => ReactNode;
  readonly width?: string;
  readonly align?: 'left' | 'center' | 'right';
}

export interface DataTableShellProps<T> {
  readonly columns: readonly DataTableColumn<T>[];
  readonly rows: readonly T[];
  readonly rowKey: (row: T, index: number) => string;
  readonly loading?: boolean;
  readonly emptyState?: ReactNode;
  readonly wide?: boolean;
  readonly dense?: boolean;
  readonly stickyHeader?: boolean;
  readonly maxHeight?: string;
}

const tableWrapStyles: CSSProperties = {
  overflowX: 'auto',
};

const tableStyles: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: tokens.fontFamily.sans,
  fontSize: tokens.fontSize.sm,
};

const denseTableStyles: CSSProperties = {
  fontSize: tokens.fontSize.xs,
};

const wideTableStyles: CSSProperties = {
  minWidth: '800px',
};

const thStyles: CSSProperties = {
  textAlign: 'left',
  padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
  fontWeight: tokens.fontWeight.semibold,
  color: tokens.colors.text.muted,
  fontSize: 'inherit',
  borderBottom: `1px solid ${tokens.colors.border.default}`,
  whiteSpace: 'nowrap',
};

const stickyThStyles: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  backgroundColor: tokens.colors.background.surface,
};

const tdStyles: CSSProperties = {
  padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
  borderBottom: `1px solid ${tokens.colors.border.subtle}`,
  color: tokens.colors.text.default,
  verticalAlign: 'middle',
};

const denseTdStyles: CSSProperties = {
  padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
};

const emptyStateStyles: CSSProperties = {
  textAlign: 'center',
  padding: `${tokens.spacing[8]}px ${tokens.spacing[4]}px`,
  color: tokens.colors.text.muted,
  fontSize: tokens.fontSize.sm,
};

const loadingOverlayStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${tokens.spacing[8]}px`,
  color: tokens.colors.text.muted,
};

export function DataTableShell<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyState,
  wide = false,
  dense = false,
  stickyHeader = true,
  maxHeight,
}: DataTableShellProps<T>) {
  const wrapStyle: CSSProperties = {
    ...tableWrapStyles,
    ...(maxHeight ? { maxHeight, overflowY: 'auto' } : {}),
  };

  const tableStyle: CSSProperties = {
    ...tableStyles,
    ...(wide ? wideTableStyles : {}),
    ...(dense ? denseTableStyles : {}),
  };

  if (loading) {
    return (
      <div data-component="data-table-shell" data-state="loading" style={loadingOverlayStyles}>
        <Spinner size="md" label="Loading data…" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div data-component="data-table-shell" data-state="empty" style={emptyStateStyles}>
        {emptyState ?? 'No data available.'}
      </div>
    );
  }

  return (
    <div
      data-component="data-table-shell"
      data-wide={wide || undefined}
      data-dense={dense || undefined}
      style={wrapStyle}
    >
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  ...thStyles,
                  ...(stickyHeader ? stickyThStyles : {}),
                  ...(col.width ? { width: col.width } : {}),
                  ...(col.align ? { textAlign: col.align } : {}),
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    ...tdStyles,
                    ...(dense ? denseTdStyles : {}),
                    ...(col.align ? { textAlign: col.align } : {}),
                  }}
                >
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTableShell;
