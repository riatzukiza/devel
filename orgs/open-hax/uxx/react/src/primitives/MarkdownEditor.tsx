import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { tokens, type ThemePreference } from '@open-hax/uxx/tokens';
import { Markdown } from './Markdown.js';
import { useResolvedTheme } from '../theme.js';

export interface MarkdownEditorProps {
  value?: string;
  defaultValue?: string;
  previewMode?: 'split' | 'preview-only' | 'editor-only' | 'tabbed';
  previewRatio?: number;
  toolbar?: boolean;
  statusBar?: boolean;
  lineNumbers?: boolean;
  wrap?: boolean;
  theme?: ThemePreference;
  highlightActiveLine?: boolean;
  matchBrackets?: boolean;
  spellcheck?: boolean;
  placeholder?: string;
  imageUpload?: (file: File) => Promise<string>;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  onPreviewClick?: (element: string, event: Event) => void;
  autosave?: {
    enabled?: boolean;
    key?: string;
    delay?: number;
  };
  className?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value: controlledValue,
  defaultValue = '',
  previewMode = 'split',
  previewRatio = 0.5,
  toolbar = true,
  statusBar = true,
  lineNumbers = true,
  wrap = true,
  theme = 'dark',
  highlightActiveLine = true,
  spellcheck = false,
  placeholder = 'Write your markdown here...',
  onChange,
  onSave,
  autosave,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const resolvedTheme = useResolvedTheme(theme);
  const themeColors = resolvedTheme.colors;
  
  // Calculate stats
  const stats = useMemo(() => {
    const lines = value.split('\n');
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const characters = value.length;
    return { lines: lines.length, words, characters };
  }, [value]);
  
  // Handle change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [controlledValue, onChange]
  );
  
  // Track cursor position
  const handleCursorChange = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const text = textarea.value.substring(0, textarea.selectionStart);
    const lines = text.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    setCursorPosition({ line, column });
  }, []);
  
  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Save: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.(value);
        return;
      }
      
      // Bold: Ctrl+B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        insertFormatting('**', '**');
        return;
      }
      
      // Italic: Ctrl+I
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        insertFormatting('*', '*');
        return;
      }
      
      // Tab handling
      if (e.key === 'Tab') {
        e.preventDefault();
        insertText('  ');
        return;
      }
    },
    [value, onSave]
  );
  
  // Insert text at cursor
  const insertText = useCallback(
    (text: string) => {
      if (!textareaRef.current) return;
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + text + value.substring(end);
      
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
      
      // Reset cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    },
    [value, controlledValue, onChange]
  );
  
  // Insert formatting around selection
  const insertFormatting = useCallback(
    (before: string, after: string) => {
      if (!textareaRef.current) return;
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const newValue =
        value.substring(0, start) +
        before +
        selectedText +
        after +
        value.substring(end);
      
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
      
      // Reset cursor position
      setTimeout(() => {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selectedText.length;
        textarea.focus();
      }, 0);
    },
    [value, controlledValue, onChange]
  );
  
  // Toolbar actions
  const toolbarActions = useMemo(
    () => [
      {
        label: 'H1',
        action: () => insertText('# '),
        shortcut: 'Ctrl+1',
      },
      {
        label: 'H2',
        action: () => insertText('## '),
        shortcut: 'Ctrl+2',
      },
      {
        label: 'H3',
        action: () => insertText('### '),
        shortcut: 'Ctrl+3',
      },
      { divider: true },
      {
        label: 'B',
        action: () => insertFormatting('**', '**'),
        shortcut: 'Ctrl+B',
      },
      {
        label: 'I',
        action: () => insertFormatting('*', '*'),
        shortcut: 'Ctrl+I',
      },
      {
        label: 'S',
        action: () => insertFormatting('~~', '~~'),
        shortcut: 'Ctrl+Shift+S',
      },
      {
        label: '</>',
        action: () => insertFormatting('`', '`'),
        shortcut: 'Ctrl+`',
      },
      { divider: true },
      {
        label: 'Link',
        action: () => insertFormatting('[', '](url)'),
        shortcut: 'Ctrl+K',
      },
      {
        label: 'Image',
        action: () => insertText('![alt](url)'),
        shortcut: 'Ctrl+Shift+I',
      },
      { divider: true },
      {
        label: 'List',
        action: () => insertText('- '),
        shortcut: 'Ctrl+L',
      },
      {
        label: 'Num',
        action: () => insertText('1. '),
        shortcut: 'Ctrl+Shift+L',
      },
      {
        label: 'Quote',
        action: () => insertText('> '),
        shortcut: 'Ctrl+Q',
      },
      {
        label: 'Code',
        action: () => insertText('```\n\n```\n'),
        shortcut: 'Ctrl+Shift+C',
      },
    ],
    [insertText, insertFormatting]
  );
  
  // Autosave
  useEffect(() => {
    if (!autosave?.enabled || !autosave?.key) return;
    
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(autosave.key!, value);
      }
    }, autosave.delay || 1000);
    
    return () => clearTimeout(timeoutId);
  }, [value, autosave]);
  
  // Render editor
  const renderEditor = () => (
    <div
      style={{
        flex: previewMode === 'split' ? 1 - previewRatio : 1,
        display: 'flex',
        flexDirection: 'column',
        background: themeColors.background.default,
        borderRadius: tokens.radius.md,
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      {toolbar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 12px',
            background: themeColors.background.surface,
            borderBottom: `1px solid ${themeColors.border.subtle}`,
            flexWrap: 'wrap',
          }}
        >
          {toolbarActions.map((item, index) => {
            if ('divider' in item) {
              return (
                <div
                  key={index}
                  style={{
                    width: 1,
                    height: 20,
                    background: themeColors.border.default,
                    margin: '0 4px',
                  }}
                />
              );
            }
            return (
              <button
                key={index}
                onClick={item.action}
                title={item.shortcut}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: 4,
                  color: themeColors.text.default,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: item.label === 'B' ? 'bold' : 'normal',
                  fontStyle: item.label === 'I' ? 'italic' : 'normal',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
      
      {/* Editor area with line numbers */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {lineNumbers && (
          <div
            style={{
              padding: '12px 8px',
              background: themeColors.background.elevated,
              color: themeColors.text.subtle,
              fontFamily: tokens.fontFamily.mono,
              fontSize: 13,
              lineHeight: 1.6,
              textAlign: 'right',
              userSelect: 'none',
              minWidth: 48,
              overflow: 'hidden',
            }}
          >
            {value.split('\n').map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleCursorChange}
          onKeyUp={handleCursorChange}
          placeholder={placeholder}
          spellCheck={spellcheck}
          style={{
            flex: 1,
            padding: 12,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: themeColors.text.default,
            fontFamily: tokens.fontFamily.mono,
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'none',
            whiteSpace: wrap ? 'pre-wrap' : 'pre',
            overflow: 'auto',
          }}
        />
      </div>
      
      {/* Status bar */}
      {statusBar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '4px 12px',
            background: themeColors.background.surface,
            borderTop: `1px solid ${themeColors.border.subtle}`,
            fontSize: 12,
            color: themeColors.text.muted,
          }}
        >
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          <span>{stats.lines} lines</span>
          <span>{stats.words} words</span>
          <span>{stats.characters} characters</span>
          <span style={{ marginLeft: 'auto' }}>Markdown</span>
        </div>
      )}
    </div>
  );
  
  // Render preview
  const renderPreview = () => (
    <div
      ref={previewRef}
      style={{
        flex: previewMode === 'split' ? previewRatio : 1,
        padding: 16,
        background: themeColors.background.surface,
        borderRadius: tokens.radius.md,
        overflow: 'auto',
      }}
    >
      {value.trim() ? (
        <Markdown content={value} theme={theme} />
      ) : (
        <div
          style={{
            color: themeColors.text.subtle,
            fontStyle: 'italic',
          }}
        >
          Preview will appear here
        </div>
      )}
    </div>
  );
  
  // Tabbed mode
  if (previewMode === 'tabbed') {
    return (
      <div
        className={className}
        data-component="markdown-editor"
        data-preview-mode={previewMode}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: themeColors.background.default,
          borderRadius: tokens.radius.md,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${themeColors.border.default}`,
          }}
        >
          <button
            onClick={() => setActiveTab('editor')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'editor' ? themeColors.background.surface : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'editor' ? `2px solid ${themeColors.accent.cyan}` : 'none',
              color: themeColors.text.default,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: activeTab === 'editor' ? 500 : 400,
            }}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'preview' ? themeColors.background.surface : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'preview' ? `2px solid ${themeColors.accent.cyan}` : 'none',
              color: themeColors.text.default,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: activeTab === 'preview' ? 500 : 400,
            }}
          >
            Preview
          </button>
        </div>
        
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activeTab === 'editor' ? renderEditor() : renderPreview()}
        </div>
      </div>
    );
  }
  
  // Editor-only mode
  if (previewMode === 'editor-only') {
    return (
      <div
        className={className}
        data-component="markdown-editor"
        data-preview-mode={previewMode}
        style={{
          height: '100%',
          background: themeColors.background.default,
          borderRadius: tokens.radius.md,
          overflow: 'hidden',
        }}
      >
        {renderEditor()}
      </div>
    );
  }
  
  // Preview-only mode
  if (previewMode === 'preview-only') {
    return (
      <div
        className={className}
        data-component="markdown-editor"
        data-preview-mode={previewMode}
        style={{
          height: '100%',
          background: themeColors.background.default,
          borderRadius: tokens.radius.md,
          overflow: 'hidden',
        }}
      >
        {renderPreview()}
      </div>
    );
  }
  
  // Split mode (default)
  return (
    <div
      className={className}
      data-component="markdown-editor"
      data-preview-mode={previewMode}
      style={{
        display: 'flex',
        gap: 1,
        height: '100%',
        background: themeColors.border.default,
        borderRadius: tokens.radius.md,
        overflow: 'hidden',
      }}
    >
      {renderEditor()}
      {renderPreview()}
    </div>
  );
};

export default MarkdownEditor;
