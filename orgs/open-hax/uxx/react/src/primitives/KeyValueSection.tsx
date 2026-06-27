/**
 * KeyValueSection Component
 *
 * Implements the key-value-section.spec.md contract.
 * Displays key-value pairs in structured layouts with consistent formatting.
 */

import {
  useMemo,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type KeyValueLayout = 'vertical' | 'grid' | 'inline';
export type KeyValueGap = 'sm' | 'md' | 'lg';
export type KeyValueTitleSize = 'sm' | 'md' | 'lg';

export interface KeyValueEntry {
  /** Label text */
  label: string;
  /** Value - can be string, number, or ReactNode for complex rendering */
  value: ReactNode;
  /** Optional icon before label */
  icon?: ReactNode;
  /** Optional badge after value */
  badge?: string;
  /** Optional tooltip for label */
  tooltip?: string;
  /** Whether to hide if value is empty/null */
  hideIfEmpty?: boolean;
  /** Optional key for React list rendering */
  key?: string;
}

export interface KeyValueSectionProps {
  /** Key-value entries */
  entries: KeyValueEntry[];
  /** Layout direction */
  layout?: KeyValueLayout;
  /** Number of columns for grid layout */
  columns?: number;
  /** Whether to show dividers between entries */
  dividers?: boolean;
  /** Label width for inline layout */
  labelWidth?: string | number;
  /** Gap between entries */
  gap?: KeyValueGap;
  /** Section title (optional) */
  title?: string;
  /** Section title size */
  titleSize?: KeyValueTitleSize;
  /** Empty state message when no entries */
  emptyMessage?: string;
  /** Custom class name */
  className?: string;
}

// Gap sizes
const gapSizes: Record<KeyValueGap, number> = {
  sm: tokens.spacing[2],
  md: tokens.spacing[4],
  lg: tokens.spacing[6],
};

// Title sizes
const titleSizes: Record<KeyValueTitleSize, CSSProperties> = {
  sm: {
    fontSize: tokens.fontSize.sm,
    marginBottom: `${tokens.spacing[2]}px`,
  },
  md: {
    fontSize: tokens.fontSize.base,
    marginBottom: `${tokens.spacing[3]}px`,
  },
  lg: {
    fontSize: tokens.fontSize.lg,
    marginBottom: `${tokens.spacing[4]}px`,
  },
};

// Base styles
const containerStyles: CSSProperties = {
  width: '100%',
  fontFamily: tokens.fontFamily.sans,
};

const titleStyles: CSSProperties = {
  fontWeight: tokens.fontWeight.semibold,
  color: tokens.colors.text.default,
  margin: 0,
};

const entriesContainerStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const entryStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${tokens.spacing[1]}px`,
};

const entryInlineStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
};

const entryRowStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: `${tokens.spacing[2]}px`,
};

const labelStyles: CSSProperties = {
  fontSize: tokens.fontSize.sm,
  fontWeight: tokens.fontWeight.medium,
  color: tokens.colors.text.muted,
};

const valueStyles: CSSProperties = {
  fontSize: tokens.fontSize.sm,
  color: tokens.colors.text.default,
};

const badgeStyles: CSSProperties = {
  fontSize: tokens.fontSize.xs,
  fontWeight: tokens.fontWeight.medium,
  color: tokens.colors.text.muted,
  padding: `${tokens.spacing[0.5]}px ${tokens.spacing[1]}px`,
  backgroundColor: tokens.colors.background.surface,
  borderRadius: `${tokens.spacing[0.5]}px`,
  marginLeft: `${tokens.spacing[2]}px`,
};

const dividerStyles: CSSProperties = {
  borderBottom: `1px solid ${tokens.colors.border.default}`,
  marginBottom: `${tokens.spacing[2]}px`,
  paddingBottom: `${tokens.spacing[2]}px`,
};

const emptyStyles: CSSProperties = {
  fontSize: tokens.fontSize.sm,
  color: tokens.colors.text.muted,
  fontStyle: 'italic',
};

/**
 * Check if a value is considered empty.
 */
function isEmptyValue(value: ReactNode): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

/**
 * KeyValueSection - displays key-value pairs in structured layouts.
 *
 * @example
 * ```tsx
 * <KeyValueSection
 *   title="Actor Information"
 *   entries={[
 *     { label: "ID", value: actor.id },
 *     { label: "Status", value: actor.status },
 *     { label: "Uptime", value: "2d 4h" },
 *   ]}
 * />
 *
 * <KeyValueSection
 *   layout="grid"
 *   columns={2}
 *   entries={[
 *     { label: "CPU", value: "45%", icon: <CpuIcon /> },
 *     { label: "Memory", value: "2.1 GB", icon: <MemoryIcon /> },
 *   ]}
 * />
 * ```
 */
export function KeyValueSection({
  entries,
  layout = 'vertical',
  columns = 2,
  dividers = false,
  labelWidth = 120,
  gap = 'md',
  title,
  titleSize = 'md',
  emptyMessage,
  className,
}: KeyValueSectionProps) {
  // Filter entries based on hideIfEmpty
  const visibleEntries = useMemo(() => {
    return entries.filter(entry => {
      if (!entry.hideIfEmpty) return true;
      return !isEmptyValue(entry.value);
    });
  }, [entries]);

  // Compute styles based on layout
  const computedContainerStyles: CSSProperties = {
    ...containerStyles,
    ...(layout === 'grid' ? { display: 'grid', gap: `${gapSizes[gap]}px` } : {}),
  };

  const computedEntriesStyles: CSSProperties = {
    ...entriesContainerStyles,
    gap: `${gapSizes[gap]}px`,
    ...(layout === 'grid' ? {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
    } : {}),
  };

  const computedTitleStyles: CSSProperties = {
    ...titleStyles,
    ...titleSizes[titleSize],
  };

  // Render empty state
  if (visibleEntries.length === 0 && emptyMessage) {
    return (
      <div style={containerStyles} className={className}>
        {title && <h3 style={computedTitleStyles}>{title}</h3>}
        <p style={emptyStyles}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={computedContainerStyles} className={className}>
      {title && <h3 style={computedTitleStyles}>{title}</h3>}

      <div style={computedEntriesStyles}>
        {visibleEntries.map((entry, index) => {
          const key = entry.key || entry.label || index;
          const isLast = index === visibleEntries.length - 1;
          const showDivider = dividers && !isLast && layout === 'vertical';

          const entryBaseStyles: CSSProperties = layout === 'inline'
            ? entryInlineStyles
            : entryStyles;

          return (
            <div
              key={key}
              style={{
                ...entryBaseStyles,
                ...(showDivider ? dividerStyles : {}),
              }}
              data-component="key-value-entry"
            >
              <div style={entryRowStyles}>
                {entry.icon && <span aria-hidden="true">{entry.icon}</span>}
                <label
                  style={{
                    ...labelStyles,
                    ...(layout === 'inline' ? { minWidth: typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth } : {}),
                  }}
                  title={entry.tooltip}
                >
                  {entry.label}
                </label>
              </div>
              <div style={{ ...valueStyles, ...(layout === 'inline' ? { flex: 1 } : {}) }}>
                {entry.value}
                {entry.badge && <span style={badgeStyles}>{entry.badge}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KeyValueSection;
