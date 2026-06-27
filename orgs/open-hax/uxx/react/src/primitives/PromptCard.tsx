import { type CSSProperties, useState } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import { getPromptText, type InputPrompt } from './PermissionPrompts.types.js';

export interface PromptCardProps {
  prompt: InputPrompt;
  onResponse: (id: string, response: string) => void;
  autoFocus?: boolean;
  submitLabel?: string;
  style?: CSSProperties;
  className?: string;
}

const rootStyles: CSSProperties = {
  padding: `${tokens.spacing[3]}px`,
  border: `1px solid ${tokens.colors.border.default}`,
  borderRadius: `${tokens.spacing[1]}px`,
  background: tokens.colors.background.default,
  marginBottom: `${tokens.spacing[2]}px`,
};

const titleStyles: CSSProperties = {
  fontSize: tokens.typography.body.fontSize,
  fontWeight: tokens.fontWeight.medium,
  color: tokens.colors.text.default,
  marginBottom: `${tokens.spacing[2]}px`,
};

const textStyles: CSSProperties = {
  fontSize: tokens.typography.bodySm.fontSize,
  color: tokens.colors.text.secondary,
  marginBottom: `${tokens.spacing[2]}px`,
};

const inputBaseStyles: CSSProperties = {
  width: '100%',
  padding: `${tokens.spacing[2]}px`,
  border: `1px solid ${tokens.colors.border.default}`,
  borderRadius: `${tokens.spacing[0.5]}px`,
  fontSize: tokens.typography.bodySm.fontSize,
  fontFamily: tokens.fontFamily.mono,
  background: tokens.colors.background.elevated,
  color: tokens.colors.text.default,
  boxSizing: 'border-box',
  outline: 'none',
};

export function PromptCard({ prompt, onResponse, autoFocus = false, submitLabel = 'Submit', style, className }: PromptCardProps) {
  const [inputValue, setInputValue] = useState('');
  const multiline = prompt.multiline || false;
  const promptText = getPromptText(prompt.body);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onResponse(prompt.id, inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      data-component="prompt-card"
      data-testid="prompt-card"
      data-prompt-id={prompt.id}
      style={{ ...rootStyles, ...style }}
      className={className}
    >
      <div style={titleStyles}>{prompt.title || 'Input Required'}</div>
      <div style={textStyles}>{promptText}</div>
      {prompt.sessionId && <div style={{ ...textStyles, color: tokens.colors.text.muted }}>Session: {prompt.sessionId}</div>}

      {multiline ? (
        <textarea
          data-testid="prompt-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={prompt.placeholder || 'Enter response...'}
          autoFocus={autoFocus}
          rows={3}
          style={{ ...inputBaseStyles, minHeight: '60px', resize: 'vertical' }}
        />
      ) : (
        <input
          type="text"
          data-testid="prompt-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={prompt.placeholder || 'Enter response...'}
          autoFocus={autoFocus}
          style={inputBaseStyles}
        />
      )}

      <button
        type="button"
        data-testid="prompt-submit"
        onClick={handleSubmit}
        disabled={!inputValue.trim()}
        style={{
          marginTop: `${tokens.spacing[2]}px`,
          width: '100%',
          padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
          border: `1px solid ${tokens.colors.accent.green}`,
          borderRadius: `${tokens.spacing[0.5]}px`,
          fontSize: tokens.typography.bodySm.fontSize,
          background: !inputValue.trim() ? tokens.colors.background.elevated : tokens.colors.accent.green,
          color: !inputValue.trim() ? tokens.colors.text.muted : tokens.colors.background.default,
          cursor: !inputValue.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {submitLabel}
      </button>
    </div>
  );
}

export default PromptCard;
