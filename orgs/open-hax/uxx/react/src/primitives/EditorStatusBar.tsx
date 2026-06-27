import type { ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

export interface EditorStatusBarItem {
  key?: string;
  label: ReactNode;
  align?: 'start' | 'end';
  testId?: string;
}

export interface EditorStatusBarProps {
  items: EditorStatusBarItem[];
  className?: string;
  background?: string;
  borderColor?: string;
  textColor?: string;
  padding?: string | number;
  gap?: number;
}

function normalizePadding(padding: EditorStatusBarProps['padding']): string {
  if (typeof padding === 'number') {
    return `${padding}px`;
  }

  return padding ?? '4px 12px';
}

export function EditorStatusBar({
  items,
  className,
  background = tokens.colors.background.surface,
  borderColor = tokens.colors.border.subtle,
  textColor = tokens.colors.text.muted,
  padding,
  gap = 16,
}: EditorStatusBarProps) {
  const firstEndIndex = items.findIndex((item) => item.align === 'end');

  return (
    <div
      className={className}
      data-component="editor-status-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap,
        padding: normalizePadding(padding),
        background,
        borderTop: `1px solid ${borderColor}`,
        fontSize: 12,
        color: textColor,
      }}
    >
      {items.map((item, index) => {
        const isFirstEndAligned = index === firstEndIndex;

        return (
          <span
            key={item.key ?? `status-${index}`}
            data-testid={item.testId}
            style={isFirstEndAligned ? { marginLeft: 'auto' } : undefined}
          >
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

export default EditorStatusBar;
