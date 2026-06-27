import type { KeyboardEvent, ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import type { MentionItem } from './RichTextEditor.types.js';

export interface MentionSuggestionsProps {
  items: MentionItem[];
  onSelect?: (item: MentionItem) => void;
  renderItem?: (item: MentionItem) => ReactNode;
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function MentionSuggestions({
  items,
  onSelect,
  renderItem,
  selectedIndex = 0,
  onSelectedIndexChange,
  onKeyDown,
}: MentionSuggestionsProps) {
  if (items.length === 0) {
    return null;
  }

  const activeIndex = Math.min(Math.max(selectedIndex, 0), items.length - 1);
  const activeDescendant = `mention-item-${items[activeIndex]?.id}`;
  const dropdownMaxHeight = tokens.spacing[24] * 2 + tokens.spacing[2];

  return (
    <div
      data-component="mention-suggestions"
      data-testid="mention-suggestions"
      role="listbox"
      tabIndex={-1}
      aria-label="Mention suggestions"
      aria-activedescendant={activeDescendant}
      onKeyDown={onKeyDown}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: tokens.colors.background.elevated,
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: `${tokens.spacing[2]}px`,
        maxHeight: `${dropdownMaxHeight}px`,
        overflow: 'auto',
        zIndex: 1000,
      }}
    >
      {items.map((item, index) => {
        const isSelected = index === activeIndex;

        return (
          <button
            key={item.id}
            id={`mention-item-${item.id}`}
            type="button"
            data-testid="mention-suggestion-item"
            role="option"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect?.(item)}
            onMouseEnter={() => onSelectedIndexChange?.(index)}
            onFocus={() => onSelectedIndexChange?.(index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 12px',
              background: isSelected ? tokens.colors.selection.default : 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: tokens.colors.text.default,
              outline: isSelected ? `1px solid ${tokens.colors.accent.cyan}` : 'none',
              outlineOffset: '-1px',
            }}
          >
            {renderItem ? (
              renderItem(item)
            ) : (
              <>
                {item.avatar && (
                  <img
                    src={item.avatar}
                    alt={item.name}
                    style={{ width: 24, height: 24, borderRadius: '50%' }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 500 }}>{item.name}</div>
                  {item.description && (
                    <div style={{ fontSize: 12, color: tokens.colors.text.muted }}>
                      {item.description}
                    </div>
                  )}
                </div>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default MentionSuggestions;
