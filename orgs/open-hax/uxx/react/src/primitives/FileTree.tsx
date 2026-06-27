/**
 * FileTree Component
 * 
 * Implements the file-tree.edn contract.
 * Hierarchical file navigation with expand/collapse and selection.
 */

import { 
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type CSSProperties,
  type MouseEvent
} from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export type FileTreeItemType = 'file' | 'folder';

export interface FileTreeItem {
  id: string;
  name: string;
  type: FileTreeItemType;
  icon?: ReactNode;
  children?: FileTreeItem[];
  meta?: Record<string, unknown>;
  badge?: string;
  modified?: Date;
  size?: number;
}

export interface FileTreeProps {
  /** Tree items to render */
  items: FileTreeItem[];
  /** ID of currently selected item */
  selectedId?: string;
  /** IDs of expanded folders */
  expandedIds?: string[];
  /** Callback when item is selected */
  onSelect?: (item: FileTreeItem) => void;
  /** Callback when folder is expanded */
  onExpand?: (item: FileTreeItem) => void;
  /** Callback when folder is collapsed */
  onCollapse?: (item: FileTreeItem) => void;
  /** Callback when item is double-clicked */
  onDoubleClick?: (item: FileTreeItem) => void;
  /** Callback for context menu */
  onContextMenu?: (item: FileTreeItem, event: MouseEvent) => void;
  /** Whether to show file/folder icons */
  showIcons?: boolean;
  /** Whether to show file sizes */
  showSize?: boolean;
  /** Indentation in pixels per level */
  indentSize?: number;
  /** Search query to filter/highlight items */
  search?: string;
  /** Whether multiple items can be selected */
  multiSelect?: boolean;
}

// Container styles
const containerStyles: CSSProperties = {
  fontFamily: tokens.fontFamily.sans,
  fontSize: tokens.fontSize.sm,
  lineHeight: 1.4,
  color: tokens.colors.text.default,
  userSelect: 'none',
};

// Item styles
const itemStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: `${tokens.spacing[1]}px`,
  padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
  cursor: 'pointer',
  borderRadius: `${tokens.spacing[1]}px`,
  transition: tokens.transitions.colors,
};

// Item hover styles
const itemHoverStyles: CSSProperties = {
  backgroundColor: tokens.colors.background.surface,
};

// Item selected styles
const itemSelectedStyles: CSSProperties = {
  backgroundColor: tokens.colors.background.elevated,
};

// Folder icon styles
const folderIconStyles: CSSProperties = {
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
  color: tokens.colors.text.muted,
  transition: 'transform 0.15s ease',
};

// File icon styles
const fileIconStyles: CSSProperties = {
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
};

// Badge styles
const badgeStyles: CSSProperties = {
  marginLeft: 'auto',
  padding: '1px 4px',
  backgroundColor: tokens.colors.background.surface,
  borderRadius: '3px',
  fontSize: '10px',
  color: tokens.colors.text.muted,
};

// Size text styles
const sizeStyles: CSSProperties = {
  marginLeft: 'auto',
  fontSize: '10px',
  color: tokens.colors.text.muted,
};

// Default file icons by extension
const fileIcons: Record<string, string> = {
  js: 'JS',
  ts: 'TS',
  tsx: 'TSX',
  jsx: 'JSX',
  json: '{ }',
  md: 'MD',
  css: 'CSS',
  html: 'HTML',
  py: 'PY',
  rs: 'RS',
  go: 'GO',
  java: '☕',
  cljs: 'CLJ',
  edn: 'EDN',
  yaml: 'YML',
  yml: 'YML',
  txt: 'TXT',
  git: 'GIT',
  default: '📄',
};

// Get file icon by name
const getFileIcon = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return fileIcons[ext] || fileIcons.default;
};

// Format file size
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

/**
 * Hierarchical file navigation.
 * 
 * @example
 * ```tsx
 * const items = [
 *   { id: 'src', name: 'src', type: 'folder', children: [
 *     { id: 'index.ts', name: 'index.ts', type: 'file' }
 *   ]},
 *   { id: 'package.json', name: 'package.json', type: 'file' }
 * ];
 * 
 * <FileTree
 *   items={items}
 *   onSelect={(item) => console.log('Selected:', item)}
 *   onDoubleClick={(item) => console.log('Open:', item)}
 * />
 * ```
 */
export function FileTree({
  items,
  selectedId,
  expandedIds: controlledExpandedIds,
  onSelect,
  onExpand,
  onCollapse,
  onDoubleClick,
  onContextMenu,
  showIcons = true,
  showSize = false,
  indentSize = 16,
  search,
  multiSelect = false,
}: FileTreeProps) {
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(new Set());
  const expandedIds = controlledExpandedIds ? new Set(controlledExpandedIds) : internalExpandedIds;

  const toggleExpand = useCallback((item: FileTreeItem) => {
    if (item.type !== 'folder') return;
    
    const isExpanded = expandedIds.has(item.id);
    
    if (isExpanded) {
      if (!controlledExpandedIds) {
        setInternalExpandedIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
      onCollapse?.(item);
    } else {
      if (!controlledExpandedIds) {
        setInternalExpandedIds(prev => new Set(prev).add(item.id));
      }
      onExpand?.(item);
    }
  }, [expandedIds, controlledExpandedIds, onExpand, onCollapse]);

  // Filter items by search
  const filterItems = useCallback((items: FileTreeItem[], query: string): FileTreeItem[] => {
    if (!query) return items;
    
    const lowerQuery = query.toLowerCase();
    
    return items.reduce<FileTreeItem[]>((acc, item) => {
      const nameMatches = item.name.toLowerCase().includes(lowerQuery);
      
      if (item.type === 'folder' && item.children) {
        const filteredChildren = filterItems(item.children, query);
        if (filteredChildren.length > 0 || nameMatches) {
          acc.push({ ...item, children: filteredChildren });
        }
      } else if (nameMatches) {
        acc.push(item);
      }
      
      return acc;
    }, []);
  }, []);

  const filteredItems = useMemo(() => 
    search ? filterItems(items, search) : items,
    [items, search, filterItems]
  );

  // Highlight search match
  const highlightMatch = (text: string, query: string): ReactNode => {
    if (!query) return text;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.slice(0, index)}
        <span style={{ backgroundColor: tokens.colors.alpha.green._30 }}>
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  // Render item recursively
  const renderItem = (item: FileTreeItem, depth: number): ReactNode => {
    const isFolder = item.type === 'folder';
    const isExpanded = expandedIds.has(item.id);
    const isSelected = selectedId === item.id;
    
    return (
      <div key={item.id}>
        <div
          data-component="file-tree-item"
          data-type={item.type}
          data-selected={isSelected || undefined}
          data-expanded={isExpanded || undefined}
          style={{
            ...itemStyles,
            paddingLeft: `${tokens.spacing[2] + depth * indentSize}px`,
            ...(isSelected ? itemSelectedStyles : {}),
          }}
          onClick={() => {
            onSelect?.(item);
            if (isFolder) toggleExpand(item);
          }}
          onDoubleClick={() => onDoubleClick?.(item)}
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenu?.(item, e);
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = tokens.colors.background.surface;
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {isFolder && (
            <span style={{
              ...folderIconStyles,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>
              ▶
            </span>
          )}
          
          {showIcons && (
            <span style={fileIconStyles}>
              {item.icon || (isFolder ? '📁' : getFileIcon(item.name))}
            </span>
          )}
          
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {search ? highlightMatch(item.name, search) : item.name}
          </span>
          
          {item.badge && <span style={badgeStyles}>{item.badge}</span>}
          
          {showSize && item.size !== undefined && (
            <span style={sizeStyles}>{formatSize(item.size)}</span>
          )}
        </div>
        
        {isFolder && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div data-component="file-tree" style={containerStyles}>
      {filteredItems.map(item => renderItem(item, 0))}
    </div>
  );
}

export default FileTree;
