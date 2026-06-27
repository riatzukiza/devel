/**
 * CommandPalette Component
 * 
 * Implements the command-palette.edn contract.
 * Quick action search palette with keyboard navigation and fuzzy search.
 */

import { 
  useState, 
  useEffect, 
  useCallback, 
  useRef,
  useMemo,
  type ReactNode,
  type CSSProperties,
  type KeyboardEvent
} from 'react';
import { createPortal } from 'react-dom';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  shortcut?: string;
  category?: string;
  action?: () => void;
  disabled?: boolean;
}

export interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

export interface CommandPaletteProps {
  /** Whether the palette is currently open */
  open?: boolean;
  /** Callback fired when palette should close */
  onClose: () => void;
  /** Callback fired when an item is selected */
  onSelect: (item: CommandItem) => void;
  /** Placeholder text for search input */
  placeholder?: string;
  /** List of command items */
  items: CommandItem[];
  /** Optional grouping of commands */
  groups?: CommandGroup[];
  /** Recently used items shown at top */
  recentItems?: CommandItem[];
  /** Maximum number of results */
  maxResults?: number;
  /** Content to show when no results */
  emptyState?: ReactNode;
  /** Whether commands are loading */
  loading?: boolean;
  /** Keyboard shortcut hint */
  shortcut?: string;
}

// Backdrop styles
const backdropStyles: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: tokens.colors.background.overlay,
  backdropFilter: 'blur(4px)',
  zIndex: tokens.zIndex.modal,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '15vh',
};

// Palette container styles
const paletteStyles: CSSProperties = {
  backgroundColor: tokens.colors.background.elevated,
  borderRadius: `${tokens.spacing[3]}px`,
  boxShadow: tokens.shadow['2xl'],
  border: `1px solid ${tokens.colors.border.subtle}`,
  width: '100%',
  maxWidth: '600px',
  maxHeight: '70vh',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: tokens.fontFamily.sans,
  overflow: 'hidden',
};

// Input wrapper styles
const inputWrapperStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: `${tokens.spacing[4]}px`,
  borderBottom: `1px solid ${tokens.colors.border.default}`,
  gap: `${tokens.spacing[2]}px`,
};

// Input styles
const inputStyles: CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: tokens.colors.text.default,
  fontSize: tokens.fontSize.lg,
  fontFamily: tokens.fontFamily.sans,
};

// Results container styles
const resultsStyles: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: `${tokens.spacing[2]}px 0`,
};

// Group label styles
const groupLabelStyles: CSSProperties = {
  padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
  fontSize: tokens.fontSize.xs,
  fontWeight: tokens.fontWeight.semibold,
  color: tokens.colors.text.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

// Item styles
const itemStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: `${tokens.spacing[3]}px`,
  padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
  cursor: 'pointer',
  transition: tokens.transitions.colors,
};

// Item active styles
const itemActiveStyles: CSSProperties = {
  backgroundColor: tokens.colors.background.surface,
};

// Shortcut badge styles
const shortcutStyles: CSSProperties = {
  marginLeft: 'auto',
  padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
  backgroundColor: tokens.colors.background.surface,
  borderRadius: `${tokens.spacing[1]}px`,
  fontSize: tokens.fontSize.xs,
  color: tokens.colors.text.muted,
  fontFamily: tokens.fontFamily.mono,
};

// Empty state styles
const emptyStateStyles: CSSProperties = {
  padding: `${tokens.spacing[8]}px ${tokens.spacing[4]}px`,
  textAlign: 'center',
  color: tokens.colors.text.muted,
};

// Loading styles
const loadingStyles: CSSProperties = {
  padding: `${tokens.spacing[4]}px`,
  textAlign: 'center',
};

// Fuzzy match function
const fuzzyMatch = (text: string, query: string): { matches: boolean; score: number } => {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  if (textLower.includes(queryLower)) {
    return { matches: true, score: 100 - text.length };
  }
  
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += (i === queryIndex) ? 10 : 1;
      queryIndex++;
    }
  }
  
  return { matches: queryIndex === query.length, score };
};

/**
 * Command palette for quick actions and search.
 * 
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * 
 * <CommandPalette
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   onSelect={(item) => { item.action?.(); setOpen(false); }}
 *   items={[
 *     { id: 'new', label: 'New File', shortcut: '⌘N', icon: <FileIcon /> },
 *     { id: 'open', label: 'Open File', shortcut: '⌘O', icon: <FolderIcon /> },
 *   ]}
 * />
 * ```
 */
export function CommandPalette({
  open = false,
  onClose,
  onSelect,
  placeholder = 'Type a command or search...',
  items,
  groups,
  recentItems,
  maxResults = 50,
  emptyState,
  loading = false,
  shortcut = '⌘K',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Flatten items with groups
  const flatItems = useMemo(() => {
    if (groups) {
      return groups.flatMap(g => g.items);
    }
    return items;
  }, [items, groups]);

  // Filter items by query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // Show recent items first when no query
      if (recentItems && recentItems.length > 0) {
        const recentSet = new Set(recentItems.map(r => r.id));
        const others = flatItems.filter(i => !recentSet.has(i.id));
        return [...recentItems, ...others].slice(0, maxResults);
      }
      return flatItems.slice(0, maxResults);
    }

    const results = flatItems
      .map(item => {
        const labelMatch = fuzzyMatch(item.label, query);
        const descMatch = item.description ? fuzzyMatch(item.description, query) : { matches: false, score: 0 };
        return {
          item,
          score: Math.max(labelMatch.score, descMatch.score),
          matches: labelMatch.matches || descMatch.matches,
        };
      })
      .filter(r => r.matches && !r.item.disabled)
      .sort((a, b) => b.score - a.score)
      .map(r => r.item)
      .slice(0, maxResults);

    return results;
  }, [query, flatItems, recentItems, maxResults]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(i => Math.min(i + 1, filteredItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[activeIndex]) {
            onSelect(filteredItems[activeIndex]);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredItems, activeIndex, onSelect, onClose]
  );

  // Scroll active item into view
  useEffect(() => {
    if (resultsRef.current) {
      const activeElement = resultsRef.current.querySelector(`[data-index="${activeIndex}"]`);
      activeElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!open) return null;

  const renderItems = (items: CommandItem[], startIndex: number) =>
    items.map((item, idx) => {
      const index = startIndex + idx;
      const isActive = index === activeIndex;
      
      return (
        <div
          key={item.id}
          data-index={index}
          data-component="command-item"
          data-active={isActive || undefined}
          data-disabled={item.disabled || undefined}
          style={{
            ...itemStyles,
            ...(isActive ? itemActiveStyles : {}),
            opacity: item.disabled ? 0.5 : 1,
          }}
          onClick={() => {
            if (!item.disabled) {
              onSelect(item);
              onClose();
            }
          }}
          onMouseEnter={() => setActiveIndex(index)}
        >
          {item.icon && <span style={{ fontSize: '18px' }}>{item.icon}</span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: tokens.colors.text.default }}>{item.label}</div>
            {item.description && (
              <div style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.text.muted }}>
                {item.description}
              </div>
            )}
          </div>
          {item.shortcut && <span style={shortcutStyles}>{item.shortcut}</span>}
        </div>
      );
    });

  return createPortal(
    <div
      data-component="command-palette"
      data-open={open}
      style={backdropStyles}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={paletteStyles}>
        <div style={inputWrapperStyles}>
          <span style={{ color: tokens.colors.text.muted }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={inputStyles}
          />
          {shortcut && (
            <span style={{ ...shortcutStyles, fontSize: tokens.fontSize.sm }}>
              {shortcut}
            </span>
          )}
        </div>

        <div ref={resultsRef} style={resultsStyles}>
          {loading ? (
            <div style={loadingStyles}>Loading...</div>
          ) : filteredItems.length === 0 ? (
            emptyState || (
              <div style={emptyStateStyles}>
                No results found for "{query}"
              </div>
            )
          ) : groups ? (
            groups.map((group) => {
              const groupItems = filteredItems.filter(i => 
                group.items.some(gi => gi.id === i.id)
              );
              if (groupItems.length === 0) return null;
              return (
                <div key={group.id}>
                  <div style={groupLabelStyles}>{group.label}</div>
                  {renderItems(groupItems, 0)}
                </div>
              );
            })
          ) : (
            renderItems(filteredItems, 0)
          )}
        </div>

        {recentItems && recentItems.length > 0 && !query && (
          <div style={{ 
            padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
            borderTop: `1px solid ${tokens.colors.border.default}`,
            fontSize: tokens.fontSize.xs,
            color: tokens.colors.text.muted,
          }}>
            {recentItems.length} recent • {filteredItems.length} commands
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default CommandPalette;
