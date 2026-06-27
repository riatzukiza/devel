/**
 * Tabs Component
 * 
 * Implements the tabs.edn contract.
 * Tabbed content organization with keyboard navigation.
 */

import { 
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
  type KeyboardEvent
} from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type TabsVariant = 'default' | 'pills' | 'underline' | 'enclosed';
export type TabsSize = 'sm' | 'md' | 'lg';
export type TabsOrientation = 'horizontal' | 'vertical';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
  badge?: string;
  closable?: boolean;
}

export interface TabsProps {
  /** ID of currently active tab (controlled) */
  value?: string;
  /** ID of default active tab (uncontrolled) */
  defaultValue?: string;
  /** Callback when tab changes */
  onChange?: (value: string) => void;
  /** List of tab items */
  items: TabItem[];
  /** Visual style variant */
  variant?: TabsVariant;
  /** Size of tabs */
  size?: TabsSize;
  /** Orientation of tabs */
  orientation?: TabsOrientation;
  /** Whether to lazy render tab content */
  lazy?: boolean;
  /** Whether to keep inactive tabs mounted */
  keepMounted?: boolean;
  /** Whether to show close button */
  showClose?: boolean;
  /** Callback when tab close button is clicked */
  onClose?: (tabId: string) => void;
  /** Whether to show add button */
  addable?: boolean;
  /** Callback when add button is clicked */
  onAdd?: () => void;
}

// Size styles
const sizeStyles: Record<TabsSize, CSSProperties> = {
  sm: { 
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
    fontSize: tokens.fontSize.sm,
  },
  md: { 
    padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
    fontSize: tokens.fontSize.base,
  },
  lg: { 
    padding: `${tokens.spacing[3]}px ${tokens.spacing[5]}px`,
    fontSize: tokens.fontSize.lg,
  },
};

// Tab list styles by variant and orientation
const getTabListStyles = (variant: TabsVariant, orientation: TabsOrientation): CSSProperties => {
  const base: CSSProperties = {
    display: 'flex',
    gap: `${tokens.spacing[1]}px`,
    fontFamily: tokens.fontFamily.sans,
  };
  
  const orientationStyles: CSSProperties = orientation === 'vertical'
    ? { flexDirection: 'column' }
    : { flexDirection: 'row' };
  
  const underlineStyles: CSSProperties = variant === 'underline'
    ? { borderBottom: `1px solid ${tokens.colors.border.default}`, marginBottom: '-1px' }
    : {};
  
  return { ...base, ...orientationStyles, ...underlineStyles };
};

// Tab styles by variant
const getTabStyles = (variant: TabsVariant, size: TabsSize, isActive: boolean, disabled: boolean): CSSProperties => {
  const base: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${tokens.spacing[2]}px`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: tokens.transitions.colors,
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
    border: 'none',
    background: 'transparent',
    fontFamily: tokens.fontFamily.sans,
    ...sizeStyles[size],
  };
  
  if (variant === 'pills') {
    return {
      ...base,
      borderRadius: tokens.radius.full,
      backgroundColor: isActive ? tokens.colors.accent.cyan : 'transparent',
      color: isActive ? tokens.colors.background.default : tokens.colors.text.muted,
    };
  }
  
  if (variant === 'underline') {
    return {
      ...base,
      borderBottom: isActive ? `2px solid ${tokens.colors.accent.cyan}` : '2px solid transparent',
      marginBottom: '-1px',
      color: isActive ? tokens.colors.text.default : tokens.colors.text.muted,
    };
  }
  
  if (variant === 'enclosed') {
    return {
      ...base,
      borderRadius: `${tokens.radius.sm} ${tokens.radius.sm} 0 0`,
      backgroundColor: isActive ? tokens.colors.background.elevated : 'transparent',
      border: `1px solid ${tokens.colors.border.default}`,
      borderBottom: isActive ? 'none' : `1px solid ${tokens.colors.border.default}`,
      marginBottom: '-1px',
      color: isActive ? tokens.colors.text.default : tokens.colors.text.muted,
    };
  }
  
  // default variant
  return {
    ...base,
    borderRadius: tokens.radius.sm,
    backgroundColor: isActive ? tokens.colors.background.elevated : 'transparent',
    color: isActive ? tokens.colors.text.default : tokens.colors.text.muted,
  };
};

// Panel styles
const panelStyles: CSSProperties = {
  flex: 1,
  overflow: 'auto',
};

// Close button styles
const closeButtonStyles: CSSProperties = {
  marginLeft: `${tokens.spacing[2]}px`,
  padding: '2px 4px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  lineHeight: 1,
  color: tokens.colors.text.muted,
  borderRadius: tokens.radius.xs,
};

// Add button styles
const addButtonStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${tokens.spacing[1]}px ${tokens.spacing[3]}px`,
  background: 'none',
  border: `1px dashed ${tokens.colors.border.default}`,
  borderRadius: tokens.radius.sm,
  cursor: 'pointer',
  color: tokens.colors.text.muted,
  fontFamily: tokens.fontFamily.sans,
  fontSize: tokens.fontSize.sm,
  transition: tokens.transitions.colors,
};

/**
 * Tabbed content organization.
 * 
 * @example
 * ```tsx
 * const tabs = [
 *   { id: 'tab1', label: 'Overview', content: <div>Overview content</div> },
 *   { id: 'tab2', label: 'Settings', content: <div>Settings content</div> },
 * ];
 * 
 * <Tabs items={tabs} />
 * ```
 */
export function Tabs({
  value: controlledValue,
  defaultValue,
  onChange,
  items,
  variant = 'default',
  size = 'md',
  orientation = 'horizontal',
  lazy = true,
  keepMounted = false,
  showClose = false,
  onClose,
  addable = false,
  onAdd,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue || items[0]?.id || ''
  );
  
  const activeValue = controlledValue ?? internalValue;
  
  const handleTabClick = useCallback((id: string, disabled: boolean) => {
    if (disabled) return;
    
    if (!controlledValue) {
      setInternalValue(id);
    }
    onChange?.(id);
  }, [controlledValue, onChange]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    const enabledItems = items.filter(item => !item.disabled);
    const enabledIndex = enabledItems.findIndex(item => item.id === activeValue);
    
    let nextIndex = enabledIndex;
    
    if (orientation === 'horizontal') {
      if (e.key === 'ArrowRight') {
        nextIndex = (enabledIndex + 1) % enabledItems.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (enabledIndex - 1 + enabledItems.length) % enabledItems.length;
      }
    } else {
      if (e.key === 'ArrowDown') {
        nextIndex = (enabledIndex + 1) % enabledItems.length;
      } else if (e.key === 'ArrowUp') {
        nextIndex = (enabledIndex - 1 + enabledItems.length) % enabledItems.length;
      }
    }
    
    if (nextIndex !== enabledIndex) {
      e.preventDefault();
      handleTabClick(enabledItems[nextIndex].id, false);
      (e.currentTarget.parentElement?.querySelector(`[data-tab-id="${enabledItems[nextIndex].id}"]`) as HTMLElement)?.focus();
    }
  }, [items, activeValue, orientation, handleTabClick]);

  const renderTab = (item: TabItem) => {
    const isActive = item.id === activeValue;
    const isDisabled = item.disabled || false;
    const isClosable = item.closable !== false && showClose;
    
    return (
      <button
        key={item.id}
        data-tab-id={item.id}
        role="tab"
        aria-selected={isActive}
        aria-controls={`panel-${item.id}`}
        aria-disabled={isDisabled}
        tabIndex={isActive ? 0 : -1}
        data-component="tab"
        data-active={isActive || undefined}
        data-disabled={isDisabled || undefined}
        style={getTabStyles(variant, size, isActive, isDisabled)}
        onClick={() => handleTabClick(item.id, isDisabled)}
        onKeyDown={handleKeyDown}
      >
        {item.icon && <span>{item.icon}</span>}
        <span>{item.label}</span>
        {item.badge && (
          <span style={{
            padding: '1px 6px',
            backgroundColor: tokens.colors.background.surface,
            borderRadius: tokens.radius.full,
            fontSize: tokens.fontSize.xs,
          }}>
            {item.badge}
          </span>
        )}
        {isClosable && (
          <span
            role="button"
            aria-label="Close tab"
            style={closeButtonStyles}
            onClick={(e) => {
              e.stopPropagation();
              onClose?.(item.id);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = tokens.colors.badge.error.bg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      data-component="tabs"
      data-variant={variant}
      data-orientation={orientation}
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'row' : 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      <div
        role="tablist"
        aria-orientation={orientation}
        style={getTabListStyles(variant, orientation)}
      >
        {items.map(renderTab)}
        {addable && (
          <button
            style={addButtonStyles}
            onClick={onAdd}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = tokens.colors.accent.cyan;
              e.currentTarget.style.color = tokens.colors.text.default;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = tokens.colors.border.default;
              e.currentTarget.style.color = tokens.colors.text.muted;
            }}
          >
            + Add
          </button>
        )}
      </div>
      
      <div style={panelStyles}>
        {items.map((item) => {
          const isActive = item.id === activeValue;
          
          if (lazy && !isActive && !keepMounted) {
            return null;
          }
          
          return (
            <div
              key={item.id}
              id={`panel-${item.id}`}
              role="tabpanel"
              aria-labelledby={item.id}
              hidden={!isActive}
              style={{ display: isActive ? 'block' : 'none' }}
            >
              {item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tabs;
