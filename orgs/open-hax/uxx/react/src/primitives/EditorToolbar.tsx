import type { CSSProperties, ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

export interface EditorToolbarDividerItem {
  type: 'divider';
  key?: string;
  testId?: string;
}

export interface EditorToolbarButtonItem {
  type?: 'button';
  key?: string;
  label: ReactNode;
  title?: string;
  ariaLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
  buttonStyle?: CSSProperties;
  testId?: string;
}

export type EditorToolbarItem = EditorToolbarDividerItem | EditorToolbarButtonItem;

export interface EditorToolbarProps {
  items: EditorToolbarItem[];
  className?: string;
  background?: string;
  borderColor?: string;
  textColor?: string;
  padding?: string | number;
  gap?: number;
  wrap?: boolean;
}

function normalizePadding(padding: EditorToolbarProps['padding']): string {
  if (typeof padding === 'number') {
    return `${padding}px`;
  }

  return padding ?? '8px 12px';
}

export function EditorToolbar({
  items,
  className,
  background = tokens.colors.background.surface,
  borderColor = tokens.colors.border.subtle,
  textColor = tokens.colors.text.default,
  padding,
  gap = 4,
  wrap = true,
}: EditorToolbarProps) {
  return (
    <div
      className={className}
      data-component="editor-toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap,
        padding: normalizePadding(padding),
        background,
        borderBottom: `1px solid ${borderColor}`,
        flexWrap: wrap ? 'wrap' : 'nowrap',
      }}
    >
      {items.map((item, index) => {
        if (item.type === 'divider') {
          return (
            <div
              key={item.key ?? `divider-${index}`}
              data-testid={item.testId}
              style={{
                width: 1,
                height: 20,
                background: borderColor,
                margin: '0 4px',
              }}
            />
          );
        }

        const accessibleLabel =
          item.ariaLabel ??
          (typeof item.label === 'string' ? item.label : undefined) ??
          item.title ??
          item.key ??
          'Toolbar action';

        return (
          <button
            key={item.key ?? `button-${index}`}
            type="button"
            data-testid={item.testId}
            aria-label={accessibleLabel}
            onClick={item.onClick}
            disabled={item.disabled}
            title={item.title}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              borderRadius: 4,
              color: textColor,
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              opacity: item.disabled ? 0.5 : 1,
              ...item.buttonStyle,
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default EditorToolbar;
