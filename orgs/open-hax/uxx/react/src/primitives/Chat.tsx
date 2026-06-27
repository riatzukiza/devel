/**
 * Chat Component
 *
 * Implements the chat.edn contract.
 * AI conversation interface with messages, input, typing indicators, session context, and connection status.
 */

import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { tokens } from '@open-hax/uxx/tokens';

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp?: Date;
  attachments?: File[];
  metadata?: Record<string, unknown>;
  actions?: string[];
  reasoningContent?: string;
}

export interface ChatProps {
  messages: readonly ChatMessage[];
  onSend: (message: string, attachments?: File[]) => void;
  placeholder?: string;
  loading?: boolean;
  typingIndicator?: boolean;
  avatar?: ReactNode;
  userAvatar?: ReactNode;
  maxHeight?: string;
  showTimestamps?: boolean;
  allowAttachments?: boolean;
  allowMarkdown?: boolean;
  emptyState?: ReactNode;
  onMessageAction?: (action: string, message: ChatMessage) => void;
  sessionId?: string;
  connected?: boolean;
  pendingMessage?: ChatMessage;
  showHeader?: boolean;
}

const containerStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${tokens.colors.border.default}`,
  borderRadius: `${tokens.spacing[3]}px`,
  backgroundColor: tokens.colors.background.default,
  fontFamily: tokens.fontFamily.sans,
  overflow: 'hidden',
};

const headerStyles: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
  borderBottom: `1px solid ${tokens.colors.border.default}`,
  fontSize: tokens.fontSize.sm,
  color: tokens.colors.text.muted,
};

const messagesContainerStyles: (maxHeight: string) => CSSProperties = (maxHeight) => ({
  flex: 1,
  overflowY: 'auto',
  padding: `${tokens.spacing[3]}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${tokens.spacing[3]}px`,
  maxHeight,
  minHeight: '200px',
});

const messageBaseStyles: CSSProperties = {
  display: 'flex',
  gap: `${tokens.spacing[2]}px`,
  maxWidth: '85%',
};

const messageUserStyles: CSSProperties = {
  ...messageBaseStyles,
  alignSelf: 'flex-end',
  flexDirection: 'row-reverse',
};

const messageAssistantStyles: CSSProperties = {
  ...messageBaseStyles,
  alignSelf: 'flex-start',
};

const messageBubbleStyles: (isUser: boolean) => CSSProperties = (isUser) => ({
  padding: `${tokens.spacing[3]}px`,
  borderRadius: `${tokens.spacing[2]}px`,
  backgroundColor: isUser ? tokens.colors.background.surface : 'transparent',
  fontSize: tokens.fontSize.sm,
  lineHeight: tokens.lineHeight.normal,
  color: tokens.colors.text.default,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

const avatarStyles: CSSProperties = {
  width: `${tokens.spacing[8]}px`,
  height: `${tokens.spacing[8]}px`,
  borderRadius: '50%',
  backgroundColor: tokens.colors.background.elevated,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: tokens.fontSize.xs,
  color: tokens.colors.text.muted,
  flexShrink: 0,
};

const inputAreaStyles: CSSProperties = {
  display: 'flex',
  gap: `${tokens.spacing[2]}px`,
  padding: `${tokens.spacing[3]}px`,
  borderTop: `1px solid ${tokens.colors.border.default}`,
};

const inputStyles: CSSProperties = {
  flex: 1,
  padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
  border: `1px solid ${tokens.colors.border.default}`,
  borderRadius: `${tokens.spacing[2]}px`,
  backgroundColor: tokens.colors.background.surface,
  color: tokens.colors.text.default,
  fontFamily: tokens.fontFamily.sans,
  fontSize: tokens.fontSize.sm,
  resize: 'none',
  outline: 'none',
};

const sendButtonStyles: CSSProperties = {
  padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
  border: 'none',
  borderRadius: `${tokens.spacing[2]}px`,
  backgroundColor: tokens.colors.button.primary.bg,
  color: tokens.colors.button.primary.fg,
  fontFamily: tokens.fontFamily.sans,
  fontSize: tokens.fontSize.sm,
  fontWeight: tokens.fontWeight.medium,
  cursor: 'pointer',
};

const sendButtonDisabledStyles: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

const typingIndicatorStyles: CSSProperties = {
  fontSize: tokens.fontSize.xs,
  color: tokens.colors.text.muted,
  fontStyle: 'italic',
  padding: `${tokens.spacing[1]}px ${tokens.spacing[3]}px`,
};

const emptyStateStyles: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: tokens.colors.text.muted,
  fontSize: tokens.fontSize.sm,
  minHeight: '120px',
};

const timestampStyles: CSSProperties = {
  fontSize: tokens.fontSize.xs,
  color: tokens.colors.text.muted,
  marginTop: `${tokens.spacing[1]}px`,
};

const pendingStyles: CSSProperties = {
  opacity: 0.7,
};

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function Chat({
  messages,
  onSend,
  placeholder = 'Type a message...',
  loading = false,
  typingIndicator = true,
  avatar,
  userAvatar,
  maxHeight = '500px',
  showTimestamps = false,
  allowAttachments = false,
  allowMarkdown = true,
  emptyState,
  onMessageAction,
  sessionId,
  connected = true,
  pendingMessage,
  showHeader = false,
}: ChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [userWasAtBottom, setUserWasAtBottom] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAtBottom = (threshold = 100) => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  useEffect(() => {
    if (userWasAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, pendingMessage, userWasAtBottom]);

  const handleScroll = () => {
    setUserWasAtBottom(isAtBottom());
  };

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInputValue('');
    setUserWasAtBottom(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  const allMessages = pendingMessage ? [...messages, pendingMessage] : messages;

  return (
    <div data-component="chat" data-loading={loading || undefined} style={containerStyles}>
      {showHeader && (
        <div style={headerStyles}>
          <span>
            Chat{sessionId ? ` \u2022 session ${sessionId}` : ''}
          </span>
          <span
            style={{
              color: connected ? tokens.colors.status.alive : tokens.colors.status.eating,
            }}
          >
            {connected ? 'connected' : 'disconnected'}
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={messagesContainerStyles(maxHeight)}
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
      >
        {allMessages.length === 0 && !loading ? (
          <div style={emptyStateStyles}>{emptyState ?? 'No messages yet.'}</div>
        ) : (
          allMessages.map((msg) => {
            const isUser = msg.role === 'user';
            const bubbleStyle = isUser ? messageUserStyles : messageAssistantStyles;
            return (
              <div
                key={msg.id}
                role="article"
                aria-label={`${isUser ? 'User' : 'Assistant'} message`}
                style={{
                  ...bubbleStyle,
                  ...(pendingMessage?.id === msg.id ? pendingStyles : {}),
                }}
              >
                <div style={avatarStyles}>
                  {isUser ? (userAvatar ?? 'U') : (avatar ?? 'A')}
                </div>
                <div>
                  {msg.reasoningContent && (
                    <details style={{ marginBottom: `${tokens.spacing[2]}px` }}>
                      <summary style={{ cursor: 'pointer', fontSize: tokens.fontSize.xs, color: tokens.colors.text.muted }}>
                        Reasoning trace
                      </summary>
                      <pre style={{
                        fontSize: tokens.fontSize.xs,
                        color: tokens.colors.text.muted,
                        backgroundColor: tokens.colors.background.elevated,
                        padding: `${tokens.spacing[2]}px`,
                        borderRadius: `${tokens.spacing[1]}px`,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {msg.reasoningContent}
                      </pre>
                    </details>
                  )}
                  <div style={messageBubbleStyles(isUser)}>
                    {allowMarkdown ? msg.content : msg.content}
                  </div>
                  {showTimestamps && msg.timestamp && (
                    <div style={timestampStyles}>{formatTimestamp(msg.timestamp)}</div>
                  )}
                  {onMessageAction && msg.actions && msg.actions.length > 0 && (
                    <div style={{ display: 'flex', gap: `${tokens.spacing[1]}px`, marginTop: `${tokens.spacing[1]}px` }}>
                      {msg.actions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          style={{
                            fontSize: tokens.fontSize.xs,
                            background: 'none',
                            border: `1px solid ${tokens.colors.border.default}`,
                            borderRadius: `${tokens.spacing[1]}px`,
                            padding: `${tokens.spacing[0.5]}px ${tokens.spacing[1]}px`,
                            color: tokens.colors.text.muted,
                            cursor: 'pointer',
                          }}
                          onClick={() => onMessageAction(action, msg)}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {loading && typingIndicator && (
          <div style={typingIndicatorStyles}>AI is typing...</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form style={inputAreaStyles} onSubmit={handleSend}>
        <textarea
          ref={inputRef}
          style={inputStyles}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          aria-label="Message input"
        />
        <button
          type="submit"
          style={{
            ...sendButtonStyles,
            ...(!inputValue.trim() ? sendButtonDisabledStyles : {}),
          }}
          disabled={!inputValue.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
