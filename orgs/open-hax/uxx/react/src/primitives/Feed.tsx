import React, { useState, useMemo, useCallback } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

export interface FeedItem {
  id: string;
  type: 'message' | 'file' | 'commit' | 'agent' | 'system' | 'user' | 'notification';
  title?: string;
  content: string;
  timestamp: Date | string;
  author?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  icon?: React.ReactNode;
  badge?: string;
  actions?: string[];
  meta?: Record<string, unknown>;
  read?: boolean;
  file?: {
    name: string;
    path: string;
    status?: 'added' | 'modified' | 'deleted' | 'renamed';
  };
  diff?: {
    additions: number;
    deletions: number;
  };
}

export interface FeedProps {
  items: FeedItem[];
  variant?: 'timeline' | 'cards' | 'list' | 'compact';
  groupBy?: 'none' | 'date' | 'hour' | 'session' | 'agent';
  showTimestamp?: boolean;
  relativeTime?: boolean;
  infiniteScroll?: boolean;
  onLoadMore?: () => void;
  onItemClick?: (item: FeedItem) => void;
  onItemAction?: (action: string, item: FeedItem) => void;
  emptyState?: React.ReactNode;
  loading?: boolean;
  markRead?: (itemIds: string[]) => void;
  className?: string;
}

// Relative time formatter
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return then.toLocaleDateString();
}

// Group items by date
function groupByDate(items: FeedItem[], groupBy: string): Map<string, FeedItem[]> {
  const groups = new Map<string, FeedItem[]>();
  
  items.forEach((item) => {
    const date = new Date(item.timestamp);
    let key: string;
    
    switch (groupBy) {
      case 'hour':
        key = `${date.toLocaleDateString()} ${date.getHours()}:00`;
        break;
      case 'session':
        key = `Session ${Math.floor(date.getTime() / (4 * 60 * 60 * 1000))}`;
        break;
      case 'agent':
        key = item.author?.name || 'System';
        break;
      case 'date':
      default:
        key = date.toLocaleDateString();
    }
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });
  
  return groups;
}

// Get icon for item type
function getTypeIcon(type: FeedItem['type']): string {
  switch (type) {
    case 'message': return '💬';
    case 'file': return '📄';
    case 'commit': return '🔖';
    case 'agent': return '🤖';
    case 'system': return '⚙️';
    case 'user': return '👤';
    case 'notification': return '🔔';
    default: return '•';
  }
}

// Get file status icon
function getFileStatusIcon(status?: string): string {
  switch (status) {
    case 'added': return '+';
    case 'modified': return '~';
    case 'deleted': return '-';
    case 'renamed': return '→';
    default: return '';
  }
}

// Get file status color
function getFileStatusColor(status?: string): string {
  switch (status) {
    case 'added': return tokens.colors.accent.cyan;
    case 'modified': return tokens.colors.accent.orange;
    case 'deleted': return tokens.colors.accent.red;
    default: return tokens.colors.text.muted;
  }
}

export const Feed: React.FC<FeedProps> = ({
  items,
  variant = 'timeline',
  groupBy = 'date',
  showTimestamp = true,
  relativeTime = true,
  infiniteScroll = false,
  onLoadMore,
  onItemClick,
  onItemAction,
  emptyState,
  loading = false,
  markRead,
  className,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  const groupedItems = useMemo(
    () => groupBy !== 'none' ? groupByDate(items, groupBy) : new Map([['All', items]]),
    [items, groupBy]
  );
  
  const handleItemClick = useCallback(
    (item: FeedItem) => {
      onItemClick?.(item);
      if (!item.read && markRead) {
        markRead([item.id]);
      }
    },
    [onItemClick, markRead]
  );
  
  const handleItemAction = useCallback(
    (e: React.MouseEvent, action: string, item: FeedItem) => {
      e.stopPropagation();
      onItemAction?.(action, item);
    },
    [onItemAction]
  );
  
  const toggleExpand = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);
  
  const renderItem = (item: FeedItem, index: number): React.ReactNode => {
    const isExpanded = expandedItems.has(item.id);
    const isTimeline = variant === 'timeline';
    const isCompact = variant === 'compact';
    
    return (
      <div
        key={item.id}
        data-item-id={item.id}
        data-item-type={item.type}
        data-read={item.read}
        onClick={() => handleItemClick(item)}
        style={{
          display: 'flex',
          gap: isCompact ? 8 : 12,
          padding: isCompact ? '8px 12px' : '12px 16px',
          background: variant === 'cards' ? tokens.colors.background.surface : 'transparent',
          borderRadius: variant === 'cards' ? tokens.spacing[2] : 0,
          border: variant === 'cards' ? `1px solid ${tokens.colors.border.default}` : 'none',
          marginBottom: variant === 'cards' ? 8 : 0,
          cursor: onItemClick ? 'pointer' : 'default',
          opacity: item.read ? 0.7 : 1,
          position: 'relative',
        }}
      >
        {/* Unread indicator */}
        {!item.read && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: tokens.colors.accent.cyan,
              borderRadius: '0 2px 2px 0',
            }}
          />
        )}
        
        {/* Timeline connector */}
        {isTimeline && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 24,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: tokens.colors.background.surface,
                border: `2px solid ${tokens.colors.border.default}`,
              }}
            />
            {index < items.length - 1 && (
              <div
                style={{
                  width: 2,
                  flex: 1,
                  background: tokens.colors.border.default,
                  marginTop: 4,
                }}
              />
            )}
          </div>
        )}
        
        {/* Avatar or Icon */}
        {!isTimeline && (
          <div
            style={{
              width: isCompact ? 24 : 32,
              height: isCompact ? 24 : 32,
              borderRadius: '50%',
              background: item.author?.avatar
                ? undefined
                : tokens.colors.background.surface,
              border: `1px solid ${tokens.colors.border.default}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isCompact ? 12 : 14,
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {item.author?.avatar ? (
              <img
                src={item.author.avatar}
                alt={item.author.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              item.icon || getTypeIcon(item.type)
            )}
          </div>
        )}
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            {item.author && (
              <span
                style={{
                  fontWeight: 500,
                  color: tokens.colors.text.default,
                }}
              >
                {item.author.name}
              </span>
            )}
            {item.badge && (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  background: tokens.colors.background.elevated,
                  borderRadius: 4,
                  color: tokens.colors.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {item.badge}
              </span>
            )}
            {showTimestamp && (
              <span
                style={{
                  fontSize: 12,
                  color: tokens.colors.text.subtle,
                  marginLeft: 'auto',
                }}
              >
                {relativeTime
                  ? formatRelativeTime(item.timestamp)
                  : new Date(item.timestamp).toLocaleString()}
              </span>
            )}
          </div>
          
          {/* Title */}
          {item.title && (
            <div
              style={{
                fontWeight: 500,
                marginBottom: 4,
                color: tokens.colors.text.default,
              }}
            >
              {item.title}
            </div>
          )}
          
          {/* Content */}
          <div
            style={{
              fontSize: isCompact ? 12 : 14,
              color: tokens.colors.text.muted,
              lineHeight: 1.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
            }}
            onClick={(e) => {
              if (!isExpanded && item.content.length > 100) {
                e.stopPropagation();
                toggleExpand(item.id);
              }
            }}
          >
            {item.content}
          </div>
          
          {/* File info */}
          {item.file && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
                padding: '4px 8px',
                background: tokens.colors.background.elevated,
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <span
                style={{
                  color: getFileStatusColor(item.file.status),
                  fontWeight: 600,
                }}
              >
                {getFileStatusIcon(item.file.status)}
              </span>
              <span style={{ color: tokens.colors.text.default }}>
                {item.file.name}
              </span>
              <span style={{ color: tokens.colors.text.subtle }}>
                {item.file.path}
              </span>
            </div>
          )}
          
          {/* Diff stats */}
          {item.diff && (
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 8,
                fontSize: 12,
              }}
            >
              <span style={{ color: tokens.colors.accent.cyan }}>
                +{item.diff.additions}
              </span>
              <span style={{ color: tokens.colors.accent.red }}>
                -{item.diff.deletions}
              </span>
            </div>
          )}
          
          {/* Actions */}
          {item.actions && item.actions.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 8,
              }}
            >
              {item.actions.map((action) => (
                <button
                  key={action}
                  onClick={(e) => handleItemAction(e, action, item)}
                  style={{
                    background: 'none',
                    border: `1px solid ${tokens.colors.border.default}`,
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 12,
                    color: tokens.colors.text.muted,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  if (items.length === 0) {
    return (
      <div
        className={className}
        data-component="feed"
        data-empty
        style={{
          padding: 32,
          textAlign: 'center',
          color: tokens.colors.text.muted,
        }}
      >
        {emptyState || 'No activity yet'}
      </div>
    );
  }
  
  return (
    <div
      className={className}
      data-component="feed"
      data-variant={variant}
      role="feed"
      aria-label="Activity feed"
      style={{
        overflow: 'auto',
        maxHeight: infiniteScroll ? '80vh' : undefined,
      }}
    >
      {Array.from(groupedItems.entries()).map(([groupName, groupItems]) => (
        <div key={groupName}>
          {groupBy !== 'none' && (
            <div
              style={{
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 500,
                color: tokens.colors.text.subtle,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: tokens.colors.background.default,
                position: 'sticky',
                top: 0,
                zIndex: 1,
                borderBottom: `1px solid ${tokens.colors.border.default}`,
              }}
            >
              {groupName} ({groupItems.length})
            </div>
          )}
          {groupItems.map(renderItem)}
        </div>
      ))}
      
      {loading && (
        <div
          style={{
            padding: 16,
            textAlign: 'center',
            color: tokens.colors.text.muted,
          }}
        >
          Loading...
        </div>
      )}
      
      {infiniteScroll && onLoadMore && !loading && (
        <button
          onClick={onLoadMore}
          style={{
            width: '100%',
            padding: 12,
            background: 'transparent',
            border: 'none',
            borderTop: `1px solid ${tokens.colors.border.default}`,
            color: tokens.colors.text.muted,
            cursor: 'pointer',
          }}
        >
          Load more
        </button>
      )}
    </div>
  );
};

export default Feed;
