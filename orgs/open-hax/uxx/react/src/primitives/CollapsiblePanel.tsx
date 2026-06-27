/**
 * CollapsiblePanel Component
 * 
 * Implements the collapsible-panel.spec.md contract.
 * Expandable/collapsible content section with animated header.
 */

import {
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type CollapsiblePanelVariant = 'default' | 'outlined' | 'elevated';

export interface CollapsiblePanelStat {
  /** Stat label */
  label: string;
  /** Stat value */
  value: string | number;
  /** Optional color override */
  color?: string;
}

export interface CollapsiblePanelProps {
  /** Panel title */
  title: string;
  /** Optional count badge */
  count?: number;
  /** Whether panel starts collapsed */
  defaultCollapsed?: boolean;
  /** Controlled collapse state */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
  /** Panel content */
  children: ReactNode;
  /** Optional header content (replaces default) */
  headerContent?: ReactNode;
  /** Optional extra header content (renders after title/count) */
  extraHeaderContent?: ReactNode;
  /** Stats summary in header */
  stats?: CollapsiblePanelStat[];
  /** Maximum height of content area */
  maxHeight?: number | string;
  /** Visual variant */
  variant?: CollapsiblePanelVariant;
  /** Whether to animate expand/collapse */
  animate?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom header class name */
  headerClassName?: string;
  /** Custom content class name */
  contentClassName?: string;
}

// Variant styles
const variantStyles: Record<CollapsiblePanelVariant, CSSProperties> = {
  default: {
    backgroundColor: tokens.colors.background.surface,
    border: 'none',
  },
  outlined: {
    backgroundColor: tokens.colors.background.surface,
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: `${tokens.spacing[1.5]}px`,
  },
  elevated: {
    backgroundColor: tokens.colors.background.elevated,
    border: 'none',
    borderRadius: `${tokens.spacing[1.5]}px`,
    boxShadow: tokens.shadow.sm,
  },
};

// Base styles
const containerStyles: CSSProperties = {
  width: '100%',
  fontFamily: tokens.fontFamily.sans,
  overflow: 'hidden',
};

const headerStyles: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  width: '100%',
  padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
  backgroundColor: 'transparent',
  border: 'none',
  textAlign: 'left',
  transition: tokens.transitions.colors,
  outline: 'none',
};

const headerFocusStyles: CSSProperties = {
  backgroundColor: tokens.colors.background.surface,
};

const titleRowStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: `${tokens.spacing[2]}px`,
  flex: 1,
  minWidth: 0,
};

const titleStyles: CSSProperties = {
  fontSize: tokens.fontSize.base,
  fontWeight: tokens.fontWeight.semibold,
  color: tokens.colors.text.default,
  margin: 0,
};

const countStyles: CSSProperties = {
  fontSize: tokens.fontSize.sm,
  fontWeight: tokens.fontWeight.medium,
  color: tokens.colors.text.muted,
  marginLeft: `${tokens.spacing[1]}px`,
};

const statsStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: `${tokens.spacing[3]}px`,
  marginRight: `${tokens.spacing[3]}px`,
};

const statItemStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: `${tokens.spacing[1]}px`,
  fontSize: tokens.fontSize.sm,
};

const statLabelStyles: CSSProperties = {
  color: tokens.colors.text.muted,
};

const statValueStyles: CSSProperties = {
  fontWeight: tokens.fontWeight.medium,
  color: tokens.colors.text.default,
};

const chevronStyles: CSSProperties = {
  fontSize: '12px',
  color: tokens.colors.text.muted,
  transition: 'transform 0.2s ease',
  flexShrink: 0,
};

const contentStyles: CSSProperties = {
  overflowY: 'auto',
  overflowX: 'hidden',
};

const contentInnerStyles: CSSProperties = {
  padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
};

/**
 * CollapsiblePanel - expandable/collapsible content section.
 * 
 * @example
 * ```tsx
 * <CollapsiblePanel title="Events" count={events.length}>
 *   <EventList events={events} />
 * </CollapsiblePanel>
 * 
 * <CollapsiblePanel
 *   title="Statistics"
 *   stats={[
 *     { label: 'Total', value: 42 },
 *     { label: 'Active', value: 17 },
 *   ]}
 *   variant="outlined"
 * >
 *   <StatsDetail />
 * </CollapsiblePanel>
 * ```
 */
export function CollapsiblePanel({
  title,
  count,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapseChange,
  children,
  headerContent,
  extraHeaderContent,
  stats,
  maxHeight = 300,
  variant = 'default',
  animate = true,
  className,
  headerClassName,
  contentClassName,
}: CollapsiblePanelProps) {
  // State management (controlled vs uncontrolled)
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed);
  
  const isCollapsed = controlledCollapsed !== undefined
    ? controlledCollapsed
    : uncontrolledCollapsed;

  const handleToggle = useCallback(() => {
    const newCollapsed = !isCollapsed;
    
    if (controlledCollapsed === undefined) {
      setUncontrolledCollapsed(newCollapsed);
    }
    
    onCollapseChange?.(newCollapsed);
  }, [isCollapsed, controlledCollapsed, onCollapseChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  // Compute styles
  const computedContainerStyles: CSSProperties = {
    ...containerStyles,
    ...variantStyles[variant],
  };

  const computedChevronStyles: CSSProperties = {
    ...chevronStyles,
    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
  };

  const computedContentStyles: CSSProperties = {
    ...contentStyles,
    maxHeight: isCollapsed ? 0 : maxHeight,
  };

  return (
    <div
      style={computedContainerStyles}
      className={className}
      data-component="collapsible-panel"
      data-variant={variant}
      data-collapsed={isCollapsed}
    >
      <button
        type="button"
        style={headerStyles}
        className={headerClassName}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={!isCollapsed}
        aria-controls={`${title.toLowerCase().replace(/\s+/g, '-')}-content`}
      >
        {headerContent ? (
          headerContent
        ) : (
          <>
            <div style={titleRowStyles}>
              <strong style={titleStyles}>{title}</strong>
              {count !== undefined && (
                <span style={countStyles}>({count})</span>
              )}
              {stats && stats.length > 0 && (
                <div style={statsStyles}>
                  {stats.map((stat, index) => (
                    <div key={index} style={statItemStyles}>
                      <span style={statLabelStyles}>{stat.label}:</span>
                      <span style={{ ...statValueStyles, color: stat.color }}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {extraHeaderContent}
            </div>
            <span style={computedChevronStyles} aria-hidden="true">
              ▼
            </span>
          </>
        )}
      </button>

      <div
        id={`${title.toLowerCase().replace(/\s+/g, '-')}-content`}
        style={computedContentStyles}
        className={contentClassName}
        hidden={isCollapsed}
      >
        <div style={contentInnerStyles}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default CollapsiblePanel;
